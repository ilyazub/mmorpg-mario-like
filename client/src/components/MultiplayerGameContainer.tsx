import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import MultiplayerPlatformer from '../game/MultiplayerPlatformer';
import { Character } from '../game/engine';

export default function MultiplayerGameContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characters, setCharacters] = useState<Character[]>([
    { id: '1', name: 'Mario', sprite: 'mario.png', speed: 5, jump: 10 },
    { id: '2', name: 'Luigi', sprite: 'luigi.png', speed: 6, jump: 11 },
    { id: '3', name: 'Peach', sprite: 'peach.png', speed: 4, jump: 8 },
    { id: '4', name: 'Toad', sprite: 'toad.png', speed: 7, jump: 7 }
  ]);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      // Initialize game on component mount
      gameRef.current = new MultiplayerPlatformer(containerRef.current);
      
      // Set up interval to update UI with game stats
      const statsInterval = setInterval(() => {
        if (gameRef.current) {
          setScore(gameRef.current.score);
          setLives(gameRef.current.lives);
        }
      }, 500);
      
      return () => {
        clearInterval(statsInterval);
        // Clean up event listeners when component unmounts
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-blue-400 to-blue-600">
      <h1 className="game-title mb-6">Mario Multiplayer Adventure</h1>
      
      {!isGameStarted && (
        <Card className="w-full max-w-md p-6 mb-8 bg-white bg-opacity-90 shadow-xl rounded-xl">
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
      )}
      
      <div 
        ref={containerRef} 
        className="game-container relative w-full max-w-6xl aspect-video rounded-lg overflow-hidden shadow-2xl"
      >
        {/* Game UI overlay */}
        {isGameStarted && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded z-10">
            <div>Score: {score}</div>
            <div>Lives: {lives}</div>
            <div>Enemies: {gameRef.current?.crushableObstacles?.length || 0}</div>
            <div>Players: {gameRef.current?.players?.size || 1}</div>
          </div>
        )}
        
        {/* Game restart button */}
        {isGameStarted && (
          <Button
            onClick={restartGame}
            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white z-10"
          >
            Restart
          </Button>
        )}
      </div>
      
      {/* Game controls info */}
      <div className="mt-6 p-4 bg-black bg-opacity-75 text-white rounded-lg max-w-md">
        <h3 className="font-bold mb-2">Controls:</h3>
        <ul className="list-disc pl-5">
          <li>Movement: Arrow Keys or WASD</li>
          <li>Jump: Space Bar</li>
          <li>Collect coins to increase your score!</li>
          <li>Jump on enemies to crush them! (+50 points)</li>
          <li>Avoid enemies from the sides or you'll lose a life!</li>
          <li>Play with friends - obstacles crushed by one player are crushed for everyone!</li>
        </ul>
      </div>
    </div>
  );
}