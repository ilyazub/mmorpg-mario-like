import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { Character } from "../shared/schema";

interface PlayerData {
  character: Character;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

// Store connected players
const players = new Map<string, PlayerData>();

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix with /api
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy" });
  });

  // Game-related API endpoints
  app.get("/api/players", (req, res) => {
    const playersList = Array.from(players.entries()).map(([id, data]) => ({
      id,
      character: data.character,
      position: data.position
    }));
    res.json(playersList);
  });

  const httpServer = createServer(app);
  
  // Set up Socket.io for real-time multiplayer
  const io = new SocketIOServer(httpServer);
  
  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Send list of current players to newly connected player
    players.forEach((playerData, playerId) => {
      if (playerId !== socket.id) {
        socket.emit("playerJoin", {
          id: playerId,
          character: playerData.character,
          position: playerData.position
        });
      }
    });
    
    // Handle character selection
    socket.on("selectCharacter", (character: Character) => {
      console.log(`Player ${socket.id} selected character: ${character.name}`);
      
      // Store player data with default position
      players.set(socket.id, {
        character,
        position: { x: 0, y: 1, z: 0 }
      });
      
      // Broadcast to all other players that a new player has joined
      socket.broadcast.emit("playerJoin", {
        id: socket.id,
        character,
        position: { x: 0, y: 1, z: 0 }
      });
    });
    
    // Handle position updates
    socket.on("updatePosition", (data: { 
      character: Character, 
      position: { x: number, y: number, z: number } 
    }) => {
      // Update player position in our records
      if (players.has(socket.id)) {
        players.set(socket.id, {
          character: data.character,
          position: data.position
        });
        
        // Broadcast position update to all other players
        socket.broadcast.emit("playerMove", {
          id: socket.id,
          position: data.position
        });
      }
    });
    
    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);
      
      // Remove player from our records
      players.delete(socket.id);
      
      // Broadcast to all other players that this player has left
      io.emit("playerLeave", socket.id);
    });
  });

  return httpServer;
}
