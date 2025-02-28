import React, { useState, useEffect, useRef } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { toast } from "@/hooks/use-toast";

// Type for WebSocket message
interface WebSocketMessage {
  type: string;
  message: string;
  timestamp: number;
  clients?: number;
}

// Simple WebSocket implementation with error handling and reconnection
class SimpleWebSocket {
  url: string;
  socket: WebSocket | null = null;
  onOpen: () => void;
  onMessage: (data: any) => void;
  onClose: () => void;
  onError: (error: any) => void;
  reconnectTimeout: number = 3000;
  reconnectAttempt: number = 0;
  maxReconnectAttempts: number = 5;
  
  /**
   * Create a new WebSocket wrapper
   */
  constructor(
    url: string, 
    onOpen: () => void, 
    onMessage: (data: any) => void, 
    onClose: () => void,
    onError: (error: any) => void
  ) {
    this.url = url;
    this.onOpen = onOpen;
    this.onMessage = onMessage;
    this.onClose = onClose;
    this.onError = onError;
  }
  
  /**
   * Attempt to connect to the WebSocket server
   */
  connect() {
    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      this.onError(new Error('Max reconnect attempts reached'));
      return;
    }
    
    try {
      console.log(`Connecting to WebSocket at ${this.url}`);
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempt = 0;
        this.onOpen();
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          console.log('Received message:', data);
          this.onMessage(data);
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
          this.onMessage(event.data);
        }
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason || 'none'})`);
        this.socket = null;
        this.onClose();
        
        // Only try to reconnect for normal closures or network errors
        if (event.code === 1000 || event.code === 1001 || event.code === 1006) {
          // Try to reconnect after a delay with exponential backoff
          this.reconnectAttempt++;
          const timeout = Math.min(this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempt - 1), 30000);
          console.log(`Attempting to reconnect in ${timeout}ms (attempt ${this.reconnectAttempt})`);
          setTimeout(() => this.connect(), timeout);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError(error);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.onError(error);
      
      // Try to reconnect after a delay with exponential backoff
      this.reconnectAttempt++;
      const timeout = Math.min(this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempt - 1), 30000);
      setTimeout(() => this.connect(), timeout);
    }
  }
  
  /**
   * Send a message through the WebSocket
   */
  send(message: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
      return true;
    }
    return false;
  }
  
  /**
   * Close the WebSocket connection
   */
  close() {
    if (this.socket) {
      this.socket.close(1000, "Normal closure");
      this.socket = null;
    }
  }
  
  /**
   * Check if the WebSocket is currently connected
   */
  get isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export default function WebSocketTester() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [clientCount, setClientCount] = useState<number>(0);
  const socketRef = useRef<SimpleWebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Build WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Create the WebSocket wrapper
    socketRef.current = new SimpleWebSocket(
      wsUrl,
      // onOpen
      () => {
        setConnected(true);
        setMessages(prev => [...prev, 'Connected to server']);
        toast({
          title: "WebSocket Connected",
          description: "Successfully connected to the WebSocket server",
        });
      },
      // onMessage
      (data: WebSocketMessage) => {
        if (typeof data === 'string') {
          setMessages(prev => [...prev, `Received raw: ${data}`]);
        } else {
          // Update client count if available
          if (data.clients !== undefined) {
            setClientCount(data.clients);
          }
          
          // Format the message based on type
          let formattedMessage = '';
          if (data.type === 'welcome') {
            formattedMessage = `Server: ${data.message}`;
          } else if (data.type === 'echo') {
            formattedMessage = `Echo: ${data.message}`;
          } else if (data.type === 'error') {
            formattedMessage = `Error: ${data.message}`;
            toast({
              title: "WebSocket Error",
              description: data.message,
              variant: "destructive",
            });
          } else {
            formattedMessage = `Received: ${JSON.stringify(data)}`;
          }
          
          setMessages(prev => [...prev, formattedMessage]);
        }
      },
      // onClose
      () => {
        setConnected(false);
        setMessages(prev => [...prev, 'Disconnected from server']);
        setClientCount(0);
        toast({
          title: "WebSocket Disconnected",
          description: "Connection to the WebSocket server was closed",
          variant: "destructive",
        });
      },
      // onError
      (error) => {
        setMessages(prev => [...prev, 'WebSocket error occurred']);
        toast({
          title: "WebSocket Error",
          description: "An error occurred with the WebSocket connection",
          variant: "destructive",
        });
      }
    );
    
    // Connect to the server
    socketRef.current.connect();
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);
  
  const sendMessage = () => {
    if (socketRef.current && socketRef.current.isConnected && inputMessage) {
      if (socketRef.current.send(inputMessage)) {
        setMessages(prev => [...prev, `Sent: ${inputMessage}`]);
        setInputMessage('');
      } else {
        toast({
          title: "Send Failed",
          description: "Failed to send message. Connection may be closed.",
          variant: "destructive",
        });
      }
    }
  };
  
  const reconnect = () => {
    if (socketRef.current) {
      // Close existing connection if any
      socketRef.current.close();
      
      // Reset connection state
      setMessages(prev => [...prev, 'Attempting to reconnect...']);
      
      // Try to connect again
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.reconnectAttempt = 0;
          socketRef.current.connect();
        }
      }, 500);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          WebSocket Testing
          <div className="flex items-center gap-2">
            {clientCount > 0 && (
              <Badge variant="outline" className="ml-2">
                {clientCount} {clientCount === 1 ? 'client' : 'clients'}
              </Badge>
            )}
            <Badge variant={connected ? "default" : "destructive"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Test the WebSocket connection to the game server
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-3 rounded-md h-64 overflow-y-auto mb-4 text-sm">
          {messages.length === 0 ? (
            <div className="text-muted-foreground text-center italic pt-4">
              No messages yet
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`mb-1 p-2 rounded ${
                  msg.startsWith('Sent:') 
                    ? 'bg-primary/10 border-l-2 border-primary' 
                    : msg.startsWith('Echo:') 
                      ? 'bg-secondary/10 border-l-2 border-secondary'
                      : msg.startsWith('Server:')
                        ? 'bg-green-500/10 border-l-2 border-green-500'
                        : msg.startsWith('Error:')
                          ? 'bg-red-500/10 border-l-2 border-red-500'
                          : 'bg-background'
                }`}>
                  {msg}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message to send"
            disabled={!connected}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!connected || !inputMessage}>
            Send
          </Button>
        </div>
        
        {!connected && (
          <Button
            variant="outline"
            onClick={reconnect}
            className="w-full mt-4">
            Reconnect
          </Button>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground justify-between">
        <span>
          {connected 
            ? 'Messages are echoed back from the server' 
            : 'Attempting to connect...'}
        </span>
        <span>
          WebSocket Path: /ws
        </span>
      </CardFooter>
    </Card>
  );
}