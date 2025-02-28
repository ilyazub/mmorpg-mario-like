import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
// @ts-ignore - Using JS module without type definitions
import MultiplayerPlatformer from '../game/MultiplayerPlatformer.js';
import { Character } from '../game/engine';

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
      
      // Initialize game on component mount
      gameRef.current = new MultiplayerPlatformer(containerRef.current);
      
      // Manually attach key event handlers to make sure they're connected
      const handleKeyDown = (event: KeyboardEvent) => {
        console.log(`Key down: ${event.key}`);
        if (gameRef.current) {
          gameRef.current.handleKeyDown(event);
        }
      };
      
      const handleKeyUp = (event: KeyboardEvent) => {
        console.log(`Key up: ${event.key}`);
        if (gameRef.current) {
          gameRef.current.handleKeyUp(event);
        }
      };
      
      // Add keydown/keyup listeners to window
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      
      // Set up interval to update UI with game stats
      const statsInterval = setInterval(() => {
        if (gameRef.current) {
          setScore(gameRef.current.score);
          setLives(gameRef.current.lives);
        }
      }, 500);
      
      return () => {
        console.log('Cleaning up game and event listeners');
        clearInterval(statsInterval);
        
        // Remove manually added event listeners
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        
        // Clean up when component unmounts
        if (gameRef.current) {
          window.removeEventListener('resize', gameRef.current.handleResize);
          
          // Disconnect socket
          if (gameRef.current.socket) {
            gameRef.current.socket.disconnect();
          }
        }
      };
    }
  }, []);

  const startGame = () => {
    if (gameRef.current && selectedCharacter) {
      gameRef.current.startGame();
      setIsGameStarted(true);
    } else if (!selectedCharacter) {
      alert("Please select a character first!");
    }
  };

  const restartGame = () => {
    if (gameRef.current) {
      gameRef.current.restartGame();
      setIsGameStarted(true);
    }
  };

  const selectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    if (gameRef.current) {
      gameRef.current.selectCharacter(character);
    }
  };

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
              <li><span className="font-semibold">Move:</span> Arrow Keys / WASD</li>
              <li><span className="font-semibold">Jump:</span> Space Bar</li>
              <li><span className="font-semibold">Attack:</span> F, E, or X Key</li>
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