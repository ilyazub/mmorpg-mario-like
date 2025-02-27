import { Physics } from './physics';
import { InputHandler } from './input';
import { Sprite, SpriteSheet } from './sprites';
import { Level } from './level';

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  pixelPerfect: boolean;
  showFPS: boolean;
}

export interface Character {
  id: string;
  name: string;
  sprite: string;
  speed: number;
  jump: number;
}

export interface GameState {
  isLoading: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  score: number;
  coins: number;
  lives: number;
  time: number;
  world: string;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private physics: Physics;
  private input: InputHandler;
  private level: Level;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsUpdateTime: number = 0;

  public characters: Character[] = [
    { id: 'mario', name: 'MARIO', sprite: '/src/assets/sprites/mario.svg', speed: 3, jump: 4 },
    { id: 'luigi', name: 'LUIGI', sprite: '/src/assets/sprites/luigi.svg', speed: 2, jump: 5 },
    { id: 'toad', name: 'TOAD', sprite: '/src/assets/sprites/toad.svg', speed: 5, jump: 2 }
  ];

  public settings: GameSettings = {
    musicVolume: 70,
    sfxVolume: 80,
    pixelPerfect: true,
    showFPS: false
  };

  public state: GameState = {
    isLoading: true,
    isGameOver: false,
    isPaused: false,
    score: 0,
    coins: 0,
    lives: 3,
    time: 300,
    world: "1-1"
  };

  public selectedCharacter: Character;
  public player: {
    x: number;
    y: number;
    width: number;
    height: number;
    velocityX: number;
    velocityY: number;
    isJumping: boolean;
    direction: 'left' | 'right';
    sprite?: Sprite;
  };

  private assets: {
    tiles: SpriteSheet | null;
    mario: Sprite | null;
    luigi: Sprite | null;
    toad: Sprite | null;
    coin: Sprite | null;
  } = {
    tiles: null,
    mario: null,
    luigi: null,
    toad: null,
    coin: null
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;
    this.physics = new Physics();
    this.input = new InputHandler();
    this.level = new Level();
    this.selectedCharacter = this.characters[0];

    // Initialize player with default values
    this.player = {
      x: 50,
      y: 180,
      width: 16,
      height: 22,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      direction: 'right'
    };

    // Setup canvas for pixel art
    this.setupCanvas();
    
    // Load assets
    this.loadAssets().then(() => {
      this.state.isLoading = false;
      this.initGame();
    });
  }

  private setupCanvas(): void {
    // Set dimensions for retro pixel art
    this.canvas.width = 320;
    this.canvas.height = 240;
    
    // Disable image smoothing for crisp pixels
    this.ctx.imageSmoothingEnabled = false;
  }

  private async loadAssets(): Promise<void> {
    // In a real implementation, this would load actual image assets
    // For this example, we'll use our SVG sprites directly
    
    // Simulate asset loading delay
    return new Promise(resolve => {
      setTimeout(() => {
        // Create dummy sprites
        this.assets.mario = new Sprite('/src/assets/sprites/mario.svg', 16, 22);
        this.assets.luigi = new Sprite('/src/assets/sprites/luigi.svg', 16, 22);
        this.assets.toad = new Sprite('/src/assets/sprites/toad.svg', 16, 22);
        this.assets.coin = new Sprite('/src/assets/sprites/coin.svg', 12, 12);
        this.assets.tiles = new SpriteSheet('/src/assets/sprites/tileset.svg', 16, 16);
        
        // Set player sprite based on selected character
        this.updatePlayerSprite();
        
        resolve();
      }, 1500);
    });
  }

  public updatePlayerSprite(): void {
    switch (this.selectedCharacter.id) {
      case 'mario':
        this.player.sprite = this.assets.mario;
        break;
      case 'luigi':
        this.player.sprite = this.assets.luigi;
        break;
      case 'toad':
        this.player.sprite = this.assets.toad;
        break;
    }
  }

  public selectCharacter(character: Character): void {
    this.selectedCharacter = character;
    this.updatePlayerSprite();
    
    // Update player physics based on character stats
    this.player.velocityX = 0;
    this.player.velocityY = 0;
  }

  public initGame(): void {
    // Reset game state
    this.state = {
      isLoading: false,
      isGameOver: false,
      isPaused: false,
      score: 0,
      coins: 0,
      lives: 3,
      time: 300,
      world: "1-1"
    };

    // Reset player position
    this.player.x = 50;
    this.player.y = 180;
    this.player.velocityX = 0;
    this.player.velocityY = 0;
    this.player.isJumping = false;
    this.player.direction = 'right';
    
    // Load level
    this.level.loadLevel(1);
    
    // Start game loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  public startGame(): void {
    if (this.state.isLoading) return;
    
    this.initGame();
  }

  public pauseGame(): void {
    this.state.isPaused = !this.state.isPaused;
  }

  public endGame(): void {
    this.state.isGameOver = true;
  }

  public restartGame(): void {
    this.initGame();
  }

