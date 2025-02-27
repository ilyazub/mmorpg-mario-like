import { useEffect, useRef } from 'react';
import { GameEngine3D } from '@/game/engine3d';
import { Character } from '@/shared/schema';

interface Game3DCanvasProps {
  gameEngine: any;
  isLoading: boolean;
  isGameOver: boolean;
  gameStats: {
    coins: number;
    score: number;
    lives: number;
    time: number;
    world: string;
  };
  onRestartGame: () => void;
}

export default function Game3DCanvas({
  gameEngine,
  isLoading,
  isGameOver,
  gameStats,
  onRestartGame
}: Game3DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && gameEngine && gameEngine.initGame) {
      // Initialize the 3D game with the canvas element
      const cleanupFn = gameEngine.initGame(canvasRef.current);
      
      return () => {
        if (cleanupFn) cleanupFn();
      };
    }
  }, [gameEngine]);
  
  return (
    <div className="relative w-full h-full">
      {/* Game Canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full bg-sky-300"
      />
      
      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80">
          <div className="w-32 h-32 border-8 border-pipe-green border-t-mario-red rounded-full animate-spin mb-4"></div>
          <p className="text-white font-pixel text-xl">LOADING...</p>
        </div>
      )}
      
      {/* Game Over Screen */}
      {isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80">
          <h2 className="text-mario-red font-pixel text-4xl mb-4">GAME OVER</h2>
          <p className="text-white font-retro text-xl mb-2">Final Score: {gameStats.score}</p>
          <p className="text-white font-retro text-xl mb-6">Coins Collected: {gameStats.coins}</p>
          
          <button 
            className="font-pixel text-white bg-mario-red px-6 py-3 rounded-lg text-lg hover:bg-red-700 transition"
            onClick={onRestartGame}
          >
            PLAY AGAIN
          </button>
        </div>
      )}
      
      {/* Game HUD */}
      {!isLoading && !isGameOver && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center bg-gray-900 bg-opacity-70 rounded-lg p-3">
          <div>
            <p className="text-white font-pixel text-sm md:text-base">
              <span className="text-mario-red">WORLD:</span> {gameStats.world}
            </p>
          </div>
          
          <div className="flex space-x-6">
            <p className="text-white font-pixel text-sm md:text-base">
              <span className="text-coin-yellow">COINS:</span> {gameStats.coins}
            </p>
            <p className="text-white font-pixel text-sm md:text-base">
              <span className="text-pipe-green">SCORE:</span> {gameStats.score}
            </p>
            <p className="text-white font-pixel text-sm md:text-base">
              <span className="text-sky-blue">TIME:</span> {Math.floor(gameStats.time)}
            </p>
            <p className="text-white font-pixel text-sm md:text-base">
              <span className="text-mario-red">LIVES:</span> {gameStats.lives}
            </p>
          </div>
        </div>
      )}
      
      {/* Mobile instructions overlay */}
      <div className="absolute bottom-4 left-4 md:hidden text-white text-xs bg-gray-900 bg-opacity-70 rounded p-2">
        <p>Use the on-screen controls to move and jump</p>
      </div>
      
      {/* Desktop instructions overlay */}
      <div className="absolute bottom-4 left-4 hidden md:block text-white text-xs bg-gray-900 bg-opacity-70 rounded p-2">
        <p>Use WASD/Arrow Keys to move and SPACE to jump</p>
      </div>
    </div>
  );
}