import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Character interface for the game
export interface Character {
  id: string;
  name: string;
  sprite: string;
  speed: number;
  jump: number;
}

// Game world data
export const gameWorlds = pgTable("game_worlds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  difficulty: integer("difficulty").default(1),
  isActive: boolean("is_active").default(true),
});

// World obstacles data
export const worldObstacles = pgTable("world_obstacles", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull().references(() => gameWorlds.id),
  obstacleId: text("obstacle_id").notNull(),
  type: text("type").notNull(),
  posX: integer("pos_x").notNull(),
  posY: integer("pos_y").notNull(),
  posZ: integer("pos_z").notNull(),
  isCrushed: boolean("is_crushed").default(false),
});

export const insertWorldObstacleSchema = createInsertSchema(worldObstacles).pick({
  worldId: true,
  obstacleId: true,
  type: true,
  posX: true,
  posY: true,
  posZ: true,
  isCrushed: true,
});

export type InsertWorldObstacle = z.infer<typeof insertWorldObstacleSchema>;
export type WorldObstacle = typeof worldObstacles.$inferSelect;

// World elements data for procedurally generated terrain features
export const worldElements = pgTable("world_elements", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull().references(() => gameWorlds.id),
  elementId: text("element_id").notNull(),
  type: text("type").notNull(), // platform, decoration, coin, etc.
  posX: integer("pos_x").notNull(),
  posY: integer("pos_y").notNull(),
  posZ: integer("pos_z").notNull(),
  width: integer("width").default(1),
  height: integer("height").default(1),
  depth: integer("depth").default(1),
  theme: text("theme"), // current visual theme
  isActive: boolean("is_active").default(true),
});

export const insertWorldElementSchema = createInsertSchema(worldElements).pick({
  worldId: true,
  elementId: true,
  type: true,
  posX: true,
  posY: true,
  posZ: true,
  width: true,
  height: true,
  depth: true,
  theme: true,
  isActive: true,
});

export type InsertWorldElement = z.infer<typeof insertWorldElementSchema>;
export type WorldElement = typeof worldElements.$inferSelect;

// Background parallax layers configuration
export const parallaxLayers = pgTable("parallax_layers", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull().references(() => gameWorlds.id),
  layerIndex: integer("layer_index").notNull(),
  speed: integer("speed").notNull(),
  color: text("color").notNull(),
  depth: integer("depth").notNull(),
  posZ: integer("pos_z").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertParallaxLayerSchema = createInsertSchema(parallaxLayers).pick({
  worldId: true,
  layerIndex: true,
  speed: true,
  color: true,
  depth: true,
  posZ: true,
  isActive: true,
});

export type InsertParallaxLayer = z.infer<typeof insertParallaxLayerSchema>;
export type ParallaxLayer = typeof parallaxLayers.$inferSelect;

// Player stats and progress
export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  characterId: text("character_id").notNull(),
  highScore: integer("high_score").default(0),
  coinsCollected: integer("coins_collected").default(0),
  levelsCompleted: integer("levels_completed").default(0),
  playTime: integer("play_time").default(0), // in seconds
});

export const insertPlayerStatsSchema = createInsertSchema(playerStats).pick({
  userId: true,
  characterId: true,
  highScore: true,
  coinsCollected: true,
  levelsCompleted: true,
  playTime: true,
});

export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type PlayerStats = typeof playerStats.$inferSelect;
