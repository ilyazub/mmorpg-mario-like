// Cloudflare Pages middleware for routing
export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // Handle API routes
  if (url.pathname.startsWith('/api/')) {
    // Pass to API handler function
    return context.next();
  }
  
  // For WebSocket connections
  if (url.pathname === '/ws') {
    return context.next();
  }
  
  // For static assets
  return context.next();
}