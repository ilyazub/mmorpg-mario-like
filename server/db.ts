import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon database connectivity
neonConfig.webSocketConstructor = ws;

// Environment-specific database configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const connectionRetries = isDevelopment ? 3 : 5;
const connectionTimeout = isDevelopment ? 5000 : 10000;

// Validate database connection string
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Initialize database pool with more robust configuration for production
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: isDevelopment ? 10 : 20,             // Maximum connections in the pool
  idleTimeoutMillis: 30000,                 // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: connectionTimeout, // How long to wait for connection
  maxUses: 7500,                            // Close connections after this many uses
  allowExitOnIdle: isDevelopment,           // Allow closing idle clients in development
});

// Log configuration for observability
console.log(`Database configured in ${isDevelopment ? 'development' : 'production'} mode`);

// Create drizzle ORM instance with schema
export const db = drizzle(pool, { schema });

// Handle database connection errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  
  // In production, attempt to recover by creating a new connection
  if (!isDevelopment) {
    console.log('Attempting to recover database connection...');
    setTimeout(() => {
      try {
        // Force a new query to recreate the connection
        pool.query('SELECT 1').catch(e => console.error('Recovery attempt failed:', e));
      } catch (e) {
        console.error('Failed to recover database connection:', e);
      }
    }, 1000);
  }
});