  public updateSettings(settings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  private gameLoop(timestamp: number): void {
    // Calculate delta time for consistent movement
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Calculate FPS
    this.frameCount++;
    if (timestamp - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = timestamp;
    }
    
    // Skip updates if game is paused or over
    if (!this.state.isPaused && !this.state.isGameOver) {
      this.update(deltaTime / 1000);
    }
    
    // Always render the latest state
    this.render();
    
    // Continue the game loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private update(deltaTime: number): void {
    // Update game timer
    if (this.state.time > 0) {
      this.state.time -= deltaTime * 0.5; // slow down time decrease for game duration
      if (this.state.time <= 0) {
        this.state.time = 0;
        this.endGame();
      }
    }
    
    // Process input
    this.handleInput(deltaTime);
    
    // Update physics
    this.updatePhysics(deltaTime);
    
    // Check collisions
    this.checkCollisions();
  }

  private handleInput(deltaTime: number): void {
    const moveSpeed = this.selectedCharacter.speed * 60 * deltaTime;
    const jumpForce = this.selectedCharacter.jump * 200;
    
    // Reset velocity X if no input
    this.player.velocityX = 0;
    
    // Handle horizontal movement
    if (this.input.isLeft()) {
      this.player.velocityX = -moveSpeed;
      this.player.direction = 'left';
    }
    if (this.input.isRight()) {
      this.player.velocityX = moveSpeed;
      this.player.direction = 'right';
    }
    
    // Handle jumping
    if (this.input.isJump() && !this.player.isJumping) {
      this.player.velocityY = -jumpForce * deltaTime;
      this.player.isJumping = true;
    }
  }

  private updatePhysics(deltaTime: number): void {
    // Apply gravity
    this.player.velocityY += this.physics.gravity * deltaTime;
    
    // Update player position
    this.player.x += this.player.velocityX;
    this.player.y += this.player.velocityY;
    
    // Simple boundary checking
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x > this.canvas.width - this.player.width) {
      this.player.x = this.canvas.width - this.player.width;
    }
    
    // Ground collision
    if (this.player.y > this.canvas.height - 40 - this.player.height) {
      this.player.y = this.canvas.height - 40 - this.player.height;
      this.player.velocityY = 0;
      this.player.isJumping = false;
    }
    
    // Platform collision - simplified for demo
    const platforms = this.level.getPlatforms();
    for (const platform of platforms) {
      if (this.physics.checkPlatformCollision(this.player, platform)) {
        if (this.player.velocityY > 0) { // Only collide when falling
          this.player.y = platform.y - this.player.height;
          this.player.velocityY = 0;
          this.player.isJumping = false;
        }
      }
    }
  }

  private checkCollisions(): void {
    // Check for coin collisions
    const coins = this.level.getCoins();
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      if (this.physics.checkCollision(this.player, coin)) {
        // Collect coin
        this.state.coins++;
        this.state.score += 100;
        this.level.removeCoin(i);
      }
    }
    
    // Check if player fell off the screen
    if (this.player.y > this.canvas.height) {
      this.state.lives--;
      if (this.state.lives <= 0) {
        this.endGame();
      } else {
        // Reset player position
        this.player.x = 50;
        this.player.y = 180;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
      }
    }
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#5C94FC'; // Sky blue background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render level
    this.level.render(this.ctx);
    
    // Render player
    if (this.player.sprite) {
      this.ctx.save();
      if (this.player.direction === 'left') {
        // Flip horizontally for left direction
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.player.sprite.getImage(), -this.player.x - this.player.width, this.player.y, this.player.width, this.player.height);
      } else {
        this.ctx.drawImage(this.player.sprite.getImage(), this.player.x, this.player.y, this.player.width, this.player.height);
      }
      this.ctx.restore();
    } else {
      // Fallback if sprite isn't loaded
      this.ctx.fillStyle = '#E52521'; // Mario red
      this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }
    
    // Render HUD
    this.renderHUD();
    
    // Render FPS counter if enabled
    if (this.settings.showFPS) {
      this.ctx.font = '8px Arial';
      this.ctx.fillStyle = 'white';
      this.ctx.fillText(`FPS: ${this.fps}`, 5, 10);
    }
    
    // Render game over screen if needed
    if (this.state.isGameOver) {
      this.renderGameOver();
    }
  }

  private renderHUD(): void {
    // Set text properties
    this.ctx.font = '8px "Press Start 2P", cursive';
    this.ctx.fillStyle = 'white';
    
    // Render coin count
    this.ctx.fillText(`COINS: ${this.state.coins}`, 10, 15);
    
    // Render score
    this.ctx.fillText(`SCORE: ${this.state.score}`, 90, 15);
    
    // Render world
    this.ctx.fillText(`WORLD: ${this.state.world}`, 180, 15);
    
    // Render time
    this.ctx.fillText(`TIME: ${Math.ceil(this.state.time)}`, 250, 15);
    
    // Render lives
    this.ctx.fillText(`LIVES: ${this.state.lives}`, 10, 30);
  }

  private renderGameOver(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Game over text
    this.ctx.font = '16px "Press Start 2P", cursive';
    this.ctx.fillStyle = '#E52521'; // Mario red
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    
    // Instructions to restart
    this.ctx.font = '8px "Press Start 2P", cursive';
    this.ctx.fillStyle = 'white';
    this.ctx.fillText('PRESS RESTART TO PLAY AGAIN', this.canvas.width / 2, this.canvas.height / 2 + 20);
    
    // Reset text alignment
    this.ctx.textAlign = 'left';
  }
}
