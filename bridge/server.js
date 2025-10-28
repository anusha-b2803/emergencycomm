// emergencycomm/bridge/server.js
// WebSocket -> TCP bridge with robust error handling and acknowledgements.

const WebSocket = require('ws');
const net = require('net');
const { v4: uuidv4 } = require('uuid');

const WS_PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 5000;
const TCP_HOST = process.env.TCP_HOST || '127.0.0.1';
const TCP_PORT = process.env.TCP_PORT ? Number(process.env.TCP_PORT) : 8080;
const TCP_TIMEOUT_MS = 5000; // timeout for TCP responses

// Setup global error handlers
process.on('unhandledRejection', (reason, p) => {
  console.error('[unhandledRejection] Reason:', reason, 'Promise:', p);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  // optional: process.exit(1)
});

const wss = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`🌐 WebSocket bridge listening on ws://localhost:${WS_PORT}`);
  console.log(`🔁 will forward messages to TCP ${TCP_HOST}:${TCP_PORT}`);
});

// Helper: send JSON on ws safely
function wsSend(ws, obj) {
  try {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  } catch (err) {
    console.error('Error sending WS message:', err);
  }
}

// For each ws client, handle messages and forward to TCP server
wss.on('connection', (ws, req) => {
  console.log('✅ WebSocket client connected from', req.socket.remoteAddress);

  ws.on('message', async (data) => {
    // Expect JSON with at least { type, payload, id? }
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (err) {
      console.warn('Received non-JSON or malformed message from client:', data);
      return wsSend(ws, { ok: false, error: 'malformed_json' });
    }

    const msgId = parsed.id || uuidv4();
    const payload = parsed.payload ?? parsed; // allow raw messages too

    // Send immediate ack to client (received by bridge)
    wsSend(ws, { ack: true, id: msgId });

    // Open a short-lived TCP connection to the C server for each message
    const tcp = new net.Socket();
    let tcpTimer = null;
    let responded = false;

    function cleanUp() {
      if (tcpTimer) {
        clearTimeout(tcpTimer);
        tcpTimer = null;
      }
      try { tcp.destroy(); } catch (e) {}
    }

    tcp.setTimeout(TCP_TIMEOUT_MS);

    tcp.on('error', (err) => {
      console.error('[tcp][error]', err);
      if (!responded) {
        responded = true;
        wsSend(ws, { ok: false, id: msgId, error: 'tcp_error', detail: String(err) });
      }
      cleanUp();
    });

    tcp.on('timeout', () => {
      console.error('[tcp][timeout] no response within', TCP_TIMEOUT_MS, 'ms');
      if (!responded) {
        responded = true;
        wsSend(ws, { ok: false, id: msgId, error: 'tcp_timeout' });
      }
      cleanUp();
    });

    tcp.on('data', (chunk) => {
      // Assume C server replies with a newline-terminated JSON or plain message
      if (responded) return;
      responded = true;
      const raw = chunk.toString('utf8').trim();
      wsSend(ws, { ok: true, id: msgId, response: raw });
      cleanUp();
    });

    tcp.on('close', (hadErr) => {
      if (!responded && hadErr) {
        responded = true;
        wsSend(ws, { ok: false, id: msgId, error: 'tcp_closed_with_error' });
      }
    });

    // Connect and send:
    tcp.connect(TCP_PORT, TCP_HOST, () => {
      try {
        const outStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
        // ensure newline termination for the C server read
        const toSend = outStr.endsWith('\n') ? outStr : outStr + '\n';
        tcp.write(toSend, (err) => {
          if (err) {
            console.error('[tcp][write] error', err);
            if (!responded) {
              responded = true;
              wsSend(ws, { ok: false, id: msgId, error: 'tcp_write_failed', detail: String(err) });
            }
            cleanUp();
          } else {
            // wait for response on 'data' or timeout
            tcpTimer = setTimeout(() => {
              if (!responded) {
                responded = true;
                wsSend(ws, { ok: false, id: msgId, error: 'tcp_response_timeout' });
              }
              cleanUp();
            }, TCP_TIMEOUT_MS);
          }
        });
      } catch (err) {
        console.error('Error preparing TCP payload', err);
        if (!responded) {
          responded = true;
          wsSend(ws, { ok: false, id: msgId, error: 'payload_error', detail: String(err) });
        }
        cleanUp();
      }
    });
  }); // ws.on message

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  ws.on('close', (code, reason) => {
    console.log('WebSocket closed', code, reason && reason.toString ? reason.toString() : reason);
  });
});

// graceful shutdown
function shutdown() {
  console.log('Shutting down bridge server...');
  try {
    wss.close(() => {
      console.log('WebSocket server closed.');
      process.exit(0);
    });
    // force exit after timeout
    setTimeout(() => process.exit(0), 3000);
  } catch (err) {
    console.error('Shutdown error', err);
    process.exit(1);
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
