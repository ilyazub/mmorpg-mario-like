/**
 * Cloudflare Pages Middleware
 * This middleware routes requests to the appropriate handler based on path
 * It allows us to have different endpoints for API, WebSocket and static files
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle WebSocket connections
  if (path === '/ws' || path.startsWith('/socket.io')) {
    // For WebSocket connections, we need to pass to the Node.js server
    // This assumes you've set up a Cloudflare Worker with Socket.io capability
    // In a real implementation, this would need additional websocket handling
    return fetch(request);
  }

  // Handle API routes
  if (path.startsWith('/api/')) {
    // Call the API handler
    return env.API.fetch(request);
  }

  // For regular HTTP requests, continue to the next handler
  return context.next();
}