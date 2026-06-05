#include "lwip/sockets.h"

void send_udp_broadcast_task(void *pvParameters) {
    int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_IP);
    
    struct sockaddr_in dest_addr;
    dest_addr.sin_addr.s_addr = htonl(INADDR_BROADCAST); // Изпраща до всички в мрежата
    dest_addr.sin_family = AF_INET;
    dest_addr.sin_port = htons(41234); // Същият порт като в Node.js

    // Взимаме нашето IP адрес под формата на низ (напр. "192.168.1.105")
    char ip_str[16];
    // (тук използваш твоята функция за вземане на текущото IP от Wi-Fi драйвера)

    char payload[64];
    snprintf(payload, sizeof(payload), "ESP32_IDENT:http://%s", ip_str);

    while (1) {
        sendto(sock, payload, strlen(payload), 0, (struct sockaddr *)&dest_addr, sizeof(dest_addr));
        vTaskDelay(pdMS_TO_TICKS(5000)); // Изпращай на всеки 5 секунди
    }
}
