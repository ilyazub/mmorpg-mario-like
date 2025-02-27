import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-mario-red max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-mario-red font-pixel text-2xl">
            How to Play
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Learn the controls and mechanics of Super Mario 3D MMORPG
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 text-white">
          <div>
            <h3 className="font-pixel text-pipe-green text-lg mb-2">Basic Controls</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li><span className="font-bold">Desktop:</span> Use WASD or Arrow Keys to move your character and Spacebar to jump</li>
              <li><span className="font-bold">Mobile:</span> Use the on-screen D-pad to move and the 'B' button to jump</li>
              <li>Press the 'A' button or 'E' key to interact with objects and other players</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-pixel text-coin-yellow text-lg mb-2">Game Objectives</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li>Collect coins scattered throughout the world</li>
              <li>Jump on platforms to reach new areas</li>
              <li>Interact with other players in this multiplayer world</li>
              <li>Avoid falling off platforms or you'll lose a life!</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-pixel text-sky-blue text-lg mb-2">Characters</h3>
            <p>Each character has unique abilities:</p>
            <ul className="space-y-2 list-disc pl-5">
              <li><span className="font-bold text-mario-red">Mario:</span> Balanced speed and jump height</li>
              <li><span className="font-bold text-green-500">Luigi:</span> Higher jump but slightly slower</li>
              <li><span className="font-bold text-blue-500">Toad:</span> Faster movement but lower jump</li>
              <li><span className="font-bold text-yellow-500">Princess:</span> Floats briefly during jumps</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-pixel text-mario-red text-lg mb-2">Multiplayer Features</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li>See other players in real-time as they explore the world</li>
              <li>Compete for the highest score</li>
              <li>Collaborate to find hidden areas</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            onClick={onClose}
            className="bg-mario-red hover:bg-red-700 font-pixel"
          >
            GOT IT!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}