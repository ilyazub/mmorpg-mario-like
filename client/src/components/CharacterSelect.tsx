import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Character } from "@shared/schema";

interface CharacterSelectProps {
  onCharacterSelected: (character: Character) => void;
  onStart: () => void;
}

export default function CharacterSelect({ onCharacterSelected, onStart }: CharacterSelectProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  // Sample characters - these would come from the database in the final version
  const characters: Character[] = [
    {
      id: "red-pilot",
      name: "Red Pilot",
      sprite: "red-pilot.png",
      speed: 12,
      jump: 15,
    },
    {
      id: "blue-ninja",
      name: "Blue Ninja",
      sprite: "blue-ninja.png",
      speed: 15,
      jump: 12,
    },
    {
      id: "green-explorer",
      name: "Green Explorer",
      sprite: "green-explorer.png",
      speed: 10,
      jump: 18,
    },
  ];
  
  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    onCharacterSelected(character);
  };
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/90 to-purple-800/90 backdrop-blur-sm z-40">
      <motion.div
        className="bg-gray-900/80 p-8 rounded-xl shadow-2xl max-w-4xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold mb-8 text-center text-white">Choose Your Character</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {characters.map((character) => (
            <motion.div
              key={character.id}
              className={`bg-gray-800 p-6 rounded-lg cursor-pointer transition-colors ${
                selectedCharacter?.id === character.id ? 'ring-2 ring-purple-500 bg-gray-700' : ''
              }`}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleSelectCharacter(character)}
            >
              <div className="w-full h-40 mb-4 bg-gray-700 rounded-md flex items-center justify-center">
                <div className={`w-24 h-24 rounded-full bg-${character.id.split('-')[0]}-500`}></div>
              </div>
              <h3 className="text-xl font-bold text-white">{character.name}</h3>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Speed</span>
                  <div className="w-20 bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${(character.speed / 20) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Jump</span>
                  <div className="w-20 bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(character.jump / 20) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="flex justify-center">
          <Button
            onClick={onStart}
            disabled={!selectedCharacter}
            className="py-6 px-8 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
          >
            Start Game
          </Button>
        </div>
      </motion.div>
    </div>
  );
}