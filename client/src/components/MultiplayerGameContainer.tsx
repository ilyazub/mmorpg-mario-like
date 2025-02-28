import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from "@/hooks/use-toast";
import { Character } from '../game/engine';
import { getWebSocketURL } from '../env';
// Import Three.js directly here to make sure it's loaded before our game
import * as THREE from 'three';

export default function MultiplayerGameContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characters, setCharacters] = useState<Character[]>([
    { id: '1', name: 'Atlas', sprite: 'hero_red.png', speed: 5, jump: 10 },
    { id: '2', name: 'Nova', sprite: 'hero_blue.png', speed: 6, jump: 11 },
    { id: '3', name: 'Orion', sprite: 'hero_green.png', speed: 4, jump: 8 },
    { id: '4', name: 'Luna', sprite: 'hero_purple.png', speed: 7, jump: 7 }
  ]);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      console.log('Initializing game and attaching event listeners');
      
      // Dynamically import the MultiplayerPlatformer to avoid MIME type issues
      import('../game/MultiplayerPlatformer').then(module => {
        try {
          // Initialize game on component mount with WebSocket URL
          const wsUrl = getWebSocketURL();
          console.log(`Initializing game with WebSocket URL: ${wsUrl}`);
          
          // Extract the default export of the dynamically imported module
          const MultiplayerPlatformerClass = module.default;
          console.log('MultiplayerPlatformer loaded:', MultiplayerPlatformerClass);
          
          // Create an instance of the game class with the container and WebSocket URL
          if (containerRef.current) {
            // Use type assertion to treat containerRef.current as HTMLElement
            gameRef.current = new MultiplayerPlatformerClass(containerRef.current as HTMLElement, wsUrl);
          } else {
            throw new Error("Container element is not available");
          }
          
          // Notify user that game is ready
          toast({
            title: "Game Initialized",
            description: "Multiplayer features are ready. Select a character to begin!",
          });
        } catch (error) {
          console.error('Error initializing game:', error);
          toast({
            title: "Game Initialization Failed",
            description: "There was a problem starting the game. Please try refreshing the page.",
            variant: "destructive",
          });
        }
      }).catch(error => {
        console.error('Failed to load MultiplayerPlatformer module:', error);
        toast({
          title: "Module Loading Failed",
          description: "Failed to load game module. Please try refreshing the page.",
          variant: "destructive",
        });
      });
      
      // Manually attach key event handlers to make sure they're connected
      const handleKeyDown = (event: KeyboardEvent) => {
        if (gameRef.current) {
          gameRef.current.handleKeyDown(event);
        }
      };
      
      const handleKeyUp = (event: KeyboardEvent) => {
        if (gameRef.current) {
          gameRef.current.handleKeyUp(event);
        }
      };
      
      // Add keydown/keyup listeners to window
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      
      // Add resize handler
      const handleResize = () => {
        if (gameRef.current && typeof gameRef.current.handleResize === 'function') {
          gameRef.current.handleResize();
        }
      };
      window.addEventListener('resize', handleResize);
      
      // Set up interval to update UI with game stats
      const statsInterval = setInterval(() => {
        if (gameRef.current) {
          setScore(gameRef.current.score || 0);
          setLives(gameRef.current.lives || 3);
        }
      }, 500);
      
      return () => {
        console.log('Cleaning up game and event listeners');
        clearInterval(statsInterval);
        
        // Remove manually added event listeners
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('resize', handleResize);
        
        // Clean up when component unmounts
        if (gameRef.current) {
          // Close WebSocket if it exists
          if (gameRef.current.socket) {
            if (typeof gameRef.current.socket.disconnect === 'function') {
              gameRef.current.socket.disconnect();
            } else if (typeof gameRef.current.socket.close === 'function') {
              gameRef.current.socket.close();
            }
          }
        }
      };
    }
  }, []);

  const startGame = useCallback(() => {
    if (!selectedCharacter) {
      toast({
        title: "Character Required",
        description: "Please select a character before starting the game.",
        variant: "destructive",
      });
      return;
    }
    
    if (gameRef.current) {
      try {
        gameRef.current.startGame();
        setIsGameStarted(true);
        toast({
          title: "Game Started",
          description: `Starting adventure with ${selectedCharacter.name}. Good luck!`,
        });
      } catch (error) {
        console.error('Error starting game:', error);
        toast({
          title: "Game Start Failed",
          description: "There was a problem starting the game. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [selectedCharacter]);

  const restartGame = useCallback(() => {
    if (gameRef.current) {
      try {
        gameRef.current.restartGame();
        setIsGameStarted(true);
        toast({
          title: "Game Restarted",
          description: "The game has been restarted. Good luck!",
        });
      } catch (error) {
        console.error('Error restarting game:', error);
        toast({
          title: "Restart Failed",
          description: "Failed to restart the game. Please refresh the page.",
          variant: "destructive",
        });
      }
    }
  }, []);

  const selectCharacter = useCallback((character: Character) => {
    setSelectedCharacter(character);
    if (gameRef.current) {
      try {
        gameRef.current.selectCharacter(character);
        toast({
          title: "Character Selected",
          description: `${character.name} selected! Speed: ${character.speed}, Jump: ${character.jump}`,
        });
      } catch (error) {
        console.error('Error selecting character:', error);
        toast({
          title: "Selection Failed",
          description: "Failed to select character. Please try another one.",
          variant: "destructive",
        });
      }
    }
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-b from-blue-400 to-blue-600">
      {/* Character selection modal */}
      {!isGameStarted && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-50">
          <Card className="w-full max-w-md p-6 bg-white bg-opacity-90 shadow-xl rounded-xl">
            <h2 className="text-2xl font-bold text-center mb-4">Choose Your Character</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {characters.map(character => (
                <Button
                  key={character.id}
                  onClick={() => selectCharacter(character)}
                  className={`h-16 ${selectedCharacter?.id === character.id ? 'bg-green-500 border-2 border-white' : 'bg-blue-500'}`}
                >
                  {character.name}
                </Button>
              ))}
            </div>
            
            <Button 
              onClick={startGame} 
              className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-bold"
              disabled={!selectedCharacter}
            >
              Start Game
            </Button>
          </Card>
        </div>
      )}
      
      {/* Side UI Panel */}
      {isGameStarted && (
        <div className="absolute top-0 right-0 bg-black bg-opacity-70 text-white p-4 rounded-bl-lg z-10 max-w-xs">
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2 text-center border-b border-white pb-1">Game Stats</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>Score:</div><div className="font-semibold">{score}</div>
              <div>Lives:</div><div className="font-semibold">{lives}</div>
              <div>Enemies:</div><div className="font-semibold">{gameRef.current?.crushableObstacles?.length || 0}</div>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2 text-center border-b border-white pb-1">Controls</h3>
            <ul className="text-sm space-y-1">
              <li><span className="font-semibold">Move:</span> WASD Keys</li>
              <li><span className="font-semibold">Fly Higher:</span> Space Bar</li>
              <li><span className="font-semibold">Rotate Camera:</span> Arrow Keys</li>
              <li><span className="font-semibold">Attack:</span> F or X Key</li>
              <li><span className="font-semibold">Quick Rotate:</span> V Key</li>
              <li><span className="font-semibold">Reset Camera:</span> C Key</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2 text-center border-b border-white pb-1">Tips</h3>
            <ul className="text-sm space-y-1">
              <li>Collect coins for +10 points</li>
              <li>Crush enemies for +50 points</li>
              <li>Attack enemies for +100 points</li>
              <li>Power-ups give special abilities!</li>
            </ul>
          </div>
          
          <Button 
            onClick={restartGame} 
            className="w-full mt-2 bg-red-500 hover:bg-red-600"
          >
            Restart Game
          </Button>
        </div>
      )}
      
      {/* Full-screen Game Container */}
      <div 
        ref={containerRef} 
        className="game-container w-full h-full"
      />
    </div>
  );
}