// emergencycomm/c-server/client.c
// Simple client: connect, send a message (arg or stdin), print server reply.
// Compile: gcc -o client client.c

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define TCP_PORT 8080
#define BUF_SIZE 4096

int main(int argc, char **argv) {
    const char* host = "127.0.0.1";
    int port = TCP_PORT;

    char sendbuf[BUF_SIZE];
    if (argc >= 2) {
        strncpy(sendbuf, argv[1], BUF_SIZE-1);
        sendbuf[BUF_SIZE-1] = '\0';
    } else {
        printf("Enter message to send (single line), then ENTER:\n");
        if (!fgets(sendbuf, sizeof(sendbuf), stdin)) {
            fprintf(stderr, "No input\n");
            return 1;
        }
    }

    // ensure newline termination
    size_t len = strlen(sendbuf);
    if (sendbuf[len-1] != '\n') {
        if (len + 1 < BUF_SIZE) {
            sendbuf[len] = '\n';
            sendbuf[len+1] = '\0';
            len++;
        }
    }

    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        perror("socket");
        return 1;
    }

    struct sockaddr_in serv;
    memset(&serv, 0, sizeof(serv));
    serv.sin_family = AF_INET;
    serv.sin_port = htons(port);
    if (inet_pton(AF_INET, host, &serv.sin_addr) <= 0) {
        perror("inet_pton");
        close(sock);
        return 1;
    }

    if (connect(sock, (struct sockaddr*)&serv, sizeof(serv)) < 0) {
        perror("connect");
        close(sock);
        return 1;
    }

    ssize_t w = write(sock, sendbuf, strlen(sendbuf));
    if (w < 0) {
        perror("write");
        close(sock);
        return 1;
    }

    // read response
    char resp[BUF_SIZE];
    ssize_t r = read(sock, resp, sizeof(resp)-1);
    if (r < 0) {
        perror("read");
        close(sock);
        return 1;
    }
    resp[r] = '\0';
    printf("Server replied: %s\n", resp);

    close(sock);
    return 0;
}
