import { useState, useEffect } from 'react';
import { GameSettings } from '@/game/engine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: GameSettings) => void;
  initialSettings?: GameSettings;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialSettings
}: SettingsModalProps) {
  const [settings, setSettings] = useState<GameSettings>({
    musicVolume: 70,
    sfxVolume: 80,
    pixelPerfect: true,
    showFPS: false
  });
  
  // Update settings when props change
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value, 10)
    }));
  };
  
  const handleSave = () => {
    onSave(settings);
  };
  
  const handleReset = () => {
    setSettings({
      musicVolume: 70,
      sfxVolume: 80,
      pixelPerfect: true,
      showFPS: false
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 w-11/12 max-w-lg rounded-lg p-6 border-4 border-block-brown">
        <h2 className="font-pixel text-mario-red text-xl mb-4">SETTINGS</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="font-pixel text-white text-sm block mb-2">MUSIC VOLUME</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              name="musicVolume"
              value={settings.musicVolume} 
              onChange={handleChange}
              className="w-full" 
            />
          </div>
          
          <div>
            <label className="font-pixel text-white text-sm block mb-2">SOUND EFFECTS</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              name="sfxVolume"
              value={settings.sfxVolume} 
              onChange={handleChange}
              className="w-full" 
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="pixelPerfect" 
              name="pixelPerfect"
              checked={settings.pixelPerfect} 
              onChange={handleChange}
            />
            <label htmlFor="pixelPerfect" className="font-retro text-white text-lg">
              Pixel Perfect Rendering
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="showFPS" 
              name="showFPS"
              checked={settings.showFPS} 
              onChange={handleChange}
            />
            <label htmlFor="showFPS" className="font-retro text-white text-lg">
              Show FPS Counter
            </label>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button 
            className="font-pixel text-white bg-mario-red px-4 py-2 rounded hover:bg-red-700 transition" 
            onClick={handleReset}
          >
            RESET
          </button>
          <button 
            className="font-pixel text-white bg-pipe-green px-4 py-2 rounded hover:bg-green-700 transition" 
            onClick={handleSave}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
