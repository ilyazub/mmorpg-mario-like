import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
import { Experience } from '../game/Experience';
import { KeyboardControls } from '@react-three/drei';
import { Theme } from '@radix-ui/themes';
import GameInterface from './GameInterface';
import LoadingScreen from './LoadingScreen';
import CharacterSelect from './CharacterSelect';

interface GameProps {
  isFullscreen?: boolean;
}

export default function Game({ isFullscreen = false }: GameProps) {
  const [gameState, setGameState] = useState<'character-select' | 'playing' | 'game-over'>('character-select');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [character, setCharacter] = useState<string | null>(null);
  
  const handleStartGame = () => {
    if (!character) return;
    setGameState('playing');
  };
  
  const handleCharacterSelect = (characterId: string) => {
    setCharacter(characterId);
  };
  
  const handleGameOver = () => {
    setGameState('game-over');
  };
  
  const handleRestartGame = () => {
    setScore(0);
    setLives(3);
    setGameState('character-select');
  };
  
  return (
    <Theme appearance="dark" accentColor="blue">
      <div className={`relative ${isFullscreen ? 'w-screen h-screen' : 'w-full h-[600px]'}`}>
        {gameState === 'character-select' ? (
          <CharacterSelect onCharacterSelected={handleCharacterSelect} onStart={handleStartGame} />
        ) : (
          <>
            <Suspense fallback={<LoadingScreen />}>
              <KeyboardControls>
                <Canvas
                  className="w-full h-full"
                  gl={{ antialias: true, alpha: false }}
                  shadows
                  dpr={[1, 1.5]}
                  camera={{ position: [0, 5, 10], fov: 75, near: 0.1, far: 1000 }}
                >
                  <Experience />
                </Canvas>
              </KeyboardControls>
            </Suspense>
            
            <GameInterface 
              score={score}
              lives={lives}
              isGameOver={gameState === 'game-over'}
              onRestart={handleRestartGame}
            />
          </>
        )}
      </div>
    </Theme>
  );
}