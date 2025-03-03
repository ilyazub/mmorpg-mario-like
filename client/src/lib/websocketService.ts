interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface PlayerData {
  id: string;
  position: [number, number, number];
  character: string;
  color: string;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 2000;
  private isConnecting = false;
  private messageQueue: string[] = [];
  
  // Callbacks
  private onOpenCallbacks: Array<() => void> = [];
  private onCloseCallbacks: Array<() => void> = [];
  private onErrorCallbacks: Array<(error: Event) => void> = [];
  private onMessageCallbacks: Array<(data: any) => void> = [];
  private onPlayerJoinCallbacks: Array<(playerData: PlayerData) => void> = [];
  private onPlayerLeaveCallbacks: Array<(playerId: string) => void> = [];
  private onPlayerMoveCallbacks: Array<(playerId: string, position: [number, number, number]) => void> = [];
  
  constructor() {
    this.setupSocket = this.setupSocket.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
  }
  
  public connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) return;
    
    this.isConnecting = true;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Process any queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          if (message) this.socket?.send(message);
        }
        
        this.onOpenCallbacks.forEach(callback => callback());
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        this.socket = null;
        this.isConnecting = false;
        
        this.onCloseCallbacks.forEach(callback => callback());
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          this.attemptReconnect();
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onErrorCallbacks.forEach(callback => callback(error));
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Call general message callbacks
          this.onMessageCallbacks.forEach(callback => callback(data));
          
          // Handle specific message types
          switch (data.type) {
            case 'playerJoined':
              this.onPlayerJoinCallbacks.forEach(callback => 
                callback(data.player)
              );
              break;
            case 'playerLeft':
              this.onPlayerLeaveCallbacks.forEach(callback => 
                callback(data.playerId)
              );
              break;
            case 'playerMoved':
              this.onPlayerMoveCallbacks.forEach(callback => 
                callback(data.playerId, data.position)
              );
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
  
  public sendMessage(type: string, data: any = {}): void {
    const message = JSON.stringify({
      type,
      ...data,
      timestamp: Date.now()
    });
    
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      // Queue message to be sent when connected
      this.messageQueue.push(message);
      
      // If not connecting, attempt to connect
      if (!this.isConnecting) {
        this.connect();
      }
    }
  }
  
  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
  
  public setupSocket(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.connect();
    }
  }
  
  // Event registering methods
  public onOpen(callback: () => void): () => void {
    this.onOpenCallbacks.push(callback);
    return () => {
      this.onOpenCallbacks = this.onOpenCallbacks.filter(cb => cb !== callback);
    };
  }
  
  public onClose(callback: () => void): () => void {
    this.onCloseCallbacks.push(callback);
    return () => {
      this.onCloseCallbacks = this.onCloseCallbacks.filter(cb => cb !== callback);
    };
  }
  
  public onError(callback: (error: Event) => void): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter(cb => cb !== callback);
    };
  }
  
  public onMessage(callback: (data: any) => void): () => void {
    this.onMessageCallbacks.push(callback);
    return () => {
      this.onMessageCallbacks = this.onMessageCallbacks.filter(cb => cb !== callback);
    };
  }
  
  public onPlayerJoin(callback: (playerData: PlayerData) => void): () => void {
    this.onPlayerJoinCallbacks.push(callback);
    return () => {
      this.onPlayerJoinCallbacks = this.onPlayerJoinCallbacks.filter(cb => cb !== callback);
    };
  }
  
  public onPlayerLeave(callback: (playerId: string) => void): () => void {
    this.onPlayerLeaveCallbacks.push(callback);
    return () => {
      this.onPlayerLeaveCallbacks = this.onPlayerLeaveCallbacks.filter(cb => cb !== callback);
    };
  }
  
  public onPlayerMove(callback: (playerId: string, position: [number, number, number]) => void): () => void {
    this.onPlayerMoveCallbacks.push(callback);
    return () => {
      this.onPlayerMoveCallbacks = this.onPlayerMoveCallbacks.filter(cb => cb !== callback);
    };
  }
  
  // Game-specific methods
  public joinGame(playerId: string, character: string, position: [number, number, number] = [0, 1, 0]): void {
    this.sendMessage('joinGame', {
      playerId,
      character,
      position
    });
  }
  
  public leaveGame(playerId: string): void {
    this.sendMessage('leaveGame', { playerId });
  }
  
  public updatePosition(playerId: string, position: [number, number, number]): void {
    this.sendMessage('updatePosition', {
      playerId,
      position
    });
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;