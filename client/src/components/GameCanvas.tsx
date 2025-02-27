import { useEffect } from 'react';

interface GameCanvasProps {
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

export default function GameCanvas({
  gameEngine,
  isLoading,
  isGameOver,
  gameStats,
  onRestartGame
}: GameCanvasProps) {
  // Initialize the canvas and game engine on mount
  useEffect(() => {
    const canvas = gameEngine.canvasRef.current;
    if (canvas && !gameEngine.gameRef?.current) {
      gameEngine.initGame(canvas);
    }
  }, [gameEngine]);

  return (
    <div className="relative w-full aspect-video max-h-[70vh] pixel-border mb-4">
      <canvas 
        id="gameCanvas" 
        ref={gameEngine.canvasRef}
        className="w-full h-full bg-sky-blue"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Game Status Overlay */}
      <div className="absolute top-0 left-0 p-2 flex items-center space-x-4 font-pixel text-xs text-white">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-coin-yellow rounded-full mr-1"></div>
          <span>× {gameStats.coins}</span>
        </div>
        <div>WORLD {gameStats.world}</div>
        <div>TIME: {Math.ceil(gameStats.time)}</div>
      </div>
      
      {/* Loading Screen - hidden when game is loaded */}
      {isLoading && (
        <div id="loadingScreen" className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center">
          <span className="font-pixel text-white mb-4 text-center">LOADING WORLD...</span>
          <div className="w-48 h-6 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-mario-red" style={{ width: '75%' }}></div>
          </div>
        </div>
      )}
      
      {/* Game Over Screen - hidden initially */}
      {isGameOver && (
        <div id="gameOverScreen" className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center">
          <span className="font-pixel text-mario-red text-2xl mb-6">GAME OVER</span>
          <button 
            className="font-pixel text-white bg-pipe-green px-4 py-2 rounded hover:bg-green-700 transition"
            onClick={onRestartGame}
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
