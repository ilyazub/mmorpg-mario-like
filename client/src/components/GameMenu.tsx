interface GameMenuProps {
  onStartGame: () => void;
  onShowInstructions: () => void;
  onShowSettings: () => void;
}

export default function GameMenu({ 
  onStartGame, 
  onShowInstructions, 
  onShowSettings 
}: GameMenuProps) {
  return (
    <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3">
      <button 
        className="font-pixel text-white bg-mario-red px-4 py-2 rounded hover:bg-red-700 transition"
        onClick={onStartGame}
      >
        START GAME
      </button>
      
      <button 
        className="font-pixel text-white bg-block-brown px-4 py-2 rounded hover:bg-yellow-700 transition"
        onClick={onShowInstructions}
      >
        INSTRUCTIONS
      </button>
      
      <button 
        className="font-pixel text-white bg-pipe-green px-4 py-2 rounded hover:bg-green-700 transition"
        onClick={onShowSettings}
      >
        SETTINGS
      </button>
    </div>
  );
}