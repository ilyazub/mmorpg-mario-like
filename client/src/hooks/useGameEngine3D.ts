import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameEngine3D, GameSettings3D } from '../game/engine3d';
import { Character } from '../../shared/schema';

export function useGameEngine3D() {
  const [gameEngine, setGameEngine] = useState<GameEngine3D | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [characters, setCharacters] = useState<Character[]>([
    {
      id: 'mario',
      name: 'Mario',
      sprite: '/assets/mario.png',
      speed: 8,
      jump: 7
    },
    {
      id: 'luigi',
      name: 'Luigi',
      sprite: '/assets/luigi.png',
      speed: 7,
      jump: 9
    },
    {
      id: 'toad',
      name: 'Toad',
      sprite: '/assets/toad.png',
      speed: 10,
      jump: 5
    },
    {
      id: 'princess',
      name: 'Princess',
      sprite: '/assets/princess.png',
      speed: 6,
      jump: 6
    }
  ]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStats, setGameStats] = useState({
    coins: 0,
    score: 0,
    lives: 3,
    time: 0,
    world: 'World 1-1'
  });
  
  const initSocketConnection = useCallback(() => {
    const newSocket = io({ transports: ['websocket'] });
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    
    // Listen for other players joining
    newSocket.on('playerJoin', (data: { id: string, character: Character, position: { x: number, y: number, z: number } }) => {
      console.log('Player joined:', data);
      if (gameEngine) {
        gameEngine.addOnlineUser(data.id, data.character, data.position);
      }
    });
    
    // Listen for player position updates
    newSocket.on('playerMove', (data: { id: string, position: { x: number, y: number, z: number } }) => {
      if (gameEngine) {
        gameEngine.updateOnlineUser(data.id, data.position);
      }
    });
    
    // Listen for players leaving
    newSocket.on('playerLeave', (id: string) => {
      console.log('Player left:', id);
      if (gameEngine) {
        gameEngine.removeOnlineUser(id);
      }
    });
    
    setSocket(newSocket);
    
    return newSocket;
  }, [gameEngine]);
  
  // Position update interval
  const positionUpdateInterval = useRef<number | null>(null);
  
  // Cleanup function
  const cleanup = useRef(() => {
    if (positionUpdateInterval.current) {
      window.clearInterval(positionUpdateInterval.current);
    }
    
    if (socket) {
      socket.disconnect();
    }
  });
  
  // Create the game engine
  const initGame = useCallback((canvas: HTMLCanvasElement) => {
    if (!selectedCharacter) return;
    
    setIsLoading(true);
    
    // Initialize game engine with canvas
    const engine = new GameEngine3D(canvas, characters);
    
    // Select the character
    engine.selectCharacter(selectedCharacter);
    
    // Initialize the game
    engine.initGame();
    
    setGameEngine(engine);
    setIsLoading(false);
    
    // Connect to websocket server if not already connected
    const socketInstance = socket || initSocketConnection();
    
    // Send initial character selection to server
    socketInstance.emit('selectCharacter', selectedCharacter);
    
    // Set up position update interval
    positionUpdateInterval.current = window.setInterval(() => {
      if (engine) {
        const position = engine.getPlayerPosition();
        socketInstance.emit('updatePosition', position);
      }
    }, 100); // Update position 10 times per second
    
    // Update game stats from engine
    const statsInterval = window.setInterval(() => {
      if (engine) {
        setGameStats({
          coins: engine.state.coins,
          score: engine.state.score,
          lives: engine.state.lives,
          time: engine.state.time,
          world: engine.state.world
        });
        
        // Check for game over
        if (engine.state.isGameOver) {
          setIsGameOver(true);
        }
      }
    }, 500);
    
    // Return cleanup function
    return () => {
      clearInterval(statsInterval);
      cleanup.current();
    };
  }, [characters, selectedCharacter, socket, initSocketConnection]);
  
  // Character selection
  const selectCharacter = useCallback((character: Character) => {
    setSelectedCharacter(character);
  }, []);
  
  // Start game
  const startGame = useCallback(() => {
    if (gameEngine) {
      gameEngine.startGame();
      setIsGameStarted(true);
    }
  }, [gameEngine]);
  
  // Restart game
  const restartGame = useCallback(() => {
    if (gameEngine) {
      gameEngine.restartGame();
      setIsGameOver(false);
    }
  }, [gameEngine]);
  
  // Update settings
  const updateSettings = useCallback((settings: GameSettings3D) => {
    if (gameEngine) {
      gameEngine.updateSettings(settings);
    }
  }, [gameEngine]);
  
  // Mobile controls
  const handleTouchStart = useCallback((control: string) => {
    if (gameEngine) {
      gameEngine.setTouchControl(control, true);
    }
  }, [gameEngine]);
  
  const handleTouchEnd = useCallback((control: string) => {
    if (gameEngine) {
      gameEngine.setTouchControl(control, false);
    }
  }, [gameEngine]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup.current();
    };
  }, []);
  
  return {
    initGame,
    selectCharacter,
    startGame,
    restartGame,
    updateSettings,
    handleTouchStart,
    handleTouchEnd,
    characters,
    selectedCharacter,
    isLoading,
    isGameStarted,
    isGameOver,
    gameStats
  };
}