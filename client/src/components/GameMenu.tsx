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
    <div className="flex space-x-3 no-select">
      <button 
        id="startGame" 
        className="font-pixel text-xs md:text-sm text-white bg-mario-red px-3 py-2 rounded hover:bg-red-700 transition"
        onClick={onStartGame}
      >
        START GAME
      </button>
      <button 
        id="instructions" 
        className="font-pixel text-xs md:text-sm text-white bg-pipe-green px-3 py-2 rounded hover:bg-green-700 transition"
        onClick={onShowInstructions}
      >
        HOW TO PLAY
      </button>
      <button 
        id="settings" 
        className="font-pixel text-xs md:text-sm text-white bg-block-brown px-3 py-2 rounded hover:bg-yellow-700 transition"
        onClick={onShowSettings}
      >
        SETTINGS
      </button>
    </div>
  );
}
