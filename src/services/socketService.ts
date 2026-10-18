// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { socketActions } from '../Store/socketStore';
import { loginGetters } from '../Store/loginStore';
import { logApiRequest, logApiResponse } from '../utils/apiLogger';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private pendingConnect: Promise<boolean> | null = null;
  private responseLoggingAttached = false;
  private emitLoggingAttached = false;

  private readonly SERVER_URL = 'https://paitza.com';
  private readonly SOCKET_PATH = '/socket.io2/';

  private attachResponseLogging(socket: Socket) {
    if (this.responseLoggingAttached) return;
    this.responseLoggingAttached = true;
    socket.onAny((event: string, ...args: unknown[]) => {
      logApiResponse('socket', event, args.length <= 1 ? args[0] : args);
    });
  }

  /** Логирует параметры всех исходящих emit, в т.ч. прямых socket.emit(...) */
  private attachEmitLogging(socket: Socket) {
    if (this.emitLoggingAttached) return;
    this.emitLoggingAttached = true;
    const originalEmit = socket.emit.bind(socket);
    socket.emit = ((event: string, ...args: unknown[]) => {
      if (typeof event === 'string') {
        logApiRequest('socket', event, args.length <= 1 ? args[0] : args);
      }
      return originalEmit(event, ...args);
    }) as typeof socket.emit;
  }

  connect(token: string): Promise<boolean> {
    if (this.socket?.connected) {
      return Promise.resolve(true);
    }
    if (this.pendingConnect) return this.pendingConnect;

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.responseLoggingAttached = false;
      this.emitLoggingAttached = false;
    }

    socketActions.setConnecting(true);

    this.pendingConnect = new Promise((resolve, reject) => {
      const finish = () => {
        this.pendingConnect = null;
      };

      this.socket = io(this.SERVER_URL, {
        path: this.SOCKET_PATH,
        auth: { token },
        transports: ['polling', 'websocket'],
        withCredentials: true,
      });

      this.attachEmitLogging(this.socket);
      this.attachResponseLogging(this.socket);

      const handleConnect = () => {
        this.isConnected = true;
        this.socket?.off('connect', handleConnect);
        this.socket?.off('connect_error', handleError);

        socketActions.setConnected(true);
        socketActions.setConnecting(false);

        if (loginGetters.isAuthenticated()) {
          this.emit('re_authorize', { token: loginGetters.getToken() });
        }

        finish();
        resolve(true);
      };
      const handleDisconnect = () => {
        this.isConnected = false;
        socketActions.setConnected(false);
        this.socket?.off('disconnect', handleDisconnect);

        socketActions.setConnecting(false);

        finish();
        resolve(true);
      };
      const handleError = (error: any) => {
        console.error('Ошибка подключения:', error);
        this.socket?.off('connect', handleConnect);
        this.socket?.off('connect_error', handleError);

        socketActions.updateStatus(false, false);

        finish();
        reject(error);
      };

      this.socket.once('disconnect', handleDisconnect);
      this.socket.once('connect', handleConnect);
      this.socket.once('connect_error', handleError);
    });

    return this.pendingConnect;
  }

  emit(eventName: string, data: any): boolean {
    if (!this.socket?.connected) {
      console.error('Socket не подключен');
      return false;
    }

    this.socket.emit(eventName, data);
    return true;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.pendingConnect = null;
      this.responseLoggingAttached = false;
      this.emitLoggingAttached = false;
    }
    socketActions.updateStatus(false, false);
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
    };
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
