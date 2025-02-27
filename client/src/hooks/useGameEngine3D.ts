import { useEffect, useState, useRef } from 'react';
import { GameEngine3D, GameSettings3D, GameState3D } from '@/game/engine3d';
import { Character } from '@/game/engine';
import io, { Socket } from 'socket.io-client';

export function useGameEngine3D() {
  const gameEngineRef = useRef<GameEngine3D | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [gameStats, setGameStats] = useState({
    coins: 0,
    score: 0,
    lives: 3,
    time: 0,
    world: 'World 1-1',
  });
  
  const [characters] = useState<Character[]>([
    {
      id: 'mario',
      name: 'Mario',
      sprite: '/assets/mario.png',
      speed: 1.0,
      jump: 1.0
    },
    {
      id: 'luigi',
      name: 'Luigi',
      sprite: '/assets/luigi.png',
      speed: 0.9,
      jump: 1.2
    },
    {
      id: 'toad',
      name: 'Toad',
      sprite: '/assets/toad.png',
      speed: 1.2,
      jump: 0.8
    }
  ]);

  const initGame = (canvas: HTMLCanvasElement) => {
    if (!canvas) return;
    
    canvasRef.current = canvas;
    
    // Create game engine instance
    const engine = new GameEngine3D(canvas, characters);
    gameEngineRef.current = engine;
    
    // Initialize the game (create terrain, platforms, etc.)
    engine.initGame();
    
    // Setup socket connection for multiplayer
    const socket = io();
    socketRef.current = socket;
    
    // Listen for players joining
    socket.on('playerJoin', (data: { id: string, character: Character, position: { x: number, y: number, z: number } }) => {
      engine.addOnlineUser(data.id, data.character, data.position);
    });
    
    // Listen for player position updates
    socket.on('playerMove', (data: { id: string, position: { x: number, y: number, z: number } }) => {
      engine.updateOnlineUser(data.id, data.position);
    });
    
    // Listen for players leaving
    socket.on('playerLeave', (id: string) => {
      engine.removeOnlineUser(id);
    });
    
    // Resize handler
    const handleResize = () => {
      if (canvas && gameEngineRef.current) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gameEngineRef.current.resize(canvas.width, canvas.height);
      }
    };
    
    // Set initial size
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // State update interval
    const stateInterval = setInterval(() => {
      if (gameEngineRef.current) {
        const gameState = gameEngineRef.current.state;
        
        setIsLoading(gameState.isLoading);
        setIsGameOver(gameState.isGameOver);
        setIsPaused(gameState.isPaused);
        
        setGameStats({
          coins: gameState.coins,
          score: gameState.score,
          lives: gameState.lives,
          time: Math.floor(gameState.time),
          world: gameState.world
        });
        
        // Send position updates to server if game is running
        if (!gameState.isLoading && !gameState.isPaused && !gameState.isGameOver && selectedCharacter) {
          const position = gameEngineRef.current.getPlayerPosition();
          socket.emit('updatePosition', { 
            character: selectedCharacter,
            position
          });
        }
      }
    }, 100);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(stateInterval);
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  };

  const selectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    
    if (gameEngineRef.current) {
      gameEngineRef.current.selectCharacter(character);
    }
    
    // Notify server about character selection
    if (socketRef.current) {
      socketRef.current.emit('selectCharacter', character);
    }
  };

  const startGame = () => {
    if (gameEngineRef.current && selectedCharacter) {
      gameEngineRef.current.startGame();
      setIsGameStarted(true);
    }
  };

  const pauseGame = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.pauseGame();
    }
  };

  const resumeGame = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.resumeGame();
    }
  };

  const restartGame = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.restartGame();
    }
  };

  const updateSettings = (settings: Partial<GameSettings3D>) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.updateSettings(settings);
    }
  };

  const handleTouchStart = (control: string) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setTouchControl(control, true);
    }
  };

  const handleTouchEnd = (control: string) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setTouchControl(control, false);
    }
  };

  return {
    initGame,
    selectCharacter,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    updateSettings,
    handleTouchStart,
    handleTouchEnd,
    characters,
    selectedCharacter,
    isLoading,
    isGameStarted,
    isGameOver,
    isPaused,
    gameStats,
    canvasRef
  };
}