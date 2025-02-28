import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { Character } from "../shared/schema";
import { pool } from "./db";
import { renderPage, clearPageCache } from "./ssr";
import path from "path";

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

// Initialize game world on startup
async function initializeGameWorld() {
  try {
    const worlds = await storage.getActiveGameWorlds();
    if (worlds.length === 0) {
      console.log('No active game worlds found. Creating default game world...');
      await storage.createGameWorld('Default World', 'The main game world for multiplayer platformer', 1);
      console.log('Default game world created successfully with ID:', DEFAULT_WORLD_ID);
    } else {
      console.log(`Found ${worlds.length} existing game worlds.`);
    }
  } catch (error) {
    console.error('Error initializing game world:', error);
  }
}

// Run initialization
initializeGameWorld();

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix with /api
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy" });
  });
  
  // Clear the SSR cache when requested (useful for deployments)
  app.post("/api/clear-cache", (req, res) => {
    clearPageCache();
    res.json({ status: "success", message: "Page cache cleared" });
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
  
  // Health check endpoint for monitoring and cron jobs
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection with proper type handling
      const dbStatus = await pool.query('SELECT 1 as health').then((result: any) => ({
        status: 'ok',
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      })).catch((err: Error) => ({
        status: 'error',
        message: `Database connection failed: ${err.message}`,
        timestamp: new Date().toISOString()
      }));
      
      // Check active players count
      const activePlayers = players.size;
      
      // Check active obstacles count
      const activeObstacles = obstacles.size;
      
      // System health info
      const healthInfo = {
        service: 'multiplayer-platformer',
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus,
        memory: {
          heapUsed: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.floor(process.memoryUsage().rss / 1024 / 1024),
        },
        game: {
          activePlayers,
          activeObstacles,
          activeElements: elements.size,
        }
      };
      
      // Return 200 if database is connected, otherwise 503
      if (dbStatus.status === 'ok') {
        res.status(200).json(healthInfo);
      } else {
        res.status(503).json(healthInfo);
      }
    } catch (error: unknown) {
      // Handle error properly with type safety
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        errorDetail: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  
  // Set up Socket.io for real-time multiplayer with deployment considerations
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://*.vercel.app', 'https://*.workers.dev'] // Allow connections from deployment domains
        : '*', // Allow all origins in development
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'], // Support both WebSocket and long-polling
    path: '/socket.io', // Explicit path for socket.io connections
    pingTimeout: 60000, // Increase timeout for poor connections
    connectTimeout: 30000 // Longer connect timeout for initial connection
  });
  
  // Log environment information
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  
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
    
    // Handle decoration collision events
    socket.on("decorationCollision", async (data: { 
      decorationId: string, 
      position: { x: number, y: number, z: number },
      type: string,
      worldId?: number
    }) => {
      // Store collision info and broadcast to other players
      console.log(`Player ${socket.id} collided with decoration ${data.decorationId} (${data.type})`);
      
      // Broadcast to other players to show decoration interaction
      socket.broadcast.emit("decorationInteraction", {
        decorationId: data.decorationId,
        position: data.position,
        type: data.type,
        playerId: socket.id
      });
      
      // Persist decoration to world elements if it's a significant one
      const worldId = data.worldId || DEFAULT_WORLD_ID;
      try {
        if (Math.random() < 0.2) { // Only persist some decorations to avoid database bloat
          await storage.createWorldElement({
            worldId,
            elementId: data.decorationId,
            type: data.type,
            posX: Math.round(data.position.x * 10) / 10,
            posY: Math.round(data.position.y * 10) / 10,
            posZ: Math.round(data.position.z * 10) / 10,
            isActive: true,
            width: 1,
            height: 1,
            depth: 1,
            theme: "decoration"
          });
          console.log(`Persisted decoration ${data.decorationId} to world ${worldId}`);
        }
      } catch (err) {
        console.error("Error persisting decoration:", err);
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

  // Set up WebSocket server with Socket.io-like protocol for compatibility
  // Create WebSocket server with explicit handling of path and protocol
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    perMessageDeflate: false // Disable compression for better compatibility
  });
  
  // Track connected clients with their IDs and data
  const wsClients = new Map<string, { 
    ws: WebSocket, 
    id: string,
    playerData?: PlayerData 
  }>();
  
  // Generate unique client IDs
  let nextClientId = 1;
  
  wss.on('connection', (ws, req) => {
    // Generate client ID
    const clientId = `ws-client-${nextClientId++}`;
    const clientIp = req.socket.remoteAddress || 'unknown';
    
    console.log(`WebSocket client connected: ${clientId} from ${clientIp}`);
    wsClients.set(clientId, { ws, id: clientId });
    
    // Send initial connection confirmation
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'connect', 
          id: clientId,
          message: 'Connected to WebSocket server',
          timestamp: Date.now(),
          clients: wsClients.size
        }));
        
        // Send list of current players to newly connected client
        players.forEach((playerData, playerId) => {
          if (playerId !== clientId) {
            ws.send(JSON.stringify({
              type: 'playerJoin',
              id: playerId,
              character: playerData.character,
              position: playerData.position
            }));
          }
        });
        
        // Send list of current obstacles to newly connected client
        obstacles.forEach((obstacleData, obstacleId) => {
          ws.send(JSON.stringify({
            type: 'obstacleState',
            id: obstacleId,
            position: obstacleData.position,
            type: obstacleData.type,
            isCrushed: obstacleData.isCrushed || false
          }));
        });
      }
    } catch (error) {
      console.error('Error sending welcome data:', error);
    }
    
    // Handle incoming messages - parse Socket.io-like events
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        const type = data.type; // Event type/name
        console.log(`Received ${type} event from client ${clientId}:`, data);
        
        // Handle different event types
        switch (type) {
          case 'selectCharacter':
            // Store player data with default position
            const character = data.character;
            players.set(clientId, {
              character,
              position: { x: 0, y: 1, z: 0 }
            });
            
            // Update local tracking
            const clientData = wsClients.get(clientId);
            if (clientData) {
              clientData.playerData = players.get(clientId);
              wsClients.set(clientId, clientData);
            }
            
            // Broadcast to all other clients that a new player has joined
            broadcastToOthers(clientId, {
              type: 'playerJoin',
              id: clientId,
              character,
              position: { x: 0, y: 1, z: 0 }
            });
            break;
            
          case 'updatePosition':
            // Update player position in our records
            if (players.has(clientId)) {
              players.set(clientId, {
                character: data.character,
                position: data.position
              });
              
              // Broadcast position update to all other players
              broadcastToOthers(clientId, {
                type: 'playerMove',
                id: clientId,
                position: data.position
              });
            }
            break;
            
          case 'playerAttack':
            // Broadcast the attack to all other players
            broadcastToOthers(clientId, {
              type: 'playerAttack',
              id: clientId,
              position: data.position,
              color: data.color
            });
            break;
            
          case 'addObstacle':
            // Store obstacle data in memory for real-time updates
            obstacles.set(data.id, {
              id: data.id,
              position: data.position,
              type: data.type
            });
            
            // Also persist to storage
            const worldId = data.worldId || DEFAULT_WORLD_ID;
            try {
              storage.createWorldObstacle({
                worldId,
                obstacleId: data.id,
                type: data.type,
                posX: Math.round(data.position.x),
                posY: Math.round(data.position.y),
                posZ: Math.round(data.position.z),
                isCrushed: false
              }).catch(err => console.error("Error persisting obstacle:", err));
              
              console.log(`Persisted obstacle ${data.id} to world ${worldId}`);
            } catch (err) {
              console.error("Error persisting obstacle:", err);
            }
            
            // Broadcast to all other players about the new obstacle
            broadcastToOthers(clientId, {
              type: 'obstacleState',
              id: data.id,
              position: data.position,
              type: data.type
            });
            break;
            
          case 'decorationCollision':
            // Broadcast to other players to show decoration interaction
            broadcastToOthers(clientId, {
              type: 'decorationInteraction',
              decorationId: data.decorationId,
              position: data.position,
              type: data.type,
              playerId: clientId
            });
            break;
            
          default:
            // Handle unknown message types
            console.log(`Unhandled event type: ${type}`);
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
        
        // Send error back to client
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Error processing your message',
            timestamp: Date.now()
          }));
        }
      }
    });
    
    // Function to broadcast to all other clients
    function broadcastToOthers(senderId: string, data: any) {
      wsClients.forEach((client, id) => {
        if (id !== senderId && client.ws.readyState === WebSocket.OPEN) {
          try {
            client.ws.send(JSON.stringify(data));
          } catch (error) {
            console.error(`Error sending to client ${id}:`, error);
          }
        }
      });
    }
    
    // Handle websocket errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });
    
    // Handle client disconnection
    ws.on('close', (code, reason) => {
      console.log(`WebSocket client disconnected: ${clientId} (code: ${code}, reason: ${reason || 'none'})`);
      
      // Remove from client tracking
      wsClients.delete(clientId);
      
      // Remove from players list
      players.delete(clientId);
      
      // Notify all other clients about player leaving
      broadcastToAll({
        type: 'playerLeave',
        id: clientId
      });
    });
  });
  
  // Function to broadcast to all connected clients
  function broadcastToAll(data: any) {
    wsClients.forEach((client, id) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(data));
        } catch (error) {
          console.error(`Error broadcasting to client ${id}:`, error);
        }
      }
    });
  }
  
  // Add SSR route handler for all non-API routes - must be the last route
  app.get('*', (req, res, next) => {
    // Skip for client-side modules, static assets and API routes
    if (req.path.includes('.') || 
        req.path.startsWith('/src/') || 
        req.path.startsWith('/node_modules/') || 
        req.path.startsWith('/assets/') || 
        req.path.startsWith('/api/') || 
        req.originalUrl.includes('?')) {
      return next();
    }
    
    // Render the page with SSR
    renderPage(req, res, next);
  });
  
  return httpServer;
}
