interface MobileControlsProps {
  onTouchStart: (control: string) => void;
  onTouchEnd: (control: string) => void;
}

export default function MobileControls({ onTouchStart, onTouchEnd }: MobileControlsProps) {
  return (
    <div className="md:hidden w-full mb-4 no-select">
      <div className="flex justify-between">
        {/* D-Pad */}
        <div className="d-pad grid grid-cols-3 gap-1">
          <div></div>
          <button 
            id="btnUp" 
            className="bg-gray-800 rounded-t-lg p-4 text-gray-400 flex items-center justify-center"
            onTouchStart={() => onTouchStart('up')}
            onTouchEnd={() => onTouchEnd('up')}
          >
            ▲
          </button>
          <div></div>
          <button 
            id="btnLeft" 
            className="bg-gray-800 rounded-l-lg p-4 text-gray-400 flex items-center justify-center"
            onTouchStart={() => onTouchStart('left')}
            onTouchEnd={() => onTouchEnd('left')}
          >
            ◀
          </button>
          <div className="bg-gray-700 p-4"></div>
          <button 
            id="btnRight" 
            className="bg-gray-800 rounded-r-lg p-4 text-gray-400 flex items-center justify-center"
            onTouchStart={() => onTouchStart('right')}
            onTouchEnd={() => onTouchEnd('right')}
          >
            ▶
          </button>
          <div></div>
          <button 
            id="btnDown" 
            className="bg-gray-800 rounded-b-lg p-4 text-gray-400 flex items-center justify-center"
            onTouchStart={() => onTouchStart('down')}
            onTouchEnd={() => onTouchEnd('down')}
          >
            ▼
          </button>
          <div></div>
        </div>
        
        {/* Action Buttons */}
        <div className="action-buttons grid grid-cols-2 gap-2">
          <button 
            id="btnJump" 
            className="bg-mario-red w-16 h-16 rounded-full text-white font-pixel text-sm"
            onTouchStart={() => onTouchStart('jump')}
            onTouchEnd={() => onTouchEnd('jump')}
          >
            JUMP
          </button>
          <button 
            id="btnAction" 
            className="bg-pipe-green w-16 h-16 rounded-full text-white font-pixel text-sm"
            onTouchStart={() => onTouchStart('action')}
            onTouchEnd={() => onTouchEnd('action')}
          >
            ACTION
          </button>
        </div>
      </div>
    </div>
  );
}
