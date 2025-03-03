import { Flex, Heading, Text } from '@radix-ui/themes';
import { useState, useEffect } from 'react';

export default function LoadingScreen() {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Flex 
      direction="column" 
      justify="center" 
      align="center" 
      className="w-full h-full bg-slate-900"
    >
      <div className="animate-spin w-16 h-16 border-4 border-t-blue-500 rounded-full mb-6" />
      <Heading 
        size="6" 
        className="text-white"
        style={{ textShadow: '0 0 10px rgba(50, 150, 255, 0.5)' }}
      >
        HUBAOBA
      </Heading>
      <Text size="4" className="text-blue-400 mt-2">
        Loading{dots}
      </Text>
    </Flex>
  );
}