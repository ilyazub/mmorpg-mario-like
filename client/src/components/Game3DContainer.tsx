import { useState } from 'react';
import { useGameEngine3D } from '../hooks/useGameEngine3D';
import Game3DCanvas from './Game3DCanvas';
import CharacterSelector from './CharacterSelector';
import MobileControls from './MobileControls';
import GameMenu from './GameMenu';
import InstructionsModal from './InstructionsModal';
import SettingsModal from './SettingsModal';
import { GameSettings3D } from '../game/engine3d';

export default function Game3DContainer() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    initGame,
    selectCharacter,
    startGame,
    restartGame,
    updateSettings,
    handleTouchStart,
    handleTouchEnd,
    characters,
    selectedCharacter,
    isLoading,
    isGameStarted,
    isGameOver,
    gameStats
  } = useGameEngine3D();
  
  const handleShowInstructions = () => {
    setShowInstructions(true);
  };
  
  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };
  
  const handleShowSettings = () => {
    setShowSettings(true);
  };
  
  const handleCloseSettings = () => {
    setShowSettings(false);
  };
  
  const handleSaveSettings = (settings: GameSettings3D) => {
    updateSettings(settings);
    setShowSettings(false);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 bg-gray-900">
        <h1 className="text-mario-red font-pixel text-xl md:text-2xl">Super Mario 3D MMORPG</h1>
        
        {!isGameStarted ? (
          <GameMenu 
            onStartGame={startGame}
            onShowInstructions={handleShowInstructions}
            onShowSettings={handleShowSettings}
          />
        ) : (
          <div className="space-x-3">
            <button 
              className="font-pixel text-xs md:text-sm text-white bg-block-brown px-3 py-2 rounded hover:bg-yellow-700 transition"
              onClick={handleShowSettings}
            >
              SETTINGS
            </button>
            <button 
              className="font-pixel text-xs md:text-sm text-white bg-mario-red px-3 py-2 rounded hover:bg-red-700 transition"
              onClick={restartGame}
            >
              RESTART
            </button>
          </div>
        )}
      </div>
      
      {!selectedCharacter ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-800">
          <h2 className="text-white font-pixel text-xl md:text-2xl mb-6">Select Your Character</h2>
          <CharacterSelector 
            characters={characters}
            selectedCharacter={selectedCharacter}
            onSelectCharacter={selectCharacter}
          />
        </div>
      ) : (
        <div className="flex-1 relative">
          <Game3DCanvas 
            gameEngine={{ initGame }}
            isLoading={isLoading}
            isGameOver={isGameOver}
            gameStats={gameStats}
            onRestartGame={restartGame}
          />
          
          <MobileControls 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        </div>
      )}
      
      {/* Modals */}
      <InstructionsModal 
        isOpen={showInstructions} 
        onClose={handleCloseInstructions} 
      />
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        initialSettings={{
          musicVolume: 70,
          sfxVolume: 80,
          showFPS: false,
          shadows: true,
          quality: 'medium'
        }}
      />
    </div>
  );
}