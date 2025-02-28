import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';

// Define interfaces directly in this component
interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  pixelPerfect?: boolean;
  showFPS: boolean;
}

interface GameSettings3D {
  musicVolume: number;
  sfxVolume: number;
  showFPS: boolean;
  shadows: boolean;
  quality: 'low' | 'medium' | 'high';
}

// Create a type that includes both possible settings types
type CombinedSettings = GameSettings & GameSettings3D;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
  initialSettings?: any;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialSettings = {
    musicVolume: 70,
    sfxVolume: 80,
    showFPS: false,
    shadows: true,
    quality: 'medium',
    pixelPerfect: true
  }
}: SettingsModalProps) {
  const [settings, setSettings] = useState<CombinedSettings>({
    ...initialSettings
  });
  
  const handleSave = () => {
    onSave(settings);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 text-white border-mario-red">
        <DialogHeader>
          <DialogTitle className="text-mario-red font-pixel text-2xl">
            Game Settings
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Customize your game experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-pixel text-pipe-green text-lg">Audio</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="music-volume" className="text-gray-300">Music Volume</Label>
                  <span className="text-gray-400">{settings.musicVolume}%</span>
                </div>
                <Slider
                  id="music-volume"
                  min={0}
                  max={100}
                  step={1}
                  value={[settings.musicVolume]}
                  onValueChange={(value) => setSettings({ ...settings, musicVolume: value[0] })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="sfx-volume" className="text-gray-300">Sound Effects Volume</Label>
                  <span className="text-gray-400">{settings.sfxVolume}%</span>
                </div>
                <Slider
                  id="sfx-volume"
                  min={0}
                  max={100}
                  step={1}
                  value={[settings.sfxVolume]}
                  onValueChange={(value) => setSettings({ ...settings, sfxVolume: value[0] })}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-pixel text-coin-yellow text-lg">Graphics</h3>
            
            {settings.quality !== undefined && (
              <div className="flex items-center justify-between">
                <Label htmlFor="quality" className="text-gray-300">Graphics Quality</Label>
                <Select
                  value={settings.quality}
                  onValueChange={(value) => setSettings({ ...settings, quality: value as 'low' | 'medium' | 'high' })}
                >
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {settings.shadows !== undefined && (
              <div className="flex items-center justify-between">
                <Label htmlFor="shadows" className="text-gray-300">Enable Shadows</Label>
                <Switch 
                  id="shadows" 
                  checked={settings.shadows}
                  onCheckedChange={(checked) => setSettings({ ...settings, shadows: checked })}
                />
              </div>
            )}
            
            {settings.pixelPerfect !== undefined && (
              <div className="flex items-center justify-between">
                <Label htmlFor="pixel-perfect" className="text-gray-300">Pixel Perfect Mode</Label>
                <Switch 
                  id="pixel-perfect" 
                  checked={settings.pixelPerfect}
                  onCheckedChange={(checked) => setSettings({ ...settings, pixelPerfect: checked })}
                />
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <h3 className="font-pixel text-sky-blue text-lg">Display</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-fps" className="text-gray-300">Show FPS Counter</Label>
              <Switch 
                id="show-fps" 
                checked={settings.showFPS}
                onCheckedChange={(checked) => setSettings({ ...settings, showFPS: checked })}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex space-x-2 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-gray-800 hover:bg-gray-700 font-pixel text-white"
          >
            CANCEL
          </Button>
          <Button
            onClick={handleSave}
            className="bg-mario-red hover:bg-red-700 font-pixel"
          >
            SAVE SETTINGS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}