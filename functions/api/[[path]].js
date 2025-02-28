/**
 * API handler for Cloudflare Pages
 * This handles all the API routes in a serverless function
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');
  
  // Get database credentials from environment variables
  const DATABASE_URL = env.DATABASE_URL;
  
  // Set CORS headers for API requests
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  });
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  try {
    // Game-specific API routes
    if (path.startsWith('/game')) {
      // Game data routes
      if (path === '/game/worlds') {
        // Return active game worlds
        return new Response(JSON.stringify({
          worlds: [
            { id: 1, name: 'Default World', players: 0, difficulty: 1 }
          ]
        }), { headers });
      }
      
      // Game statistics
      if (path === '/game/stats') {
        return new Response(JSON.stringify({
          totalPlayers: 0,
          activeWorlds: 1,
          lastUpdated: new Date().toISOString()
        }), { headers });
      }
    }
    
    // User-specific API routes
    if (path.startsWith('/users')) {
      if (path === '/users/me' && request.method === 'GET') {
        // Mock user data for demonstration
        return new Response(JSON.stringify({
          id: 1,
          username: 'player1',
          stats: {
            highScore: 1000,
            playtime: 3600,
            coins: 150
          }
        }), { headers });
      }
    }
    
    // Default response for undefined routes
    return new Response(JSON.stringify({ 
      error: 'Not found',
      path: path
    }), { 
      status: 404,
      headers
    });
    
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message
    }), { 
      status: 500,
      headers
    });
  }
}