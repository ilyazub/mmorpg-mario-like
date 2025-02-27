import { useState } from 'react';
import CharacterSelector from './CharacterSelector';
import GameCanvas from './GameCanvas';
import DesktopControls from './DesktopControls';
import MobileControls from './MobileControls';
import GameMenu from './GameMenu';
import InstructionsModal from './InstructionsModal';
import SettingsModal from './SettingsModal';
import { useGameEngine } from '@/hooks/useGameEngine';
import '../assets/fonts.css';

export default function GameContainer() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const gameEngine = useGameEngine();
  
  const handleStartGame = () => {
    gameEngine.startGame();
  };
  
  const handleShowInstructions = () => {
    setShowInstructions(true);
  };
  
  const handleShowSettings = () => {
    setShowSettings(true);
  };
  
  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };
  
  const handleSaveSettings = (settings: any) => {
    gameEngine.updateSettings(settings);
    setShowSettings(false);
  };
  
  const handleRestartGame = () => {
    gameEngine.restartGame();
  };
  
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 bg-[#121212]">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Game Title */}
        <h1 className="font-pixel text-mario-red text-xl md:text-3xl mb-6 text-center drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]">
          PIXEL ADVENTURE
        </h1>
        
        {/* Character Selection */}
        <CharacterSelector 
          characters={gameEngine.characters}
          selectedCharacter={gameEngine.selectedCharacter}
          onSelectCharacter={gameEngine.selectCharacter}
        />
        
        {/* Game Canvas */}
        <GameCanvas 
          gameEngine={gameEngine} 
          isLoading={gameEngine.isLoading}
          isGameOver={gameEngine.isGameOver}
          gameStats={gameEngine.gameStats}
          onRestartGame={handleRestartGame}
        />
        
        {/* Game Controls - Desktop shown on larger screens */}
        <DesktopControls />
        
        {/* Mobile Touch Controls - only shown on smaller screens */}
        <MobileControls
          onTouchStart={gameEngine.handleTouchStart}
          onTouchEnd={gameEngine.handleTouchEnd}
        />
        
        {/* Game Menu Buttons */}
        <GameMenu 
          onStartGame={handleStartGame}
          onShowInstructions={handleShowInstructions}
          onShowSettings={handleShowSettings}
        />
      </div>
      
      {/* Modals */}
      <InstructionsModal 
        isOpen={showInstructions} 
        onClose={handleCloseInstructions} 
      />
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        initialSettings={gameEngine.gameRef?.current?.settings}
      />
    </div>
  );
}
