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
    
    selectCharacter(character: Character): void;
    startGame(): void;
    gameOver(): void;
    restartGame(): void;
    updateSettings(settings: any): void;
    
    // Add other methods as needed
  }
}