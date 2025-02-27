export interface Collidable {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Physics {
  public gravity: number = 980; // pixels per second squared

  constructor() {}
  
  public checkCollision(a: Collidable, b: Collidable): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
  
  public checkPlatformCollision(player: Collidable, platform: Collidable): boolean {
    // Only collide with the top of platforms
    const wasAbovePlatform = player.y + player.height - player.velocityY <= platform.y;
    
    // Check if player is now colliding with platform
    const isColliding = this.checkCollision(player, platform);
    
    // Only return true if player was above and is now colliding
    return wasAbovePlatform && isColliding;
  }
}
