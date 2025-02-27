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

interface ElementData {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  theme?: string;
  isActive?: boolean;
}

// Store connected players and temporary game state
// These will be synchronized with persistent storage
const players = new Map<string, PlayerData>();
const obstacles = new Map<string, ObstacleData>();
const elements = new Map<string, ElementData>();
const DEFAULT_WORLD_ID = 1;

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

  app.get("/api/obstacles", async (req, res) => {
    // Get both in-memory obstacles and persisted ones
    const obstaclesList = Array.from(obstacles.entries()).map(([id, data]) => ({
      id,
      position: data.position,
      type: data.type,
      isCrushed: data.isCrushed || false
    }));
    
    // Add persisted obstacles
    const worldId = parseInt(req.query.worldId as string) || DEFAULT_WORLD_ID;
    const persistedObstacles = await storage.getWorldObstacles(worldId);
    
    // Convert database format to client format
    const persistedObstaclesList = persistedObstacles.map(obstacle => ({
      id: obstacle.obstacleId,
      position: {
        x: obstacle.posX,
        y: obstacle.posY,
        z: obstacle.posZ
      },
      type: obstacle.type,
      isCrushed: obstacle.isCrushed || false
    }));
    
    res.json([...obstaclesList, ...persistedObstaclesList]);
  });
  
  app.get("/api/world-elements", async (req, res) => {
    const worldId = parseInt(req.query.worldId as string) || DEFAULT_WORLD_ID;
    const persistedElements = await storage.getWorldElements(worldId);
    
    // Convert database format to client format
    const elementsList = persistedElements.map(element => ({
      id: element.elementId,
      type: element.type,
      position: {
        x: element.posX,
        y: element.posY,
        z: element.posZ
      },
      dimensions: {
        width: element.width || 1,
        height: element.height || 1,
        depth: element.depth || 1
      },
      theme: element.theme || "default",
      isActive: element.isActive
    }));
    
    res.json(elementsList);
  });
  
  app.get("/api/parallax-layers", async (req, res) => {
    const worldId = parseInt(req.query.worldId as string) || DEFAULT_WORLD_ID;
    const layers = await storage.getParallaxLayers(worldId);
    
    // Convert database format to client format
    const layersList = layers.map(layer => ({
      id: layer.id,
      layerIndex: layer.layerIndex,
      speed: layer.speed,
      color: layer.color,
      depth: layer.depth,
      posZ: layer.posZ,
      isActive: layer.isActive
    }));
    
    res.json(layersList);
  });
  
  app.get("/api/worlds", async (req, res) => {
    const worlds = await storage.getActiveGameWorlds();
    res.json(worlds);
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
    socket.on("addObstacle", async (data: ObstacleData & { worldId?: number }) => {
      // Store obstacle data in memory for real-time updates
      obstacles.set(data.id, {
        id: data.id,
        position: data.position,
        type: data.type
      });
      
      // Also persist to storage
      const worldId = data.worldId || DEFAULT_WORLD_ID;
      try {
        await storage.createWorldObstacle({
          worldId,
          obstacleId: data.id,
          type: data.type,
          posX: Math.round(data.position.x),
          posY: Math.round(data.position.y),
          posZ: Math.round(data.position.z),
          isCrushed: false
        });
        console.log(`Persisted obstacle ${data.id} to world ${worldId}`);
      } catch (err) {
        console.error("Error persisting obstacle:", err);
      }
      
      // Broadcast to all other players about the new obstacle
      socket.broadcast.emit("obstacleState", {
        id: data.id,
        position: data.position,
        type: data.type
      });
    });
    
    // Handle obstacle updates (crushed, moved, etc.)
    socket.on("obstacleUpdate", async (data: { id: string, isCrushed?: boolean, worldId?: number }) => {
      // Update obstacle in our in-memory records
      if (obstacles.has(data.id)) {
        const obstacle = obstacles.get(data.id)!;
        
        if (data.isCrushed !== undefined) {
          obstacle.isCrushed = data.isCrushed;
        }
        
        obstacles.set(data.id, obstacle);
        
        // Try to update in persistent storage by obstacleId
        try {
          // Find obstacle in database by obstacleId and update its crush status
          const worldId = data.worldId || DEFAULT_WORLD_ID;
          const obstaclesList = await storage.getWorldObstacles(worldId);
          const persistedObstacle = obstaclesList.find(o => o.obstacleId === data.id);
          
          if (persistedObstacle && data.isCrushed !== undefined) {
            await storage.updateWorldObstacle(persistedObstacle.id, data.isCrushed);
            console.log(`Updated persistent obstacle ${data.id} crush status to ${data.isCrushed}`);
          }
        } catch (err) {
          console.error("Error updating obstacle in storage:", err);
        }
        
        // Broadcast obstacle update to all other players
        socket.broadcast.emit("obstacleUpdate", data);
      }
    });
    
    // Handle world element addition (platforms, decorations, etc.)
    socket.on("addWorldElement", async (data: ElementData & { worldId?: number }) => {
      // Store element data in memory for real-time updates
      elements.set(data.id, data);
      
      // Also persist to storage
      const worldId = data.worldId || DEFAULT_WORLD_ID;
      try {
        await storage.createWorldElement({
          worldId,
          elementId: data.id,
          type: data.type,
          posX: Math.round(data.position.x),
          posY: Math.round(data.position.y),
          posZ: Math.round(data.position.z),
          width: data.dimensions?.width || 1,
          height: data.dimensions?.height || 1,
          depth: data.dimensions?.depth || 1,
          theme: data.theme || "default",
          isActive: data.isActive !== false
        });
        console.log(`Persisted world element ${data.id} to world ${worldId}`);
      } catch (err) {
        console.error("Error persisting world element:", err);
      }
      
      // Broadcast to all other players about the new element
      socket.broadcast.emit("worldElementState", {
        id: data.id,
        type: data.type,
        position: data.position,
        dimensions: data.dimensions,
        theme: data.theme
      });
    });
    
    // Handle parallax layer addition or update
    socket.on("updateParallaxLayer", async (data: {
      layerIndex: number;
      speed: number;
      color: string;
      depth: number;
      posZ: number;
      worldId?: number;
    }) => {
      const worldId = data.worldId || DEFAULT_WORLD_ID;
      
      try {
        // Check if the layer already exists
        const existingLayers = await storage.getParallaxLayers(worldId);
        const existingLayer = existingLayers.find(layer => layer.layerIndex === data.layerIndex);
        
        if (!existingLayer) {
          // Create a new layer
          await storage.createParallaxLayer({
            worldId,
            layerIndex: data.layerIndex,
            speed: data.speed,
            color: data.color,
            depth: data.depth,
            posZ: data.posZ,
            isActive: true
          });
          console.log(`Created new parallax layer ${data.layerIndex} for world ${worldId}`);
        }
        
        // Broadcast the parallax layer update to all other players
        socket.broadcast.emit("parallaxLayerUpdate", {
          layerIndex: data.layerIndex,
          speed: data.speed,
          color: data.color,
          depth: data.depth,
          posZ: data.posZ
        });
      } catch (err) {
        console.error("Error persisting parallax layer:", err);
      }
    });
    
    // Handle player attack
    socket.on("playerAttack", (data: { 
      position: { x: number, y: number, z: number },
      color: number 
    }) => {
      // Broadcast the attack to all other players
      socket.broadcast.emit("playerAttack", {
        id: socket.id,
        position: data.position,
        color: data.color
      });
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
