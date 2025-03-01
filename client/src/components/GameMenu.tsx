interface GameMenuProps {
  onStartGame: () => void;
  onShowInstructions: () => void;
}

export default function GameMenu({ 
  onStartGame, 
  onShowInstructions
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
    </div>
  );
}