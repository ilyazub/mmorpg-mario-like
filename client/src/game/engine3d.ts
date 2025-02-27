import * as THREE from 'three';
import { Character } from './engine';

export interface GameSettings3D {
  musicVolume: number;
  sfxVolume: number;
  showFPS: boolean;
  shadows: boolean;
  quality: 'low' | 'medium' | 'high';
}

export interface GameState3D {
  isLoading: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  score: number;
  coins: number;
  lives: number;
  time: number;
  world: string;
}

export class GameEngine3D {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private characters: Character[] = [];
  private selectedCharacter: Character | null = null;
  private playerMesh: THREE.Group | null = null;
  private playerPosition = { x: 0, y: 1, z: 0 };
  private playerVelocity = { x: 0, y: 0, z: 0 };
  private gravity = 9.8;
  private isJumping = false;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsUpdateTime: number = 0;
  private loadingManager: THREE.LoadingManager;
  private textureLoader: THREE.TextureLoader;
  private models: { [key: string]: THREE.Group } = {};
  private terrainMesh: THREE.Mesh | null = null;
  private coins: THREE.Mesh[] = [];
  private platforms: THREE.Mesh[] = [];
  private keyStates: { [key: string]: boolean } = {};
  private touchControls: { [key: string]: boolean } = {};
  private onlineUsers: Map<string, { 
    mesh: THREE.Group, 
    position: { x: number, y: number, z: number },
    character: Character 
  }> = new Map();

  public settings: GameSettings3D = {
    musicVolume: 70,
    sfxVolume: 80,
    showFPS: false,
    shadows: true,
    quality: 'medium'
  };

  public state: GameState3D = {
    isLoading: true,
    isGameOver: false,
    isPaused: false,
    score: 0,
    coins: 0,
    lives: 3,
    time: 0,
    world: 'World 1-1'
  };

