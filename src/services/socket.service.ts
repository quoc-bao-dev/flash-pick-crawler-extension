import { io, Socket } from "socket.io-client";

class SocketService {
  public socket: Socket | null = null;
  private isConnecting = false;

  async connect(wssUrl: string, info: { extensionId: string; extensionName: string }) {
    if (this.socket?.connected || this.isConnecting) return;

    this.isConnecting = true;
    console.log("[SocketService] Connecting to:", wssUrl);

    this.socket = io(wssUrl, {
      query: { 
        extensionId: info.extensionId,
        extensionName: info.extensionName 
      },
      transports: ['websocket'], // Quan trọng cho Chrome Extension để tránh lỗi CORS/Polling
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      this.isConnecting = false;
      console.log("[SocketService] Connected with ID:", this.socket?.id);
    });

    this.socket.on("disconnect", () => {
      console.log("[SocketService] Disconnected");
    });

    this.socket.on("connect_error", (error) => {
      this.isConnecting = false;
      console.error("[SocketService] Connection error:", error);
    });

    // Listen for commands from Controller Service
    this.socket.on("action", (data: { action: string; payload?: any }) => {
      console.log("[SocketService] Received action:", data);
      chrome.runtime.sendMessage({ action: "SOCKET_ACTION", data });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
