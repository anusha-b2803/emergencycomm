// emergencycomm/bridge/server.js
// Standalone WebSocket Server (ready for Render)

const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 5050;

const app = express();
const server = http.createServer(app);

// Serve the static React build folder in production
app.use(express.static(path.join(__dirname, '../build')));

// Catch-all route to serve React's index.html for client-side routing (Express 5 compatible)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Attach WebSocket server to the Express HTTP server
const wss = new WebSocket.Server({ server });

// Helper: send JSON on ws safely
function wsSend(ws, obj) {
  try {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  } catch (err) {
    console.error('Error sending WS message:', err);
  }
}

// For each ws client, handle messages
wss.on('connection', (ws, req) => {
  console.log('✅ New client connected from', req.socket.remoteAddress);

  ws.on('message', async (data) => {
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (err) {
      console.warn('Received non-JSON or malformed message:', data);
      return wsSend(ws, { ok: false, error: 'malformed_json' });
    }

    const msgId = parsed.id || uuidv4();
    const payload = parsed.payload ?? parsed;

    // Simulate the C Server's behavior by "acknowledging" the message instantly.
    wsSend(ws, { ack: true, id: msgId });
    
    // Simulate processing time, then send the "OK" response
    setTimeout(() => {
        const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const responseBytes = Buffer.byteLength(payloadStr, 'utf8');
        const simulatedCServerResponse = `OK: received ${responseBytes} bytes`;
        
        wsSend(ws, { ok: true, id: msgId, response: simulatedCServerResponse });
    }, 100); 

  }); // ws.on message

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  ws.on('close', (code, reason) => {
    console.log('Client disconnected', code, reason && reason.toString ? reason.toString() : reason);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Bridge & WebSocket server is running on port ${PORT}`);
});

function shutdown() {
  console.log('Shutting down server...');
  try {
    server.close();
    wss.close(() => {
      console.log('WebSocket server closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 3000);
  } catch (err) {
    process.exit(1);
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
