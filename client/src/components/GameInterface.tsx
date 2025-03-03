import { Flex, Text, Box, Button, Heading } from '@radix-ui/themes';
import { HeartIcon, CrownIcon } from 'lucide-react';

interface GameInterfaceProps {
  score: number;
  lives: number;
  isGameOver: boolean;
  onRestart: () => void;
}

export default function GameInterface({ score, lives, isGameOver, onRestart }: GameInterfaceProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* HUD - Top Bar */}
      <Flex justify="between" p="3" className="bg-black/50 backdrop-blur-sm">
        <Flex align="center" gap="2">
          <Text size="5" weight="bold" className="font-pixel text-white">
            {score}
          </Text>
          <CrownIcon className="text-yellow-400" />
        </Flex>
        
        <Flex align="center" gap="2">
          {Array.from({ length: lives }).map((_, i) => (
            <HeartIcon key={i} className="text-red-500" />
          ))}
        </Flex>
      </Flex>
      
      {/* Mobile Controls (Only visible on touch devices) */}
      <Box className="absolute bottom-0 left-0 right-0 touch-manipulation md:hidden">
        <Flex justify="between" p="4">
          {/* D-Pad */}
          <Flex direction="column" align="center" gap="1">
            <Button variant="solid" className="w-12 h-12 rounded-t-md pointer-events-auto">↑</Button>
            <Flex>
              <Button variant="solid" className="w-12 h-12 rounded-l-md pointer-events-auto">←</Button>
              <Button variant="solid" className="w-12 h-12 rounded-r-md pointer-events-auto">→</Button>
            </Flex>
            <Button variant="solid" className="w-12 h-12 rounded-b-md pointer-events-auto">↓</Button>
          </Flex>
          
          {/* Action Buttons */}
          <Flex gap="2">
            <Button variant="solid" className="w-16 h-16 rounded-full pointer-events-auto">JUMP</Button>
            <Button variant="solid" className="w-16 h-16 rounded-full pointer-events-auto">ACTION</Button>
          </Flex>
        </Flex>
      </Box>
      
      {/* Game Over Screen */}
      {isGameOver && (
        <Box className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto">
          <Flex direction="column" align="center" gap="6" p="6" className="bg-slate-900 rounded-lg">
            <Heading size="8" className="text-red-500">GAME OVER</Heading>
            <Text size="5">Final Score: {score}</Text>
            <Button size="3" onClick={onRestart}>
              Play Again
            </Button>
          </Flex>
        </Box>
      )}
    </div>
  );
}