interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 w-11/12 max-w-lg rounded-lg p-6 border-4 border-block-brown">
        <h2 className="font-pixel text-mario-red text-xl mb-4">HOW TO PLAY</h2>
        
        <div className="font-retro text-white text-lg space-y-3 mb-6">
          <p>Welcome to Pixel Adventure! This is a Mario-like platformer where you can jump, collect coins, and avoid enemies.</p>
          
          <h3 className="font-pixel text-coin-yellow">CONTROLS:</h3>
          <ul className="list-disc pl-5">
            <li>Use <span className="text-sky-blue">Arrow Keys or WASD</span> to move</li>
            <li>Press <span className="text-sky-blue">Space</span> or <span className="text-sky-blue">Up Arrow</span> to jump</li>
            <li>Collect coins to increase your score</li>
            <li>Avoid falling off platforms</li>
          </ul>
          
          <h3 className="font-pixel text-coin-yellow">CHARACTERS:</h3>
          <ul className="list-disc pl-5">
            <li><span className="text-mario-red">Mario</span> - Balanced stats</li>
            <li><span className="text-pipe-green">Luigi</span> - Higher jump</li>
            <li><span className="text-coin-yellow">Toad</span> - Faster speed</li>
          </ul>
        </div>
        
        <div className="flex justify-center">
          <button 
            className="font-pixel text-white bg-pipe-green px-4 py-2 rounded hover:bg-green-700 transition"
            onClick={onClose}
          >
            GOT IT!
          </button>
        </div>
      </div>
    </div>
  );
}
