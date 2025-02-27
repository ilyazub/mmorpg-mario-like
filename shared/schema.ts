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
