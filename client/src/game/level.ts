import { Collidable } from './physics';

export interface Tile {
  id: number;
  solid: boolean;
}

export interface Platform extends Collidable {
  id: number;
}

export interface Coin extends Collidable {
  id: number;
  collected: boolean;
}

export class Level {
  private map: number[][] = [];
  private platforms: Platform[] = [];
  private coins: Coin[] = [];
  private tileSize: number = 16;
  
  constructor() {
    // Initialize with empty map
    this.resetLevel();
  }
  
  public resetLevel(): void {
    this.map = [];
    this.platforms = [];
    this.coins = [];
  }
  
  public loadLevel(levelId: number): void {
    this.resetLevel();
    
    // Create a simple test level
    // In a real game, this would load from a level file
    
    // Fill with sky
    for (let y = 0; y < 15; y++) {
      const row: number[] = [];
      for (let x = 0; x < 20; x++) {
        row.push(0); // 0 = sky (empty)
      }
      this.map.push(row);
    }
    
    // Add ground
    for (let x = 0; x < 20; x++) {
      this.map[14][x] = 1; // 1 = ground
    }
    
    // Add some platforms
    // Platform 1
    for (let x = 3; x < 8; x++) {
      this.map[10][x] = 1;
    }
    this.platforms.push({
      x: 3 * this.tileSize,
      y: 10 * this.tileSize,
      width: 5 * this.tileSize,
      height: this.tileSize,
      id: 1
    });
    
    // Platform 2
    for (let x = 11; x < 18; x++) {
      this.map[8][x] = 1;
    }
    this.platforms.push({
      x: 11 * this.tileSize,
      y: 8 * this.tileSize,
      width: 7 * this.tileSize,
      height: this.tileSize,
      id: 1
    });
    
    // Add some coins
    this.addCoin(5 * this.tileSize, 9 * this.tileSize);
    this.addCoin(6 * this.tileSize, 9 * this.tileSize);
    this.addCoin(14 * this.tileSize, 7 * this.tileSize);
    this.addCoin(15 * this.tileSize, 7 * this.tileSize);
  }
  
  private addCoin(x: number, y: number): void {
    this.coins.push({
      x,
      y,
      width: 12,
      height: 12,
      id: 2,
      collected: false
    });
  }
  
  public removeCoin(index: number): void {
    this.coins.splice(index, 1);
  }
  
  public getPlatforms(): Platform[] {
    return this.platforms;
  }
  
  public getCoins(): Coin[] {
    return this.coins;
  }
  
  public render(ctx: CanvasRenderingContext2D): void {
    // Render map tiles
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        const tile = this.map[y][x];
        if (tile === 0) continue; // Sky - nothing to draw
        
        if (tile === 1) { // Ground/platform
          ctx.fillStyle = '#8F563B';
          ctx.fillRect(
            x * this.tileSize,
            y * this.tileSize,
            this.tileSize,
            this.tileSize
          );
        }
      }
    }
    
    // Render coins
    ctx.fillStyle = '#FBD000';
    for (const coin of this.coins) {
      ctx.beginPath();
      ctx.arc(
        coin.x + coin.width / 2,
        coin.y + coin.height / 2,
        coin.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}
