import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, useKeyboardControls, Stars, Sky, Float, KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useControls } from 'leva';
import { create } from 'zustand';

interface PlayerProps {
  position: [number, number, number];
  color: string;
  playerId: string;
  isCurrentPlayer?: boolean;
}

const Player = ({ position, color, playerId, isCurrentPlayer = false }: PlayerProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [moveDirection, setMoveDirection] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [jumpVelocity, setJumpVelocity] = useState<number>(0);
  const [isGrounded, setIsGrounded] = useState<boolean>(true);
  const [jumping, setJumping] = useState<boolean>(false);
  
  // Character physics constants
  const GRAVITY = 0.008;
  const JUMP_FORCE = 0.5;
  const MOVE_SPEED = 0.15;
  const CHARACTER_SIZE = 1;
  
  // Keyboard controls for current player
  const [subscribeKeys, getKeys] = useKeyboardControls();
  
  useEffect(() => {
    if (!isCurrentPlayer) return;
    
    const unsubscribeJump = subscribeKeys(
      (state) => state.jump,
      (pressed) => {
        if (pressed && isGrounded) {
          setJumpVelocity(JUMP_FORCE);
          setJumping(true);
          setIsGrounded(false);
        }
      }
    );
    
    return () => {
      unsubscribeJump();
    };
  }, [isCurrentPlayer, isGrounded, subscribeKeys]);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    if (isCurrentPlayer) {
      // Handle movement for current player
      const keys = getKeys();
      
      const direction = new THREE.Vector3(0, 0, 0);
      
      if (keys.forward) direction.z -= 1;
      if (keys.backward) direction.z += 1;
      if (keys.left) direction.x -= 1;
      if (keys.right) direction.x += 1;
      
      // Normalize direction vector for consistent speed in any direction
      if (direction.length() > 0) {
        direction.normalize();
        direction.multiplyScalar(MOVE_SPEED);
      }
      
      // Apply gravity and jumping physics
      let newJumpVelocity = jumpVelocity;
      newJumpVelocity -= GRAVITY;
      
      // Update position
      meshRef.current.position.x += direction.x;
      meshRef.current.position.z += direction.z;
      meshRef.current.position.y += newJumpVelocity;
      
      // Floor collision detection
      if (meshRef.current.position.y < CHARACTER_SIZE / 2) {
        meshRef.current.position.y = CHARACTER_SIZE / 2;
        if (newJumpVelocity < 0) {
          newJumpVelocity = 0;
          setIsGrounded(true);
          setJumping(false);
        }
      }
      
      // Update jump velocity state
      setJumpVelocity(newJumpVelocity);
      
      // Update camera to follow player
      const camera = state.camera;
      const playerPosition = meshRef.current.position.clone();
      camera.position.lerp(
        new THREE.Vector3(
          playerPosition.x,
          playerPosition.y + 5,
          playerPosition.z + 10
        ),
        0.1
      );
      camera.lookAt(playerPosition);
    }
  });
  
  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[CHARACTER_SIZE, CHARACTER_SIZE, CHARACTER_SIZE]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, CHARACTER_SIZE + 0.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {playerId}
      </Text>
    </group>
  );
};

const Platform = ({ position, size, color }: { position: [number, number, number], size: [number, number, number], color: string }) => {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const Coin = ({ position }: { position: [number, number, number] }) => {
  const coinRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (coinRef.current) {
      coinRef.current.rotation.y += 0.02;
    }
  });
  
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={coinRef} position={position}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
          <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </Float>
  );
};

export function Experience() {
  // Debug controls
  const { skyColor } = useControls({
    skyColor: '#1b7ced'
  });
  
  // Define players
  const [players, setPlayers] = useState([
    { id: 'player1', position: [0, 1, 0], color: '#ff4400', isCurrentPlayer: true },
    { id: 'player2', position: [5, 1, 3], color: '#00ff44', isCurrentPlayer: false },
  ]);
  
  // Define platforms
  const platforms = [
    { position: [0, -0.5, 0] as [number, number, number], size: [20, 1, 20] as [number, number, number], color: '#888888' }, // Main platform
    { position: [-5, 1, -5] as [number, number, number], size: [3, 0.5, 3] as [number, number, number], color: '#aaaaaa' }, // Elevated platform 1
    { position: [5, 2, 5] as [number, number, number], size: [3, 0.5, 3] as [number, number, number], color: '#aaaaaa' }, // Elevated platform 2
    { position: [0, 3, -10] as [number, number, number], size: [3, 0.5, 3] as [number, number, number], color: '#aaaaaa' }, // Elevated platform 3
    { position: [10, 4, 0] as [number, number, number], size: [3, 0.5, 3] as [number, number, number], color: '#aaaaaa' }, // Elevated platform 4
  ];
  
  // Define coins
  const coins = [
    { position: [-5, 2, -5] as [number, number, number] },
    { position: [5, 3, 5] as [number, number, number] },
    { position: [0, 4, -10] as [number, number, number] },
    { position: [10, 5, 0] as [number, number, number] },
  ];

  // Define keyboard controls map
  const keyboardMap = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "left", keys: ["ArrowLeft", "KeyA"] },
    { name: "right", keys: ["ArrowRight", "KeyD"] },
    { name: "jump", keys: ["Space"] },
    { name: "attack", keys: ["KeyF"] },
  ];

  return (
    <KeyboardControls map={keyboardMap}>
      {/* Environment setup */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Sky and stars */}
      <Sky sunPosition={[100, 10, 100]} turbidity={0.3} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Game elements */}
      {players.map((player) => (
        <Player
          key={player.id}
          playerId={player.id}
          position={player.position as [number, number, number]}
          color={player.color}
          isCurrentPlayer={player.isCurrentPlayer}
        />
      ))}
      
      {platforms.map((platform, index) => (
        <Platform
          key={`platform-${index}`}
          position={platform.position}
          size={platform.size}
          color={platform.color}
        />
      ))}
      
      {coins.map((coin, index) => (
        <Coin
          key={`coin-${index}`}
          position={coin.position}
        />
      ))}
      
      {/* Controls for debugging */}
      <OrbitControls enabled={false} />
    </KeyboardControls>
  );
}