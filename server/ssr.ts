import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { log } from './vite';

// Cache for rendered pages with their last-modified time
interface CachedPage {
  html: string;
  timestamp: number;
}

const pageCache = new Map<string, CachedPage>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Read the index.html template
 */
async function getIndexTemplate(): Promise<string> {
  try {
    const templatePath = path.resolve(__dirname, '../dist/index.html');
    return fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    log(`Error reading index template: ${error}`, 'ssr');
    // Fallback to development mode
    const developmentTemplate = path.resolve(__dirname, '../index.html');
    return fs.readFileSync(developmentTemplate, 'utf-8');
  }
}

/**
 * Get page metadata for specific routes
 */
function getPageMetadata(route: string): { title: string; description: string } {
  // Default metadata
  const defaultMetadata = {
    title: 'Multiplayer Platformer Game',
    description: 'A sophisticated multiplayer 2D platformer game with dynamic world interaction and advanced gameplay mechanics'
  };

  // Route-specific metadata
  const routeMetadata: Record<string, { title: string; description: string }> = {
    '/': {
      title: 'Home - Multiplayer Platformer Game',
      description: 'Welcome to our immersive multiplayer platformer game with real-time player interaction'
    },
    '/game': {
      title: 'Play Now - Multiplayer Platformer',
      description: 'Jump into the action with our real-time multiplayer platformer game featuring dynamic worlds'
    },
    '/about': {
      title: 'About - Multiplayer Platformer',
      description: 'Learn about the development and features of our multiplayer platformer game'
    }
  };

  return routeMetadata[route] || defaultMetadata;
}

/**
 * Render a page with server-side metadata
 */
export async function renderPage(req: Request, res: Response): Promise<any> {
  const route = req.path;
  const now = Date.now();
  
  // Check if we have a valid cached version
  const cached = pageCache.get(route);
  if (cached && (now - cached.timestamp < CACHE_DURATION)) {
    res.send(cached.html);
    return;
  }

  try {
    // Get the template and metadata
    const template = await getIndexTemplate();
    const { title, description } = getPageMetadata(route);

    // Insert metadata into the template
    const html = template
      .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
      .replace(
        /<meta name="description" content=".*?">/,
        `<meta name="description" content="${description}">`
      );

    // Cache the rendered HTML
    pageCache.set(route, {
      html,
      timestamp: now
    });

    res.send(html);
  } catch (error) {
    log(`Error rendering page: ${error}`, 'ssr');
    // Fallback to static file serving
    res.sendFile(path.resolve(__dirname, '../dist/index.html'));
  }
}

/**
 * Clear the page cache (useful for deployments)
 */
export function clearPageCache(): void {
  pageCache.clear();
  log('Page cache cleared', 'ssr');
}