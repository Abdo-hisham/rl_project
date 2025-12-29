import type { ConnectionStatus, WebSocketMessage } from '../types';

type MessageHandler = (message: WebSocketMessage) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private messageHandler: MessageHandler | null = null;
  private statusHandler: ((status: ConnectionStatus) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.updateStatus('connecting');

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          if (this.messageHandler) {
            this.messageHandler(message);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.socket.onclose = () => {
        this.updateStatus('disconnected');
        this.attemptReconnect();
      };

      this.socket.onerror = () => {
        this.updateStatus('error');
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
      this.updateStatus('error');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.updateStatus('disconnected');
  }

  send(message: WebSocketMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): void {
    this.statusHandler = handler;
  }

  private updateStatus(status: ConnectionStatus): void {
    if (this.statusHandler) {
      this.statusHandler(status);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  getStatus(): ConnectionStatus {
    if (!this.socket) return 'disconnected';
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      default:
        return 'disconnected';
    }
  }
}

const WS_BASE = 'ws://127.0.0.1:8000/ws';

export const createEnvironmentSocket = () => new WebSocketService(`${WS_BASE}/environment/`);
export const createTrainingSocket = () => new WebSocketService(`${WS_BASE}/training/`);
export const createPolicySocket = () => new WebSocketService(`${WS_BASE}/policy/`);

export default WebSocketService;
