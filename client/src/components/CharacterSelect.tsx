import { useState } from 'react';
import { Box, Flex, Heading, Button, Text, Card, Container } from '@radix-ui/themes';

interface Character {
  id: string;
  name: string;
  color: string;
  speed: number;
  jumpHeight: number;
}

const characters: Character[] = [
  { id: 'blue', name: 'Azura', color: '#4169E1', speed: 1.2, jumpHeight: 1.0 },
  { id: 'red', name: 'Flamex', color: '#FF4500', speed: 1.0, jumpHeight: 1.2 },
  { id: 'green', name: 'Terra', color: '#32CD32', speed: 1.1, jumpHeight: 1.1 }
];

interface CharacterSelectProps {
  onCharacterSelected: (characterId: string) => void;
  onStart: () => void;
}

export default function CharacterSelect({ onCharacterSelected, onStart }: CharacterSelectProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  
  const handleSelectCharacter = (characterId: string) => {
    setSelectedCharacter(characterId);
    onCharacterSelected(characterId);
  };
  
  return (
    <Container size="3" className="h-full">
      <Flex direction="column" gap="6" align="center" justify="center" className="h-full">
        <Heading size="8" className="text-center" style={{ textShadow: '0 0 10px rgba(50, 150, 255, 0.8)' }}>
          HUBAOBA
        </Heading>
        <Text size="5" className="text-center">Select your character</Text>
        
        <Flex gap="4" wrap="wrap" justify="center">
          {characters.map((character) => (
            <Card 
              key={character.id}
              className={`cursor-pointer transition-transform hover:scale-105 ${selectedCharacter === character.id ? 'ring-4 ring-blue-500' : ''}`}
              onClick={() => handleSelectCharacter(character.id)}
            >
              <Flex direction="column" gap="3" align="center" p="4">
                <Box 
                  className="w-16 h-16 rounded-md"
                  style={{ backgroundColor: character.color }}
                />
                <Heading size="4">{character.name}</Heading>
                <Flex gap="4">
                  <Flex direction="column" align="center">
                    <Text weight="bold">Speed</Text>
                    <Text>{character.speed.toFixed(1)}</Text>
                  </Flex>
                  <Flex direction="column" align="center">
                    <Text weight="bold">Jump</Text>
                    <Text>{character.jumpHeight.toFixed(1)}</Text>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
        
        <Flex gap="4" mt="6">
          <Button 
            size="3" 
            disabled={!selectedCharacter}
            onClick={onStart}
          >
            Start Game
          </Button>
          
          <Button size="3" variant="soft">
            Instructions
          </Button>
        </Flex>
      </Flex>
    </Container>
  );
}