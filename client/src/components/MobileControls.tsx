interface MobileControlsProps {
  onTouchStart: (control: string) => void;
  onTouchEnd: (control: string) => void;
}

export default function MobileControls({ onTouchStart, onTouchEnd }: MobileControlsProps) {
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 flex justify-between">
      {/* Direction pad */}
      <div className="flex flex-col">
        <div className="flex justify-center">
          <button
            className="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-t-lg flex items-center justify-center"
            onTouchStart={() => onTouchStart('up')}
            onTouchEnd={() => onTouchEnd('up')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5L19 12H5L12 5Z" fill="white" />
            </svg>
          </button>
        </div>
        <div className="flex">
          <button
            className="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-l-lg flex items-center justify-center"
            onTouchStart={() => onTouchStart('left')}
            onTouchEnd={() => onTouchEnd('left')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12L12 5V19L5 12Z" fill="white" />
            </svg>
          </button>
          <button
            className="w-16 h-16 bg-gray-800 bg-opacity-70 flex items-center justify-center"
            onTouchStart={() => onTouchStart('down')}
            onTouchEnd={() => onTouchEnd('down')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 19L5 12H19L12 19Z" fill="white" />
            </svg>
          </button>
          <button
            className="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-r-lg flex items-center justify-center"
            onTouchStart={() => onTouchStart('right')}
            onTouchEnd={() => onTouchEnd('right')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12L12 19V5L19 12Z" fill="white" />
            </svg>
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          className="w-16 h-16 bg-mario-red rounded-full flex items-center justify-center"
          onTouchStart={() => onTouchStart('action')}
          onTouchEnd={() => onTouchEnd('action')}
        >
          <span className="text-white font-bold">A</span>
        </button>
        <button
          className="w-16 h-16 bg-pipe-green rounded-full flex items-center justify-center"
          onTouchStart={() => onTouchStart('jump')}
          onTouchEnd={() => onTouchEnd('jump')}
        >
          <span className="text-white font-bold">B</span>
        </button>
      </div>
    </div>
  );
}