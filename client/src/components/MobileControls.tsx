import React, { useEffect, useRef, useState } from 'react';
import { Joystick } from 'react-joystick-component';
import Hammer from 'hammerjs';

interface MobileControlsProps {
  onTouchStart: (control: string) => void;
  onTouchEnd: (control: string) => void;
  onJoystickMove?: (x: number, y: number) => void;
  onCameraMove?: (deltaX: number, deltaY: number) => void;
  onAttackGesture?: () => void;
}

export default function MobileControls({ 
  onTouchStart, 
  onTouchEnd, 
  onJoystickMove,
  onCameraMove,
  onAttackGesture
}: MobileControlsProps) {
  // Track active joystick state
  const [joystickActive, setJoystickActive] = useState(false);
  
  // Refs for gesture areas
  const leftAreaRef = useRef<HTMLDivElement>(null);
  const rightAreaRef = useRef<HTMLDivElement>(null);
  const gestureAreaRef = useRef<HTMLDivElement>(null);
  
  // Set up gesture recognition
  useEffect(() => {
    // Camera control area (right side)
    if (rightAreaRef.current) {
      const hammerRight = new Hammer(rightAreaRef.current);
      hammerRight.get('pan').set({ direction: Hammer.DIRECTION_ALL });
      
      hammerRight.on('panmove', (ev) => {
        if (onCameraMove) {
          // Adjust sensitivity as needed
          const sensitivity = 0.05;
          onCameraMove(ev.deltaX * sensitivity, ev.deltaY * sensitivity);
        }
      });
    }
    
    // Attack gesture recognition (swipe forward)
    if (gestureAreaRef.current) {
      const hammerGesture = new Hammer(gestureAreaRef.current);
      hammerGesture.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
      
      hammerGesture.on('swipe', (ev) => {
        // Detect forward swipe (away from the player, in y-direction)
        if (ev.direction === Hammer.DIRECTION_DOWN && Math.abs(ev.velocityY) > 1.0) {
          if (onAttackGesture) {
            onAttackGesture();
          }
        }
      });
    }
    
    // Cleanup
    return () => {
      if (rightAreaRef.current) {
        const hammerRight = new Hammer(rightAreaRef.current);
        hammerRight.destroy();
      }
      
      if (gestureAreaRef.current) {
        const hammerGesture = new Hammer(gestureAreaRef.current);
        hammerGesture.destroy();
      }
    };
  }, [onCameraMove, onAttackGesture]);
  
  const handleJoystickMove = (event: any) => {
    if (onJoystickMove && event.x !== undefined && event.y !== undefined) {
      // Convert joystick values (range -100 to 100) to movement directions
      onJoystickMove(event.x / 100, -event.y / 100); // Y is inverted
    }
  };
  
  const handleJoystickStart = () => {
    setJoystickActive(true);
  };
  
  const handleJoystickStop = () => {
    setJoystickActive(false);
    if (onJoystickMove) {
      onJoystickMove(0, 0); // Reset movement when joystick is released
    }
  };
  
  return (
    <div className="md:hidden fixed inset-0 pointer-events-none">
      {/* Left side - Movement joystick */}
      <div 
        ref={leftAreaRef} 
        className="absolute bottom-8 left-8 pointer-events-auto"
      >
        <Joystick 
          size={120} 
          baseColor="rgba(45, 45, 45, 0.7)" 
          stickColor="rgba(200, 200, 200, 0.8)" 
          move={handleJoystickMove}
          start={handleJoystickStart}
          stop={handleJoystickStop}
        />
      </div>
      
      {/* Right side - Camera control area */}
      <div 
        ref={rightAreaRef}
        className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-auto"
        style={{ touchAction: 'none' }} // Prevents browser handling of touch events
      />
      
      {/* Center bottom - Gesture area for attacks */}
      <div
        ref={gestureAreaRef}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-48 h-48 pointer-events-auto"
        style={{ touchAction: 'none' }}
      >
        {/* Visual indicator for swipe area */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gray-800 bg-opacity-40 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 15H20L12 4Z" fill="rgba(255,255,255,0.7)" />
              <text x="12" y="22" textAnchor="middle" fill="white" fontSize="10">Swipe to attack</text>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-4 pointer-events-auto">
        <button
          className="w-16 h-16 rounded-full bg-blue-500 bg-opacity-70 flex items-center justify-center shadow-lg"
          onTouchStart={() => onTouchStart('jump')}
          onTouchEnd={() => onTouchEnd('jump')}
        >
          <span className="text-white font-bold">JUMP</span>
        </button>
        
        <button
          className="w-16 h-16 rounded-full bg-red-500 bg-opacity-70 flex items-center justify-center shadow-lg"
          onTouchStart={() => onTouchStart('action')}
          onTouchEnd={() => onTouchEnd('action')}
        >
          <span className="text-white font-bold">ACT</span>
        </button>
      </div>
    </div>
  );
}