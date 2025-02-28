/**
 * Environment configuration for the client
 * This provides type-safe access to environment variables with proper fallbacks
 */

// Base URL for backend API calls
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Environment type
export const NODE_ENV = import.meta.env.NODE_ENV || 'development';

// Check if we're in production
export const isProduction = NODE_ENV === 'production';

// WebSocket configuration
export const getWebSocketURL = (): string => {
  // For production deploys, use the same host but with ws/wss protocol
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

// WebSocket configuration options
export const webSocketOptions = {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  maxReconnectionDelay: 5000,
  timeout: 20000,
  debug: !isProduction,
};

// Legacy Socket.io configuration options - keeping for backward compatibility
export const socketOptions = {
  transports: ['websocket'] as const,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
};

// Debug mode
export const DEBUG = import.meta.env.VITE_DEBUG === 'true' || !isProduction;

// Game configuration
export const GAME_CONFIG = {
  defaultWorldId: 1,
  maxPlayers: 50,
  renderDistance: isProduction ? 100 : 150, // Lower in production for better performance
  enableShadows: isProduction ? false : true, // Disable shadows in production for performance
};