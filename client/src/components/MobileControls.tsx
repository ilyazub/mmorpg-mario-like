import React, { useEffect, useRef, useState } from 'react';
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
  // Track joystick state
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [joystickActive, setJoystickActive] = useState(false);
  
  // Refs for touch areas
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const rightAreaRef = useRef<HTMLDivElement>(null);
  const attackAreaRef = useRef<HTMLDivElement>(null);
  
  // Joystick configuration
  const joystickSize = 120;
  const knobSize = 50;
  const maxDistance = joystickSize / 2 - knobSize / 2;
  
  // Set up joystick touch handling
  useEffect(() => {
    const joystickElement = joystickRef.current;
    const knobElement = joystickKnobRef.current;
    
    if (!joystickElement || !knobElement) return;
    
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      setJoystickActive(true);
      updateJoystickPosition(e.touches[0]);
    };
    
    const onTouchMove = (e: TouchEvent) => {
      if (joystickActive) {
        e.preventDefault();
        updateJoystickPosition(e.touches[0]);
      }
    };
    
    const onTouchEnd = () => {
      setJoystickActive(false);
      setJoystickPosition({ x: 0, y: 0 });
      
      // Reset joystick visually
      if (knobElement) {
        knobElement.style.transform = `translate(0px, 0px)`;
      }
      
      // Send stop movement to game
      if (onJoystickMove) {
        onJoystickMove(0, 0);
      }
    };
    
    const updateJoystickPosition = (touch: Touch) => {
      const rect = joystickElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate distance from center
      let deltaX = touch.clientX - centerX;
      let deltaY = touch.clientY - centerY;
      
      // Calculate distance from center
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // If distance is greater than max, normalize
      if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
      }
      
      // Update knob position visually
      if (knobElement) {
        knobElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      }
      
      // Calculate joystick values (-1 to 1)
      const joystickX = deltaX / maxDistance;
      const joystickY = deltaY / maxDistance;
      
      setJoystickPosition({ x: joystickX, y: joystickY });
      
      // Send to game
      if (onJoystickMove) {
        onJoystickMove(joystickX, -joystickY); // Y is inverted for game coordinates
      }
    };
    
    joystickElement.addEventListener('touchstart', onTouchStart);
    joystickElement.addEventListener('touchmove', onTouchMove);
    joystickElement.addEventListener('touchend', onTouchEnd);
    joystickElement.addEventListener('touchcancel', onTouchEnd);
    
    return () => {
      joystickElement.removeEventListener('touchstart', onTouchStart);
      joystickElement.removeEventListener('touchmove', onTouchMove);
      joystickElement.removeEventListener('touchend', onTouchEnd);
      joystickElement.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [joystickActive, onJoystickMove, maxDistance]);
  
  // Set up hammer.js for camera and gesture recognition
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
    if (attackAreaRef.current) {
      const hammerGesture = new Hammer(attackAreaRef.current);
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
    
    return () => {
      if (rightAreaRef.current) {
        const hammerRight = new Hammer(rightAreaRef.current);
        hammerRight.destroy();
      }
      
      if (attackAreaRef.current) {
        const hammerGesture = new Hammer(attackAreaRef.current);
        hammerGesture.destroy();
      }
    };
  }, [onCameraMove, onAttackGesture]);
  
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1000 }}>
      {/* Left side - Custom joystick */}
      <div 
        className="absolute bottom-20 left-20 pointer-events-auto"
      >
        {/* Joystick base */}
        <div 
          ref={joystickRef}
          className="relative rounded-full flex items-center justify-center"
          style={{ 
            width: `${joystickSize}px`, 
            height: `${joystickSize}px`, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            touchAction: 'none'
          }}
        >
          {/* Joystick knob */}
          <div 
            ref={joystickKnobRef}
            className="absolute rounded-full"
            style={{ 
              width: `${knobSize}px`, 
              height: `${knobSize}px`, 
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
              touchAction: 'none'
            }}
          />
        </div>
      </div>
      
      {/* Right side - Camera control area */}
      <div 
        ref={rightAreaRef}
        className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-auto"
        style={{ touchAction: 'none' }} // Prevents browser handling of touch events
      />
      
      {/* Center bottom - Attack gesture area */}
      <div
        ref={attackAreaRef}
        className="absolute bottom-24 left-1/2 transform -translate-x-1/2 pointer-events-auto"
        style={{ touchAction: 'none', width: '160px', height: '160px' }}
      >
        {/* Visual indicator for swipe area */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-red-500 bg-opacity-40 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 15H20L12 4Z" fill="white" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 text-center text-white text-xs">
              Swipe Down to Attack
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="absolute bottom-20 right-20 flex flex-col gap-4 pointer-events-auto">
        <button
          className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg"
          style={{ border: '2px solid rgba(255, 255, 255, 0.5)' }}
          onTouchStart={() => onTouchStart('jump')}
          onTouchEnd={() => onTouchEnd('jump')}
        >
          <span className="text-white font-bold">JUMP</span>
        </button>
        
        <button
          className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg"
          style={{ border: '2px solid rgba(255, 255, 255, 0.5)' }}
          onTouchStart={() => onTouchStart('action')}
          onTouchEnd={() => onTouchEnd('action')}
        >
          <span className="text-white font-bold">ACT</span>
        </button>
      </div>
      
      {/* Debug info - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 text-xs">
          <div>Joystick: {joystickActive ? 'Active' : 'Inactive'}</div>
          <div>X: {joystickPosition.x.toFixed(2)}</div>
          <div>Y: {joystickPosition.y.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}