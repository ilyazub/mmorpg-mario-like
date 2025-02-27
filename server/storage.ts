import { 
  users, type User, type InsertUser,
  gameWorlds, type InsertWorldObstacle, type WorldObstacle, worldObstacles,
  worldElements, type InsertWorldElement, type WorldElement,
  parallaxLayers, type InsertParallaxLayer, type ParallaxLayer
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game world methods
  getGameWorld(id: number): Promise<any | undefined>;
  getActiveGameWorlds(): Promise<any[]>;
  createGameWorld(name: string, description?: string, difficulty?: number): Promise<any>;
  
  // World obstacles methods
  getWorldObstacles(worldId: number): Promise<WorldObstacle[]>;
  createWorldObstacle(obstacle: InsertWorldObstacle): Promise<WorldObstacle>;
  updateWorldObstacle(id: number, isCrushed: boolean): Promise<void>;
  
  // World elements methods
  getWorldElements(worldId: number): Promise<WorldElement[]>;
  createWorldElement(element: InsertWorldElement): Promise<WorldElement>;
  updateWorldElement(id: number, isActive: boolean): Promise<void>;
  
  // Parallax layers methods
  getParallaxLayers(worldId: number): Promise<ParallaxLayer[]>;
  createParallaxLayer(layer: InsertParallaxLayer): Promise<ParallaxLayer>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameWorlds: Map<number, any>;
  private worldObstacles: Map<number, WorldObstacle[]>;
  private worldElements: Map<number, WorldElement[]>;
  private parallaxLayers: Map<number, ParallaxLayer[]>;
  
  private userId: number;
  private worldId: number;
  private obstacleId: number;
  private elementId: number;
  private layerId: number;

  constructor() {
    this.users = new Map();
    this.gameWorlds = new Map();
    this.worldObstacles = new Map();
    this.worldElements = new Map();
    this.parallaxLayers = new Map();
    
    this.userId = 1;
    this.worldId = 1;
    this.obstacleId = 1;
    this.elementId = 1;
    this.layerId = 1;
    
    // Initialize with a default game world
    this.createGameWorld("Default World", "The main game world", 1);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Game world methods
  async getGameWorld(id: number): Promise<any | undefined> {
    return this.gameWorlds.get(id);
  }
  
  async getActiveGameWorlds(): Promise<any[]> {
    return Array.from(this.gameWorlds.values()).filter(world => world.isActive);
  }
  
  async createGameWorld(name: string, description?: string, difficulty: number = 1): Promise<any> {
    const id = this.worldId++;
    const world = {
      id,
      name,
      description: description || "",
      difficulty,
      isActive: true
    };
    this.gameWorlds.set(id, world);
    this.worldObstacles.set(id, []);
    this.worldElements.set(id, []);
    this.parallaxLayers.set(id, []);
    return world;
  }
  
  // World obstacles methods
  async getWorldObstacles(worldId: number): Promise<WorldObstacle[]> {
    return this.worldObstacles.get(worldId) || [];
  }
  
  async createWorldObstacle(obstacle: InsertWorldObstacle): Promise<WorldObstacle> {
    const id = this.obstacleId++;
    const newObstacle = {
      ...obstacle,
      id
    };
    
    const worldObstacles = this.worldObstacles.get(obstacle.worldId) || [];
    worldObstacles.push(newObstacle);
    this.worldObstacles.set(obstacle.worldId, worldObstacles);
    
    return newObstacle;
  }
  
  async updateWorldObstacle(id: number, isCrushed: boolean): Promise<void> {
    for (const [worldId, obstacles] of this.worldObstacles.entries()) {
      const obstacleIndex = obstacles.findIndex(o => o.id === id);
      if (obstacleIndex !== -1) {
        obstacles[obstacleIndex].isCrushed = isCrushed;
        this.worldObstacles.set(worldId, obstacles);
        return;
      }
    }
  }
  
  // World elements methods
  async getWorldElements(worldId: number): Promise<WorldElement[]> {
    return this.worldElements.get(worldId) || [];
  }
  
  async createWorldElement(element: InsertWorldElement): Promise<WorldElement> {
    const id = this.elementId++;
    const newElement = {
      ...element,
      id
    };
    
    const worldElements = this.worldElements.get(element.worldId) || [];
    worldElements.push(newElement);
    this.worldElements.set(element.worldId, worldElements);
    
    return newElement;
  }
  
  async updateWorldElement(id: number, isActive: boolean): Promise<void> {
    for (const [worldId, elements] of this.worldElements.entries()) {
      const elementIndex = elements.findIndex(e => e.id === id);
      if (elementIndex !== -1) {
        elements[elementIndex].isActive = isActive;
        this.worldElements.set(worldId, elements);
        return;
      }
    }
  }
  
  // Parallax layers methods
  async getParallaxLayers(worldId: number): Promise<ParallaxLayer[]> {
    return this.parallaxLayers.get(worldId) || [];
  }
  
  async createParallaxLayer(layer: InsertParallaxLayer): Promise<ParallaxLayer> {
    const id = this.layerId++;
    const newLayer = {
      ...layer,
      id
    };
    
    const worldLayers = this.parallaxLayers.get(layer.worldId) || [];
    worldLayers.push(newLayer);
    this.parallaxLayers.set(layer.worldId, worldLayers);
    
    return newLayer;
  }
}

// Database implementation of storage
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Game world methods
  async getGameWorld(id: number): Promise<any | undefined> {
    const [world] = await db.select().from(gameWorlds).where(eq(gameWorlds.id, id));
    return world || undefined;
  }
  
  async getActiveGameWorlds(): Promise<any[]> {
    return await db.select().from(gameWorlds).where(eq(gameWorlds.isActive, true));
  }
  
  async createGameWorld(name: string, description?: string, difficulty: number = 1): Promise<any> {
    const [world] = await db
      .insert(gameWorlds)
      .values({
        name,
        description: description || null,
        difficulty,
        isActive: true
      })
      .returning();
    return world;
  }
  
  // World obstacles methods
  async getWorldObstacles(worldId: number): Promise<WorldObstacle[]> {
    return await db.select().from(worldObstacles).where(eq(worldObstacles.worldId, worldId));
  }
  
  async createWorldObstacle(obstacle: InsertWorldObstacle): Promise<WorldObstacle> {
    const [newObstacle] = await db
      .insert(worldObstacles)
      .values({
        ...obstacle,
        isCrushed: obstacle.isCrushed || false
      })
      .returning();
    return newObstacle;
  }
  
  async updateWorldObstacle(id: number, isCrushed: boolean): Promise<void> {
    await db
      .update(worldObstacles)
      .set({ isCrushed })
      .where(eq(worldObstacles.id, id));
  }
  
  // World elements methods
  async getWorldElements(worldId: number): Promise<WorldElement[]> {
    return await db.select().from(worldElements).where(eq(worldElements.worldId, worldId));
  }
  
  async createWorldElement(element: InsertWorldElement): Promise<WorldElement> {
    const [newElement] = await db
      .insert(worldElements)
      .values({
        ...element,
        isActive: element.isActive === undefined ? true : element.isActive
      })
      .returning();
    return newElement;
  }
  
  async updateWorldElement(id: number, isActive: boolean): Promise<void> {
    await db
      .update(worldElements)
      .set({ isActive })
      .where(eq(worldElements.id, id));
  }
  
  // Parallax layers methods
  async getParallaxLayers(worldId: number): Promise<ParallaxLayer[]> {
    return await db.select().from(parallaxLayers).where(eq(parallaxLayers.worldId, worldId));
  }
  
  async createParallaxLayer(layer: InsertParallaxLayer): Promise<ParallaxLayer> {
    const [newLayer] = await db
      .insert(parallaxLayers)
      .values({
        ...layer,
        isActive: layer.isActive === undefined ? true : layer.isActive
      })
      .returning();
    return newLayer;
  }
}

// We're now using the database storage for persistence
import { eq } from "drizzle-orm";
import { db } from "./db";
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
