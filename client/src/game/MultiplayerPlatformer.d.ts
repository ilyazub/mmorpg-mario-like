declare module '../game/MultiplayerPlatformer' {
  export interface Character {
    id: string;
    name: string;
    sprite: string;
    speed: number;
    jump: number;
  }

  export default class MultiplayerPlatformer {
    constructor(container: HTMLElement);
    
    isRunning: boolean;
    score: number;
    lives: number;
    players: Map<string, any>;
    obstacles: any[];
    crushableObstacles: any[];
    socket: any;
    playerMesh: any;
    characterData: Character | null;
    isAttacking: boolean;
    attackCooldown: number;
    
    // Game methods
    selectCharacter(character: Character): void;
    startGame(): void;
    gameOver(): void;
    restartGame(): void;
    updateSettings(settings: any): void;
    
    // Movement and input
    handleKeyDown(event: KeyboardEvent): void;
    handleKeyUp(event: KeyboardEvent): void;
    updatePlayerPosition(deltaTime: number): void;
    
    // Attack methods
    performAttack(): void;
    checkAttackCollisions(attackMesh: any): void;
    
    // Collision detection
    checkPlatformCollisions(): void;
    checkCoinCollisions(): void;
    checkCrushableObstacleCollisions(): void;
    
    // Obstacle handling
    crushObstacle(obstacle: any): void;
    updateCrushableObstacles(): void;
    
    // Visual effects
    showPlayerDamageEffect(): void;
    showEnemyAttackEffect(position: {x: number, y: number, z: number}): void;
    showRemotePlayerAttack(position: {x: number, y: number, z: number}, color: number): void;
    
    // Animation and rendering
    animate(): void;
    updatePlayerLabels(): void;
  }
}