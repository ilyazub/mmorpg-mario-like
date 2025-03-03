import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from '../game/Experience';
import { KeyboardControls } from '@react-three/drei';
import GameInterface from './GameInterface';
import LoadingScreen from './LoadingScreen';
import CharacterSelect from './CharacterSelect';
import { Character } from '@shared/schema';
import { useToast } from "@/hooks/use-toast";

interface GameProps {
  isFullscreen?: boolean;
}

export default function Game({ isFullscreen = false }: GameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showCharacterSelect, setShowCharacterSelect] = useState(true);
  const [character, setCharacter] = useState<Character | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStats, setGameStats] = useState({
    score: 0,
    lives: 3,
    time: 0,
    world: 'Hub World',
  });
  
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleCharacterSelect = (selectedCharacter: Character) => {
    setCharacter(selectedCharacter);
    toast({
      title: "Character Selected",
      description: `You've chosen ${selectedCharacter.name}!`,
    });
  };
  
  const handleStartGame = () => {
    setShowCharacterSelect(false);
    setIsGameStarted(true);
    toast({
      title: "Game Started",
      description: "Welcome to Hubaoba! Use WASD or arrow keys to move, Space to jump.",
    });
  };
  
  const handleRestartGame = () => {
    setIsGameOver(false);
    setGameStats(prev => ({
      ...prev,
      score: 0,
      lives: 3,
    }));
  };
  
  // Keyboard control map
  const keyboardMap = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "left", keys: ["ArrowLeft", "KeyA"] },
    { name: "right", keys: ["ArrowRight", "KeyD"] },
    { name: "jump", keys: ["Space"] },
    { name: "attack", keys: ["KeyF"] },
  ];
  
  return (
    <div className={`relative ${isFullscreen ? 'h-screen w-screen' : 'h-[600px] w-full rounded-lg overflow-hidden'}`}>
      {/* Game canvas */}
      <Canvas
        shadows
        gl={{ antialias: true }}
        camera={{ position: [0, 5, 10], fov: 75 }}
        ref={canvasRef}
      >
        <KeyboardControls map={keyboardMap}>
          <Experience />
        </KeyboardControls>
      </Canvas>
      
      {/* UI Layers */}
      {isLoading && <LoadingScreen />}
      
      {!isLoading && showCharacterSelect && (
        <CharacterSelect 
          onCharacterSelected={handleCharacterSelect} 
          onStart={handleStartGame}
        />
      )}
      
      {isGameStarted && (
        <GameInterface 
          score={gameStats.score}
          lives={gameStats.lives}
          isGameOver={isGameOver}
          onRestart={handleRestartGame}
        />
      )}
    </div>
  );
}