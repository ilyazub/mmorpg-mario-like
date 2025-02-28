import React from 'react';

interface MobileControlsProps {
  onTouchStart: (control: string) => void;
  onTouchEnd: (control: string) => void;
}

export default function MobileControls({ onTouchStart, onTouchEnd }: MobileControlsProps) {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-between px-4">
      {/* D-pad */}
      <div className="grid grid-cols-3 grid-rows-3 gap-1">
        <div className="col-start-2">
          <button
            className="w-16 h-16 bg-gray-800 rounded-md flex items-center justify-center"
            onTouchStart={() => onTouchStart('up')}
            onTouchEnd={() => onTouchEnd('up')}
          >
            <span className="text-white font-bold">W</span>
          </button>
        </div>
        <div className="col-start-1 row-start-2">
          <button
            className="w-16 h-16 bg-gray-800 rounded-md flex items-center justify-center"
            onTouchStart={() => onTouchStart('left')}
            onTouchEnd={() => onTouchEnd('left')}
          >
            <span className="text-white font-bold">A</span>
          </button>
        </div>
        <div className="col-start-2 row-start-2">
          <button
            className="w-16 h-16 bg-gray-800 rounded-md flex items-center justify-center"
            onTouchStart={() => onTouchStart('down')}
            onTouchEnd={() => onTouchEnd('down')}
          >
            <span className="text-white font-bold">S</span>
          </button>
        </div>
        <div className="col-start-3 row-start-2">
          <button
            className="w-16 h-16 bg-gray-800 rounded-md flex items-center justify-center"
            onTouchStart={() => onTouchStart('right')}
            onTouchEnd={() => onTouchEnd('right')}
          >
            <span className="text-white font-bold">D</span>
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center"
          onTouchStart={() => onTouchStart('jump')}
          onTouchEnd={() => onTouchEnd('jump')}
        >
          <span className="text-white font-bold text-sm">JUMP</span>
        </button>
        <button
          className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center"
          onTouchStart={() => onTouchStart('action')}
          onTouchEnd={() => onTouchEnd('action')}
        >
          <span className="text-white font-bold text-sm">ACT</span>
        </button>
      </div>
    </div>
  );
}