import { Character } from './engine';

export interface MultiplayerPlatformerInterface {
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
  
  selectCharacter(character: Character): void;
  startGame(): void;
  gameOver(): void;
  restartGame(): void;
  updateSettings(settings: any): void;
  
  handleKeyDown(event: KeyboardEvent): void;
  handleKeyUp(event: KeyboardEvent): void;
  updatePlayerPosition(deltaTime: number): void;
  
  performAttack(): void;
  checkAttackCollisions(attackMesh: any): void;
  
  checkPlatformCollisions(): void;
  checkCoinCollisions(): void;
  checkCrushableObstacleCollisions(): void;
  
  crushObstacle(obstacle: any): void;
  updateCrushableObstacles(): void;
  
  showPlayerDamageEffect(): void;
  showEnemyAttackEffect(position: {x: number, y: number, z: number}): void;
  showRemotePlayerAttack(position: {x: number, y: number, z: number}, color: number): void;
  
  updatePlayerCount(): void;
  playSound(soundName: string): void;
  
  animate(): void;
  updatePlayerLabels(): void;
}

declare class MultiplayerPlatformer implements MultiplayerPlatformerInterface {
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
  
  selectCharacter(character: Character): void;
  startGame(): void;
  gameOver(): void;
  restartGame(): void;
  updateSettings(settings: any): void;
  
  handleKeyDown(event: KeyboardEvent): void;
  handleKeyUp(event: KeyboardEvent): void;
  updatePlayerPosition(deltaTime: number): void;
  
  performAttack(): void;
  checkAttackCollisions(attackMesh: any): void;
  
  checkPlatformCollisions(): void;
  checkCoinCollisions(): void;
  checkCrushableObstacleCollisions(): void;
  
  crushObstacle(obstacle: any): void;
  updateCrushableObstacles(): void;
  
  showPlayerDamageEffect(): void;
  showEnemyAttackEffect(position: {x: number, y: number, z: number}): void;
  showRemotePlayerAttack(position: {x: number, y: number, z: number}, color: number): void;
  
  updatePlayerCount(): void;
  playSound(soundName: string): void;
  
  animate(): void;
  updatePlayerLabels(): void;
}

export default MultiplayerPlatformer;