// emergencycomm/c-server/server.c
// Simple TCP server: listens on 8080, echoes back a response per newline-terminated message.
// Compile with: gcc -o server server.c

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>

#define PORT 8080
#define BACKLOG 10
#define BUF_SIZE 4096

static int listen_fd = -1;

void handle_sigint(int sig) {
    (void)sig;
    if (listen_fd >= 0) {
        close(listen_fd);
        fprintf(stderr, "\n[server] Shutting down (SIGINT)\n");
    }
    exit(0);
}

int main(void) {
    signal(SIGINT, handle_sigint);

    listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (listen_fd < 0) {
        perror("socket");
        return 1;
    }

    int opt = 1;
    if (setsockopt(listen_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        perror("setsockopt");
        // not fatal; continue
    }

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(PORT);

    if (bind(listen_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(listen_fd);
        return 1;
    }

    if (listen(listen_fd, BACKLOG) < 0) {
        perror("listen");
        close(listen_fd);
        return 1;
    }

    fprintf(stderr, "[server] Listening on port %d\n", PORT);

    while (1) {
        struct sockaddr_in client;
        socklen_t clientlen = sizeof(client);
        int conn = accept(listen_fd, (struct sockaddr*)&client, &clientlen);
        if (conn < 0) {
            if (errno == EINTR) continue; // interrupted by signal
            perror("accept");
            continue;
        }

        fprintf(stderr, "[server] Accepted new connection (fd=%d)\n", conn);

        // For simplicity, read until '\n' or buffer full, then respond.
        char buf[BUF_SIZE];
        ssize_t total = 0;
        ssize_t n;
        int found_newline = 0;

        while ((n = recv(conn, buf + total, BUF_SIZE - total - 1, 0)) > 0) {
            total += n;
            buf[total] = '\0';
            if (strchr(buf, '\n') != NULL) { found_newline = 1; break; }
            if (total >= BUF_SIZE - 1) break;
        }
        if (n < 0) {
            perror("recv");
            close(conn);
            continue;
        }
        if (total == 0) {
            fprintf(stderr, "[server] client closed connection (fd=%d)\n", conn);
            close(conn);
            continue;
        }

        // Trim newline(s)
        while (total > 0 && (buf[total-1] == '\n' || buf[total-1] == '\r')) {
            buf[--total] = '\0';
        }

        // Process input (in this example, just log and respond)
        fprintf(stderr, "[server] Received (fd=%d): %s\n", conn, buf);

        // Example: produce a simple response (could be JSON)
        char resp[BUF_SIZE];
        int r = snprintf(resp, sizeof(resp), "OK: received %zd bytes\n", total);
        if (r < 0) {
            perror("snprintf");
            close(conn);
            continue;
        }

        ssize_t sent = send(conn, resp, (size_t)r, 0);
        if (sent < 0) {
            perror("send");
            close(conn);
            continue;
        }

        // Close connection after replying
        close(conn);
        fprintf(stderr, "[server] Response sent and connection closed (fd=%d)\n", conn);
    }

    // never reached in this simple loop; but clean up if we exit
    close(listen_fd);
    return 0;
}