  constructor(canvas: HTMLCanvasElement, characters: Character[]) {
    this.canvas = canvas;
    this.characters = characters;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, 
      canvas.width / canvas.height, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
    
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true 
    });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setClearColor(0x87CEEB); // Sky blue background
    this.renderer.shadowMap.enabled = true;
    
    this.clock = new THREE.Clock();
    
    this.loadingManager = new THREE.LoadingManager();
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    
    this.setupLights();
    this.setupEventListeners();
    
    this.loadingManager.onLoad = () => {
      this.state.isLoading = false;
    };
  }

  private setupLights(): void {
    // Ambient light for overall scene illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Directional light to simulate sunlight
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    this.scene.add(sunLight);
  }

  private setupEventListeners(): void {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.keyStates[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keyStates[e.code] = false;
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = this.canvas.width / this.canvas.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.canvas.width, this.canvas.height);
    });
  }

  public setTouchControl(control: string, active: boolean): void {
    this.touchControls[control] = active;
  }

  private createTerrain(): void {
    // Create a simple flat terrain
    const terrainGeometry = new THREE.PlaneGeometry(100, 100);
    const terrainMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513, // Brown color for ground
      roughness: 0.8,
      metalness: 0.2
    });
    this.terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
    this.terrainMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  private createPlatforms(): void {
    // Create some platforms
    for (let i = 0; i < 5; i++) {
      const platformGeometry = new THREE.BoxGeometry(5, 1, 5);
      const platformMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513, // Brown color for platforms
        roughness: 0.7,
        metalness: 0.3
      });
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(
        (Math.random() - 0.5) * 30,
        1 + Math.random() * 3,
        (Math.random() - 0.5) * 30
      );
      platform.castShadow = true;
      platform.receiveShadow = true;
      
      this.platforms.push(platform);
      this.scene.add(platform);
    }
  }

  private createCoins(): void {
    // Create collectible coins
    for (let i = 0; i < 10; i++) {
      const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
      const coinMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700, // Gold color for coins
        roughness: 0.3,
        metalness: 0.8
      });
      const coin = new THREE.Mesh(coinGeometry, coinMaterial);
      coin.position.set(
        (Math.random() - 0.5) * 40,
        1 + Math.random() * 4,
        (Math.random() - 0.5) * 40
      );
      coin.rotation.x = Math.PI / 2; // Make coin flat
      coin.castShadow = true;
      
      this.coins.push(coin);
      this.scene.add(coin);
    }
  }

  public selectCharacter(character: Character): void {
    this.selectedCharacter = character;
    this.createPlayerCharacter();
  }

  private createPlayerCharacter(): void {
    if (!this.selectedCharacter) return;
    
    // Remove existing player mesh if any
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh);
    }
    
    // For now, create a simple colored cube as player
    // In a real game, you would load a 3D model instead
    this.playerMesh = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
    let bodyMaterial: THREE.MeshStandardMaterial;
    
    // Set color based on character
    switch(this.selectedCharacter.name) {
      case 'Mario':
        bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 }); // Red
        break;
      case 'Luigi':
        bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00 }); // Green
        break;
      case 'Toad':
        bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0000FF }); // Blue
        break;
      default:
        bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF }); // White
    }
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    body.castShadow = true;
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFA07A }); // Light skin tone
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.7;
    head.castShadow = true;
    
    // Add all parts to the player group
    this.playerMesh.add(body);
    this.playerMesh.add(head);
    
    // Position the player
    this.playerMesh.position.set(
      this.playerPosition.x, 
      this.playerPosition.y, 
      this.playerPosition.z
    );
    
    this.scene.add(this.playerMesh);
  }

  public initGame(): void {
    this.createTerrain();
    this.createPlatforms();
    this.createCoins();
    
    this.gameLoop(0);
  }

  public startGame(): void {
    if (!this.selectedCharacter || !this.playerMesh) {
      console.error("Cannot start game: No character selected");
      return;
    }
    
    this.state.isPaused = false;
    this.state.isGameOver = false;
    this.state.coins = 0;
    this.state.score = 0;
    this.state.time = 0;
    this.state.lives = 3;
    
    // Reset player position
    this.playerPosition = { x: 0, y: 1, z: 0 };
    this.playerVelocity = { x: 0, y: 0, z: 0 };
    this.playerMesh.position.set(
      this.playerPosition.x, 
      this.playerPosition.y, 
      this.playerPosition.z
    );
    
    // Position camera behind player
    this.updateCameraPosition();
  }

  public pauseGame(): void {
    this.state.isPaused = true;
  }

  public resumeGame(): void {
    this.state.isPaused = false;
  }

  public endGame(): void {
    this.state.isGameOver = true;
  }

  public restartGame(): void {
    this.startGame();
  }

  public updateSettings(settings: Partial<GameSettings3D>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Apply settings changes
    if (settings.shadows !== undefined) {
      this.renderer.shadowMap.enabled = settings.shadows;
    }
    
    if (settings.quality !== undefined) {
      switch (settings.quality) {
        case 'low':
          this.renderer.setPixelRatio(window.devicePixelRatio * 0.5);
          break;
        case 'medium':
          this.renderer.setPixelRatio(window.devicePixelRatio * 0.75);
          break;
        case 'high':
          this.renderer.setPixelRatio(window.devicePixelRatio);
          break;
      }
    }
  }

  private gameLoop(timestamp: number): void {
    requestAnimationFrame((time) => this.gameLoop(time));
    
    // Calculate delta time
    const deltaTime = this.clock.getDelta();
    
    // Update FPS counter
    this.frameCount++;
    if (timestamp - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = timestamp;
    }
    
    if (!this.state.isPaused && !this.state.isGameOver) {
      this.update(deltaTime);
    }
    
    this.render();
  }

  private update(deltaTime: number): void {
    // Skip updates if game is loading, paused, or game over
    if (this.state.isLoading || this.state.isPaused || this.state.isGameOver) {
      return;
    }
    
    // Update game time
    this.state.time += deltaTime;
    
    // Handle player input
    this.handleInput(deltaTime);
    
    // Update physics
    this.updatePhysics(deltaTime);
    
    // Check for collisions
    this.checkCollisions();
    
    // Update camera position relative to player
    this.updateCameraPosition();
  }

  private handleInput(deltaTime: number): void {
    if (!this.playerMesh) return;
    
    const speed = this.selectedCharacter ? this.selectedCharacter.speed * 5 : 5;
    const jumpForce = this.selectedCharacter ? this.selectedCharacter.jump * 5 : 10;
    
    // Reset movement velocity
    this.playerVelocity.x = 0;
    this.playerVelocity.z = 0;
    
    // Forward/backward movement (Z axis)
    if (this.keyStates['KeyW'] || this.keyStates['ArrowUp'] || this.touchControls['up']) {
      this.playerVelocity.z = -speed * deltaTime;
    } else if (this.keyStates['KeyS'] || this.keyStates['ArrowDown'] || this.touchControls['down']) {
      this.playerVelocity.z = speed * deltaTime;
    }
    
    // Left/right movement (X axis)
    if (this.keyStates['KeyA'] || this.keyStates['ArrowLeft'] || this.touchControls['left']) {
      this.playerVelocity.x = -speed * deltaTime;
    } else if (this.keyStates['KeyD'] || this.keyStates['ArrowRight'] || this.touchControls['right']) {
      this.playerVelocity.x = speed * deltaTime;
    }
    
    // Jumping
    if ((this.keyStates['Space'] || this.touchControls['jump']) && !this.isJumping) {
      this.playerVelocity.y = jumpForce;
      this.isJumping = true;
    }
  }

  private updatePhysics(deltaTime: number): void {
    if (!this.playerMesh) return;
    
    // Apply gravity to vertical velocity
    this.playerVelocity.y -= this.gravity * deltaTime;
    
    // Update player position based on velocity
    this.playerPosition.x += this.playerVelocity.x;
    this.playerPosition.y += this.playerVelocity.y * deltaTime;
    this.playerPosition.z += this.playerVelocity.z;
    
    // Check ground collision
    const groundLevel = 1; // Assuming the ground is at y=0 and player is 1 unit tall
    if (this.playerPosition.y <= groundLevel) {
      this.playerPosition.y = groundLevel;
      this.playerVelocity.y = 0;
      this.isJumping = false;
    }
    
    // Update player mesh position
    this.playerMesh.position.set(
      this.playerPosition.x, 
      this.playerPosition.y, 
      this.playerPosition.z
    );
    
    // Make the player face the direction of movement
    if (this.playerVelocity.x !== 0 || this.playerVelocity.z !== 0) {
      const angle = Math.atan2(this.playerVelocity.x, this.playerVelocity.z);
      this.playerMesh.rotation.y = angle;
    }
  }

  private updateCameraPosition(): void {
    if (!this.playerMesh) return;
    
    // Position camera behind player
    const idealOffset = new THREE.Vector3(
      this.playerPosition.x, 
      this.playerPosition.y + 3, 
      this.playerPosition.z + 7
    );
    
    // Smoothly move camera to ideal position
    this.camera.position.lerp(idealOffset, 0.1);
    
    // Look at player
    this.camera.lookAt(
      this.playerPosition.x,
      this.playerPosition.y + 1,
      this.playerPosition.z
    );
  }

  private checkCollisions(): void {
    if (!this.playerMesh) return;
    
    // Create a bounding box for the player
    const playerBB = new THREE.Box3().setFromObject(this.playerMesh);
    
    // Check collisions with coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      const coinBB = new THREE.Box3().setFromObject(coin);
      
      if (playerBB.intersectsBox(coinBB)) {
        // Collision with coin
        this.scene.remove(coin);
        this.coins.splice(i, 1);
        
        // Update game state
        this.state.coins++;
        this.state.score += 100;
        
        // TODO: Play coin collection sound
      }
    }
    
    // Check platform collisions
    for (const platform of this.platforms) {
      const platformBB = new THREE.Box3().setFromObject(platform);
      
      // Simplified platform collision (only check when falling)
      if (this.playerVelocity.y < 0 && playerBB.intersectsBox(platformBB)) {
        const playerY = this.playerPosition.y;
        const platformY = platform.position.y;
        
        // Calculate platform height - THREE.BoxGeometry has predefined parameters
        let platformHeight = 1; // Default fallback height
        if (platform.geometry instanceof THREE.BoxGeometry) {
          platformHeight = platform.geometry.parameters.height;
        }
        
        if (playerY > platformY + platformHeight / 2) {
          this.playerPosition.y = platformY + platformHeight / 2 + 1; // 1 is player height
          this.playerVelocity.y = 0;
          this.isJumping = false;
        }
      }
    }
    
    // Check world boundaries
    const boundary = 50;
    if (
      Math.abs(this.playerPosition.x) > boundary || 
      Math.abs(this.playerPosition.z) > boundary
    ) {
      this.playerPosition.y = 0;
      this.playerVelocity.y = 0;
      
      // Move player back in bounds
      this.playerPosition.x = Math.max(-boundary, Math.min(boundary, this.playerPosition.x));
      this.playerPosition.z = Math.max(-boundary, Math.min(boundary, this.playerPosition.z));
      
      // Update player mesh position
      this.playerMesh.position.set(
        this.playerPosition.x, 
        this.playerPosition.y, 
        this.playerPosition.z
      );
    }
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
    
    // Animate coins rotation
    for (const coin of this.coins) {
      coin.rotation.y += 0.02;
    }
    
    // Show FPS if enabled
    if (this.settings.showFPS) {
      // In a real implementation, you would render this to a HUD element
      console.log(`FPS: ${this.fps}`);
    }
  }

  public addOnlineUser(userId: string, character: Character, position: { x: number, y: number, z: number }): void {
    // Create a mesh for the online player
    const playerGroup = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
    let bodyMaterial: THREE.MeshStandardMaterial;
    
    // Set color based on character
    switch(character.name) {
      case 'Mario':
        bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 }); // Red
        break;
      case 'Luigi':
        bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00 }); // Green
        break;
      case 'Toad':
        bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0000FF }); // Blue
        break;
      default:
        bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF }); // White
    }
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    body.castShadow = true;
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFA07A }); // Light skin tone
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.7;
    head.castShadow = true;
    
    // Add label with player name
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = 256;
      canvas.height = 64;
      context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'white';
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillText(userId.substring(0, 8), canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.SpriteMaterial({ map: texture });
      const label = new THREE.Sprite(labelMaterial);
      label.position.y = 2.5;
      label.scale.set(2, 0.5, 1);
      
      playerGroup.add(label);
    }
    
    // Add all parts to the player group
    playerGroup.add(body);
    playerGroup.add(head);
    
    // Position the player
    playerGroup.position.set(position.x, position.y, position.z);
    
    this.scene.add(playerGroup);
    
    // Add to online users map
    this.onlineUsers.set(userId, { mesh: playerGroup, position, character });
  }

  public updateOnlineUser(userId: string, position: { x: number, y: number, z: number }): void {
    const user = this.onlineUsers.get(userId);
    if (user) {
      user.position = position;
      user.mesh.position.set(position.x, position.y, position.z);
    }
  }

  public removeOnlineUser(userId: string): void {
    const user = this.onlineUsers.get(userId);
    if (user) {
      this.scene.remove(user.mesh);
      this.onlineUsers.delete(userId);
    }
  }

  public getPlayerPosition(): { x: number, y: number, z: number } {
    return { ...this.playerPosition };
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}