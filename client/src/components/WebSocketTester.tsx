import React, { useState, useEffect, useRef } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

export default function WebSocketTester() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to the WebSocket server
    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        console.log(`Connecting to WebSocket at ${wsUrl}`);
        
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          console.log('WebSocket connected');
          setConnected(true);
          setMessages(prev => [...prev, 'Connected to server']);
        };
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);
            setMessages(prev => [...prev, `Received: ${JSON.stringify(data)}`]);
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
            setMessages(prev => [...prev, `Received raw: ${event.data}`]);
          }
        };
        
        socket.onclose = () => {
          console.log('WebSocket disconnected');
          setConnected(false);
          setMessages(prev => [...prev, 'Disconnected from server']);
          
          // Try to reconnect after a delay
          setTimeout(connect, 3000);
        };
        
        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setMessages(prev => [...prev, 'WebSocket error occurred']);
        };
        
        socketRef.current = socket;
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setTimeout(connect, 3000);
      }
    };
    
    connect();
    
    // Clean up on unmount
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, []);
  
  const sendMessage = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && inputMessage) {
      socketRef.current.send(inputMessage);
      setMessages(prev => [...prev, `Sent: ${inputMessage}`]);
      setInputMessage('');
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
          <Badge variant={connected ? "default" : "destructive"}>
            {connected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Test the WebSocket connection to the server
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-3 rounded-md h-64 overflow-y-auto mb-4 text-sm">
          {messages.length === 0 ? (
            <div className="text-muted-foreground text-center italic pt-4">
              No messages yet
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`mb-1 p-2 rounded ${msg.startsWith('Sent:') ? 'bg-primary/10' : msg.startsWith('Received:') ? 'bg-secondary/10' : 'bg-background'}`}>
                {msg}
              </div>
            ))
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
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {connected ? 'Messages are echoed back from the server' : 'Attempting to connect...'}
      </CardFooter>
    </Card>
  );
}