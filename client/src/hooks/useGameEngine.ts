import { useState, useEffect, useRef } from 'react';
import { GameEngine, GameSettings, Character } from '../game/engine';

export function useGameEngine() {
  const gameRef = useRef<GameEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStats, setGameStats] = useState({ 
    coins: 0, 
    score: 0, 
    lives: 3, 
    time: 300,
    world: '1-1'
  });
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  // Initialize game engine
  const initGame = (canvas: HTMLCanvasElement) => {
    if (!canvas) return;
    
    canvasRef.current = canvas;
    gameRef.current = new GameEngine(canvas);
    
    // Set initial characters
    setCharacters(gameRef.current.characters);
    setSelectedCharacter(gameRef.current.selectedCharacter);
  };
  
  // Update game stats for UI
  const updateGameStats = () => {
    if (!gameRef.current) return;
    
    const { coins, score, lives, time, world, isLoading, isGameOver } = gameRef.current.state;
    
    setIsLoading(isLoading);
    setIsGameOver(isGameOver);
    setGameStats({ coins, score, lives, time, world });
  };
  
  // Setup game update loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameRef.current) {
        updateGameStats();
      }
    }, 100); // Update UI at 10fps for performance
    
    return () => clearInterval(interval);
  }, []);
  
  // Game control functions
  const startGame = () => {
    if (gameRef.current) {
      gameRef.current.startGame();
    }
  };
  
  const restartGame = () => {
    if (gameRef.current) {
      gameRef.current.restartGame();
    }
  };
  
  const selectCharacter = (character: Character) => {
    if (gameRef.current) {
      gameRef.current.selectCharacter(character);
      setSelectedCharacter(character);
    }
  };
  
  const updateSettings = (settings: Partial<GameSettings>) => {
    if (gameRef.current) {
      gameRef.current.updateSettings(settings);
    }
  };
  
  // Mobile controls
  const handleTouchStart = (control: string) => {
    if (gameRef.current) {
      gameRef.current.input.setTouchControl(control, true);
    }
  };
  
  const handleTouchEnd = (control: string) => {
    if (gameRef.current) {
      gameRef.current.input.setTouchControl(control, false);
    }
  };
  
  return {
    initGame,
    startGame,
    restartGame,
    selectCharacter,
    updateSettings,
    handleTouchStart,
    handleTouchEnd,
    canvasRef,
    isLoading,
    isGameOver,
    gameStats,
    characters,
    selectedCharacter
  };
}
