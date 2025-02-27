import { Character } from '@/game/engine';

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
  return (
    <div className="w-full flex justify-center mb-4 overflow-x-auto py-2 no-select">
      <div className="flex space-x-4 px-2">
        {characters.map((character) => (
          <div 
            key={character.id}
            className={`character-card ${selectedCharacter?.id === character.id ? 'selected' : ''} bg-block-brown rounded p-3 cursor-pointer flex flex-col items-center`}
            onClick={() => onSelectCharacter(character)}
          >
            <div className="w-16 h-16 bg-sky-blue flex items-center justify-center">
              <img 
                src={character.sprite} 
                alt={`${character.name} character sprite`} 
                className="w-12 h-12 object-contain"
              />
            </div>
            <span className="font-pixel text-white text-xs mt-2">{character.name}</span>
            <div className="font-retro text-coin-yellow text-sm">
              Speed: {Array(character.speed).fill('★').join('')}
            </div>
            <div className="font-retro text-coin-yellow text-sm">
              Jump: {Array(character.jump).fill('★').join('')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
