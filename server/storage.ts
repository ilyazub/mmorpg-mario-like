import { 
  users, type User, type InsertUser,
  gameWorlds, type InsertWorldObstacle, type WorldObstacle, worldObstacles,
  worldElements, type InsertWorldElement, type WorldElement,
  parallaxLayers, type InsertParallaxLayer, type ParallaxLayer
} from "@shared/schema";

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
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
