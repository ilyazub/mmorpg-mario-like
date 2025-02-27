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

interface ObstacleData {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  type: string;
  isCrushed?: boolean;
}

// Store connected players
const players = new Map<string, PlayerData>();

// Store game obstacles
const obstacles = new Map<string, ObstacleData>();

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

  app.get("/api/obstacles", (req, res) => {
    const obstaclesList = Array.from(obstacles.entries()).map(([id, data]) => ({
      id,
      position: data.position,
      type: data.type,
      isCrushed: data.isCrushed || false
    }));
    res.json(obstaclesList);
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
    
    // Send list of current obstacles to newly connected player
    obstacles.forEach((obstacleData, obstacleId) => {
      socket.emit("obstacleState", {
        id: obstacleId,
        position: obstacleData.position,
        type: obstacleData.type,
        isCrushed: obstacleData.isCrushed || false
      });
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
    
    // Handle obstacle addition
    socket.on("addObstacle", (data: ObstacleData) => {
      // Store obstacle data
      obstacles.set(data.id, {
        id: data.id,
        position: data.position,
        type: data.type
      });
      
      // Broadcast to all other players about the new obstacle
      socket.broadcast.emit("obstacleState", {
        id: data.id,
        position: data.position,
        type: data.type
      });
    });
    
    // Handle obstacle updates (crushed, moved, etc.)
    socket.on("obstacleUpdate", (data: { id: string, isCrushed?: boolean }) => {
      // Update obstacle in our records
      if (obstacles.has(data.id)) {
        const obstacle = obstacles.get(data.id)!;
        
        if (data.isCrushed !== undefined) {
          obstacle.isCrushed = data.isCrushed;
        }
        
        obstacles.set(data.id, obstacle);
        
        // Broadcast obstacle update to all other players
        socket.broadcast.emit("obstacleUpdate", data);
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
