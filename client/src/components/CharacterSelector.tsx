import { Character } from '../../shared/schema';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface CharacterSelectorProps {
  characters: Character[];
  selectedCharacter: Character | null;
  onSelectCharacter: (character: Character) => void;
}

export default function CharacterSelector({ 
  characters, 
  selectedCharacter, 
  onSelectCharacter 
}: CharacterSelectorProps) {
  if (!characters || characters.length === 0) {
    return (
      <div className="text-center text-white font-pixel">
        <p>No characters available. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
      {characters.map((character) => (
        <Card 
          key={character.id} 
          className={`p-4 flex flex-col items-center cursor-pointer transition-all ${
            selectedCharacter?.id === character.id
              ? 'border-4 border-mario-red transform scale-105'
              : 'border border-gray-700 hover:border-gray-500'
          }`}
          onClick={() => onSelectCharacter(character)}
        >
          <div className="w-32 h-32 mb-4 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
            {character.sprite ? (
              <img 
                src={character.sprite} 
                alt={character.name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div 
                className="w-24 h-24 rounded-full" 
                style={{ 
                  backgroundColor: 
                    character.name === 'Mario' ? '#ff0000' : 
                    character.name === 'Luigi' ? '#00ff00' : 
                    character.name === 'Toad' ? '#0000ff' : '#ffff00'
                }}
              />
            )}
          </div>
          
          <h3 className="font-pixel text-lg text-white mb-2">{character.name}</h3>
          
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-300 mb-4 w-full">
            <div className="flex items-center">
              <span className="font-medium mr-1">Speed:</span>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(character.speed / 10) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="font-medium mr-1">Jump:</span>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(character.jump / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          <Button 
            variant={selectedCharacter?.id === character.id ? "default" : "outline"}
            className="w-full font-pixel"
          >
            {selectedCharacter?.id === character.id ? 'SELECTED' : 'SELECT'}
          </Button>
        </Card>
      ))}
    </div>
  );
}