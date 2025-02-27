import React, { useEffect, useRef, useState } from 'react';
import SimplePlatformer from '../game/SimplePlatformer';

export default function GameContainer() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      // Initialize game when component mounts
      gameRef.current = new SimplePlatformer(containerRef.current);
      
      // Set up interval to update UI with game stats
      const statsInterval = setInterval(() => {
        if (gameRef.current) {
          setScore(gameRef.current.score);
          setLives(gameRef.current.lives);
        }
      }, 500);
      
      return () => {
        clearInterval(statsInterval);
        // Clean up event listeners etc.
        window.removeEventListener('resize', gameRef.current.handleResize);
      };
    }
  }, []);

  const startGame = () => {
    if (gameRef.current) {
      gameRef.current.startGame();
      setIsGameStarted(true);
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* Game container */}
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Game UI overlay */}
      <div className="absolute top-0 left-0 w-full p-4">
        <div className="flex justify-between items-center">
          <div className="text-white bg-black bg-opacity-50 p-2 rounded">
            Score: {score}
          </div>
          <div className="text-white bg-black bg-opacity-50 p-2 rounded">
            Lives: {lives}
          </div>
        </div>
      </div>
      
      {/* Start game overlay */}
      {!isGameStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
          <h1 className="text-4xl font-bold text-white mb-6">Super Mario 3D</h1>
          <button 
            onClick={startGame}
            className="px-6 py-3 bg-red-600 text-white rounded-lg text-xl hover:bg-red-700 transition-colors"
          >
            Start Game
          </button>
          <div className="mt-10 text-white text-center max-w-md">
            <h2 className="text-xl mb-2">Controls:</h2>
            <p>WASD or Arrow Keys to move</p>
            <p>Spacebar to jump</p>
            <p>Collect all coins to win!</p>
          </div>
        </div>
      )}
      
      {/* Mobile controls overlay for touch devices */}
      <div className="absolute bottom-4 left-4 right-4 md:hidden flex justify-between">
        {/* D-pad */}
        <div className="flex flex-col">
          <button
            className="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-t-lg flex items-center justify-center"
            onTouchStart={() => gameRef.current && (gameRef.current.keys.forward = true)}
            onTouchEnd={() => gameRef.current && (gameRef.current.keys.forward = false)}
          >
            ▲
          </button>
          <div className="flex">
            <button
              className="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-l-lg flex items-center justify-center"
              onTouchStart={() => gameRef.current && (gameRef.current.keys.left = true)}
              onTouchEnd={() => gameRef.current && (gameRef.current.keys.left = false)}
            >
              ◀
            </button>
            <button
              className="w-16 h-16 bg-gray-800 bg-opacity-70 flex items-center justify-center"
              onTouchStart={() => gameRef.current && (gameRef.current.keys.backward = true)}
              onTouchEnd={() => gameRef.current && (gameRef.current.keys.backward = false)}
            >
              ▼
            </button>
            <button
              className="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-r-lg flex items-center justify-center"
              onTouchStart={() => gameRef.current && (gameRef.current.keys.right = true)}
              onTouchEnd={() => gameRef.current && (gameRef.current.keys.right = false)}
            >
              ▶
            </button>
          </div>
        </div>
        
        {/* Jump button */}
        <button
          className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold"
          onTouchStart={() => gameRef.current && (gameRef.current.keys.jump = true)}
          onTouchEnd={() => gameRef.current && (gameRef.current.keys.jump = false)}
        >
          JUMP
        </button>
      </div>
    </div>
  );
}