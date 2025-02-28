// Handle all API routes
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/', '');
  
  // Simple router
  switch (path) {
    case 'game-world':
      return new Response(JSON.stringify({
        status: 'active',
        players: 0,
        serverTime: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    default:
      return new Response(JSON.stringify({
        error: 'Not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
  }
}