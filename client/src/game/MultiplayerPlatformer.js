import * as THREE from 'three';
import { io } from 'socket.io-client';

export default class MultiplayerPlatformer {
  constructor(container) {
    // Game state
    this.isRunning = false;
    this.score = 0;
    this.lives = 3;
    this.players = new Map(); // Store other players
    this.obstacles = []; // Store obstacles
    this.crushableObstacles = []; // Store crushable obstacles
    this.coins = []; // Store collectible coins
    
    // Socket.io connection
    this.socket = io();
    this.setupSocketEvents();
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);
    
    // Setup scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    this.scene.fog = new THREE.Fog(0x87CEEB, 30, 100); // Add fog for distant objects
    
    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
    
    // Player-related properties
    this.playerSpeed = 0.15;
    this.jumpForce = 0.2;
    this.gravity = 0.01;
    this.isJumping = false;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.playerMesh = null;
    this.characterData = null;
    this.isAttacking = false;
    this.attackCooldown = 0;
    
    // Procedural world generation parameters
    this.worldSections = [];
    this.currentSection = 0;
    this.sectionSize = 40; // Size of each world section
    this.worldLength = 300; // How far ahead to generate
    this.generatedZ = 0; // How far we've generated so far
    this.respawnDistance = -50; // Distance behind player to respawn objects
    this.distanceTraveled = 0; // Total distance traveled
    this.npcRespawnPool = []; // Pool of NPCs to be respawned
    this.coinRespawnPool = []; // Pool of coins to be respawned
    this.platforms = [];      // All platforms in the world
    this.groundSegments = []; // Ground segments
    this.decorations = [];    // Decorative elements
    
    // World themes and properties
    this.worldThemes = ['grassland', 'desert', 'snow', 'lava']; // Different world themes
    this.currentTheme = 'grassland';
    this.nextThemeChange = 500; // Distance until next theme change
    
    // Define theme properties
    this.themeProperties = {
      grassland: {
        skyColor: 0x87CEEB,
        fogColor: 0x87CEEB,
        fogNear: 30,
        fogFar: 100,
        groundColor: 0x32CD32, // Lime green
        platformColors: [0x8B4513, 0xA52A2A, 0xCD853F], // Brown variations
        decorationColors: [0x228B22, 0x006400, 0x008000], // Green variations
        enemyTypes: ['Goomba', 'Koopa', 'Paratroopa']
      },
      desert: {
        skyColor: 0xFFD700,
        fogColor: 0xFFE4B5,
        fogNear: 25,
        fogFar: 80,
        groundColor: 0xDEB887, // Burlywood
        platformColors: [0xD2B48C, 0xF4A460, 0xDAA520], // Tan/sand variations
        decorationColors: [0xCD853F, 0xB8860B, 0x8B4513], // Desert plant colors
        enemyTypes: ['Spiny', 'Goomba', 'Boo']
      },
      snow: {
        skyColor: 0xE0FFFF,
        fogColor: 0xE0FFFF,
        fogNear: 20,
        fogFar: 70,
        groundColor: 0xFFFAFA, // Snow white
        platformColors: [0xB0C4DE, 0xADD8E6, 0x87CEEB], // Light blue variations
        decorationColors: [0xFFFFFF, 0xF0F8FF, 0xE6E6FA], // White/light variations
        enemyTypes: ['Koopa', 'Boo', 'Spiny']
      },
      lava: {
        skyColor: 0x800000,
        fogColor: 0xFF4500,
        fogNear: 15,
        fogFar: 60,
        groundColor: 0x8B0000, // Dark red
        platformColors: [0xA52A2A, 0x800000, 0x8B0000], // Red/brown variations
        decorationColors: [0xFF4500, 0xFF6347, 0xFF7F50], // Orange/fire variations
        enemyTypes: ['Spiny', 'Boo', 'Paratroopa']
      }
    }
    
    // Controls state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      attack: false
    };
    
    // Setup event listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Initialize game elements
    this.initLights();
    this.initWorld(); // This will now set up our procedural world
    
    // Start animation loop
    this.lastUpdateTime = Date.now();
    this.animate();
  }
  
  setupSocketEvents() {
    // Handle player join
    this.socket.on('playerJoin', (data) => {
      console.log(`Player joined: ${data.id}`);
      this.addPlayer(data.id, data.character, data.position);
    });
    
    // Handle player movement
    this.socket.on('playerMove', (data) => {
      if (this.players.has(data.id)) {
        const playerMesh = this.players.get(data.id).mesh;
        playerMesh.position.set(data.position.x, data.position.y, data.position.z);
      }
    });
    
    // Handle player disconnect
    this.socket.on('playerLeave', (playerId) => {
      console.log(`Player left: ${playerId}`);
      this.removePlayer(playerId);
    });
    
    // Handle player attacks from other players
    this.socket.on('playerAttack', (data) => {
      console.log('Other player attacking at position:', data.position);
      this.showRemotePlayerAttack(data.position, data.color);
    });
  }
  
  // Method to visualize other players' attacks
  showRemotePlayerAttack(position, color) {
    // Create a ring effect similar to the player's attack
    const attackGeometry = new THREE.RingGeometry(0.2, 0.8, 16);
    const attackMaterial = new THREE.MeshBasicMaterial({ 
      color: color || 0xFFFFFF, 
      transparent: true, 
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const attackMesh = new THREE.Mesh(attackGeometry, attackMaterial);
    attackMesh.position.set(position.x, position.y, position.z);
    attackMesh.rotation.x = Math.PI / 2;
    this.scene.add(attackMesh);
    
    // Add particles
    const particleCount = 15;
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: color || 0xFFFFFF,
      size: 0.08,
      transparent: true,
      opacity: 0.7
    });
    
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = position.x + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(particles);
    
    // Animate the attack
    let scale = 1;
    const animateRemoteAttack = () => {
      if (scale < 2) {
        scale += 0.1;
        attackMesh.scale.set(scale, scale, scale);
        requestAnimationFrame(animateRemoteAttack);
      }
    };
    animateRemoteAttack();
    
    // Remove after a short duration
    setTimeout(() => {
      this.scene.remove(attackMesh);
      this.scene.remove(particles);
    }, 300);
  }
  
  addPlayer(id, character, position) {
    // Create a player mesh for the new player
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const playerColor = character ? this.getCharacterColor(character.name) : 0xff0000;
    const material = new THREE.MeshLambertMaterial({ color: playerColor });
    const playerMesh = new THREE.Mesh(geometry, material);
    
    playerMesh.position.set(position.x, position.y, position.z);
    playerMesh.castShadow = true;
    playerMesh.receiveShadow = true;
    
    // Add player name label
    const nameDiv = document.createElement('div');
    nameDiv.className = 'player-name-label';
    nameDiv.textContent = character ? character.name : 'Player';
    nameDiv.style.position = 'absolute';
    nameDiv.style.color = 'white';
    nameDiv.style.background = 'rgba(0, 0, 0, 0.5)';
    nameDiv.style.padding = '2px 5px';
    nameDiv.style.borderRadius = '3px';
    nameDiv.style.fontSize = '12px';
    nameDiv.style.fontFamily = 'Arial, sans-serif';
    nameDiv.style.pointerEvents = 'none';
    document.body.appendChild(nameDiv);
    
    this.scene.add(playerMesh);
    
    // Store the player
    this.players.set(id, {
      mesh: playerMesh,
      character: character,
      nameLabel: nameDiv
    });
  }
  
  removePlayer(id) {
    if (this.players.has(id)) {
      const player = this.players.get(id);
      // Remove mesh from scene
      this.scene.remove(player.mesh);
      // Remove name label
      if (player.nameLabel) {
        document.body.removeChild(player.nameLabel);
      }
      // Remove from players map
      this.players.delete(id);
    }
  }
  
  getCharacterColor(characterName) {
    // Generate a consistent color based on character name
    const colors = {
      'Mario': 0xff0000,
      'Luigi': 0x00ff00,
      'Peach': 0xffc0cb,
      'Toad': 0xffffff,
      'Yoshi': 0x00ff00,
      'Bowser': 0xffa500
    };
    
    return colors[characterName] || 0x3333ff; // Default blue if not found
  }
  
  initLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // Directional light with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    
    this.scene.add(directionalLight);
  }
  
  initObstacles() {
    // Create static obstacles
    const obstaclePositions = [
      { x: -8, y: 0.5, z: -2, width: 1, height: 1, depth: 1 },
      { x: 8, y: 0.5, z: -2, width: 1, height: 1, depth: 1 },
      { x: 0, y: 0.5, z: -12, width: 1, height: 1, depth: 1 }
    ];
    
    obstaclePositions.forEach(pos => {
      const geometry = new THREE.BoxGeometry(pos.width, pos.height, pos.depth);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.2
      });
      const obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.set(pos.x, pos.y, pos.z);
      obstacle.castShadow = true;
      obstacle.receiveShadow = true;
      
      this.obstacles.push(obstacle);
      this.scene.add(obstacle);
    });
  }
  
  initCrushableObstacles() {
    // Define different NPC types with their properties
    this.npcTypes = [
      {
        name: 'Goomba',
        geometry: new THREE.BoxGeometry(0.8, 0.6, 0.8),
        material: new THREE.MeshStandardMaterial({ 
          color: 0x8B4513,  // Brown
          roughness: 0.7,
          metalness: 0.2
        }),
        speed: 0.03,
        movementStyle: 'ground',
        jumpHeight: 0,
        strength: 1,
        crushable: true
      },
      {
        name: 'Koopa',
        geometry: new THREE.CylinderGeometry(0.4, 0.6, 1.0, 8),
        material: new THREE.MeshStandardMaterial({ 
          color: 0x00AA00,  // Green
          roughness: 0.7,
          metalness: 0.2
        }),
        speed: 0.02,
        movementStyle: 'ground',
        jumpHeight: 0,
        strength: 1,
        crushable: true
      },
      {
        name: 'Spiny',
        geometry: new THREE.SphereGeometry(0.5, 16, 8),
        material: new THREE.MeshStandardMaterial({ 
          color: 0xDD2222,  // Red
          roughness: 0.6,
          metalness: 0.3
        }),
        speed: 0.04,
        movementStyle: 'ground',
        jumpHeight: 0,
        strength: 2,
        crushable: false // Can't be crushed by jumping
      },
      {
        name: 'Paratroopa',
        geometry: new THREE.ConeGeometry(0.5, 1.0, 8),
        material: new THREE.MeshStandardMaterial({ 
          color: 0x00AAAA,  // Teal
          roughness: 0.7,
          metalness: 0.2
        }),
        speed: 0.04,
        movementStyle: 'flying',
        jumpHeight: 2.0,
        strength: 1,
        crushable: true
      },
      {
        name: 'Boo',
        geometry: new THREE.SphereGeometry(0.6, 16, 8),
        material: new THREE.MeshStandardMaterial({ 
          color: 0xFFFFFF,  // White
          transparent: true, 
          opacity: 0.7,
          roughness: 0.3,
          metalness: 0.1
        }),
        speed: 0.02,
        movementStyle: 'ghost',
        jumpHeight: 1.5,
        strength: 1,
        crushable: false
      }
    ];
    
    // Create NPCs of different types
    const npcCount = 15;
    const positions = [];
    
    // Some pre-defined positions for important areas
    const fixedPositions = [
      { x: 3, y: 0.5, z: -3 },
      { x: -3, y: 0.5, z: -5 },
      { x: 0, y: 0.5, z: -8 },
      { x: 5, y: 3.5, z: -5 },
      { x: -5, y: 3.5, z: -5 }
    ];
    
    // Add fixed positions
    positions.push(...fixedPositions);
    
    // Add random positions for the rest
    for (let i = fixedPositions.length; i < npcCount; i++) {
      positions.push({
        x: (Math.random() - 0.5) * 16,
        y: 0.5, // Will be adjusted based on NPC type
        z: (Math.random() - 0.5) * 16
      });
    }
    
    // Create NPCs at each position
    positions.forEach((pos, index) => {
      // Choose a random NPC type, but ensure variety
      const typeIndex = Math.min(index % this.npcTypes.length, this.npcTypes.length - 1);
      const npcType = this.npcTypes[typeIndex];
      
      // Create the NPC mesh
      const npc = new THREE.Mesh(npcType.geometry, npcType.material.clone());
      
      // Set height based on movement style
      let y = pos.y;
      if (npcType.movementStyle === 'flying') {
        y = 1.5 + Math.random() * 1.5; // Flying enemies are higher
      } else if (npcType.movementStyle === 'ghost') {
        y = 1.0 + Math.random() * 2.0; // Ghosts float at various heights
      }
      
      npc.position.set(pos.x, y, pos.z);
      npc.castShadow = true;
      npc.receiveShadow = true;
      
      // Create eyes for all NPCs
      const eyeGeometry = new THREE.SphereGeometry(0.12, 8, 8);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      
      // Create two eyes
      for (let j = 0; j < 2; j++) {
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        const offset = j === 0 ? -0.2 : 0.2;
        
        // Position depends on the NPC type
        if (npcType.name === 'Goomba') {
          eye.position.set(offset, 0.15, 0.3);
        } else if (npcType.name === 'Koopa' || npcType.name === 'Spiny') {
          eye.position.set(offset, 0.2, 0.3);
        } else {
          eye.position.set(offset, 0, 0.3);
        }
        
        // Add pupil
        const pupil = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          pupilMaterial
        );
        pupil.position.z = 0.08;
        eye.add(pupil);
        
        npc.add(eye);
      }
      
      // Add special features based on type
      if (npcType.name === 'Goomba') {
        // Add feet to Goomba
        const footGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.3);
        const footMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        
        for (let f = 0; f < 2; f++) {
          const foot = new THREE.Mesh(footGeometry, footMaterial);
          foot.position.set(f === 0 ? 0.25 : -0.25, -0.3, 0);
          npc.add(foot);
        }
      } else if (npcType.name === 'Spiny') {
        // Add spikes to the Spiny
        const spikeGeometry = new THREE.ConeGeometry(0.08, 0.25, 4);
        const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
        
        for (let s = 0; s < 8; s++) {
          const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
          const angle = (s / 8) * Math.PI * 2;
          spike.position.set(
            Math.cos(angle) * 0.5,
            Math.sin(angle) * 0.5,
            0
          );
          spike.rotation.z = Math.PI / 2;
          spike.rotation.y = angle;
          npc.add(spike);
        }
      } else if (npcType.name === 'Paratroopa') {
        // Add shell to Koopa/Paratroopa
        const shellGeometry = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const shellMaterial = new THREE.MeshStandardMaterial({ color: 0xFFAA00 });
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        shell.rotation.x = Math.PI;
        shell.position.y = 0.2;
        npc.add(shell);
        
        // Add wings to Paratroopa
        const wingGeometry = new THREE.PlaneGeometry(0.6, 0.4);
        const wingMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xFFFFFF,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        
        for (let w = 0; w < 2; w++) {
          const wing = new THREE.Mesh(wingGeometry, wingMaterial);
          wing.position.set(w === 0 ? -0.4 : 0.4, 0.2, 0);
          wing.rotation.y = w === 0 ? Math.PI / 4 : -Math.PI / 4;
          npc.add(wing);
          
          // Store wing reference for animation
          if (!npc.userData) npc.userData = {};
          if (!npc.userData.wings) npc.userData.wings = [];
          npc.userData.wings.push(wing);
        }
      } else if (npcType.name === 'Boo') {
        // Add "arms" to Boo
        const armGeometry = new THREE.CapsuleGeometry(0.15, 0.3, 4, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xFFFFFF,
          transparent: true,
          opacity: 0.7
        });
        
        for (let a = 0; a < 2; a++) {
          const arm = new THREE.Mesh(armGeometry, armMaterial);
          arm.position.set(a === 0 ? -0.5 : 0.5, -0.2, 0);
          arm.rotation.z = a === 0 ? -Math.PI / 4 : Math.PI / 4;
          npc.add(arm);
        }
      }
      
      // Set up physics and behavior properties
      const moveStyle = npcType.movementStyle;
      npc.userData = {
        id: `npc-${index}`,
        type: npcType.name,
        isMoving: true,
        moveSpeed: npcType.speed + Math.random() * 0.01,
        movementRange: 2 + Math.random() * 3,
        startX: pos.x,
        startY: y,
        startZ: pos.z,
        moveDirection: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        isCrushed: false,
        movementStyle: moveStyle,
        jumpHeight: npcType.jumpHeight,
        jumpTime: 0,
        strength: npcType.strength,
        crushable: npcType.crushable,
        attackCooldown: 0,
        wingFlapDirection: 1,
        wingFlapSpeed: 0.05,
        ghostTimer: Math.random() * Math.PI * 2,
        originalY: y
      };
      
      // Add to scene and to our list
      this.scene.add(npc);
      this.crushableObstacles.push(npc);
      
      // Emit to server about this obstacle
      if (this.socket) {
        this.socket.emit('addObstacle', {
          id: npc.userData.id,
          position: npc.position,
          type: npcType.name
        });
      }
    });
    
    // Listen for obstacle updates from other players
    this.socket.on('obstacleUpdate', (data) => {
      const obstacle = this.crushableObstacles.find(o => o.userData.id === data.id);
      if (obstacle) {
        if (data.isCrushed && !obstacle.userData.isCrushed) {
          this.crushObstacle(obstacle);
        }
      }
    });
  }
  
  initWorld() {
    console.log('Initializing procedural world...');
    
    // Update theme properties - leave existing ones, but enhance them with updated fields
    this.themeProperties = {
      'grassland': {
        groundColor: 0x7CFC00,  // Lawn green
        platformColors: [0x8B4513, 0xA52A2A, 0xCD853F], // Brown variations
        obstacleColor: 0x8B4513, // Brown
        skyColor: 0x87CEEB,     // Sky blue
        decorationColors: [0x228B22, 0x32CD32, 0x006400], // Forest greens
        fogColor: 0xADD8E6,     // Light blue
        fogNear: 30,
        fogFar: 100,
        enemyTypes: ['Goomba', 'Koopa', 'Paratroopa']
      },
      'desert': {
        groundColor: 0xF4A460,  // Sandy brown
        platformColors: [0xD2B48C, 0xF4A460, 0xDAA520], // Tan/sand variations
        obstacleColor: 0xCD853F, // Peru
        skyColor: 0xFFA07A,     // Light salmon
        decorationColors: [0xDAA520, 0xB8860B, 0xCD853F], // Golden/bronze tones
        fogColor: 0xFFDAB9,     // Peach puff
        fogNear: 20,
        fogFar: 80,
        enemyTypes: ['Spiny', 'Goomba', 'Boo']
      },
      'snow': {
        groundColor: 0xFFFAFA,  // Snow
        platformColors: [0xB0C4DE, 0xADD8E6, 0x87CEEB], // Light blue variations
        obstacleColor: 0xB0C4DE, // Light steel blue
        skyColor: 0xF0F8FF,     // Alice blue
        decorationColors: [0xB0E0E6, 0xADD8E6, 0x87CEEB], // Powder/sky blues
        fogColor: 0xF0FFFF,     // Azure
        fogNear: 15,
        fogFar: 50,
        enemyTypes: ['Koopa', 'Boo', 'Spiny']
      },
      'lava': {
        groundColor: 0x8B0000,  // Dark red
        platformColors: [0xA52A2A, 0x800000, 0x8B0000], // Red/brown variations
        obstacleColor: 0x800000, // Maroon
        skyColor: 0xFF4500,     // Orange red
        decorationColors: [0xFF0000, 0xFF6347, 0xFF4500], // Reds/oranges
        fogColor: 0xFF6347,     // Tomato
        fogNear: 10,
        fogFar: 60
      }
    };
    
    // Initialize base structures for the world
    this.platforms = [];
    this.decorations = [];
    
    // Create ground segments (we'll use multiple ground segments for endless runner effect)
    this.groundSegments = [];
    
    // Create the initial world sections
    this.generateInitialWorld();
    
    // Initialize enemy and coin spawning
    this.initCrushableObstacles();
    this.createCoins();
  }
  
  generateInitialWorld() {
    const currentTheme = this.themeProperties[this.currentTheme];
    
    // Set scene fog and background based on theme
    this.scene.background = new THREE.Color(currentTheme.skyColor);
    this.scene.fog = new THREE.Fog(currentTheme.fogColor, currentTheme.fogNear, currentTheme.fogFar);
    
    // Generate ground segments
    const groundWidth = 50; // Width of each ground segment
    const groundDepth = 200; // Length of ground extending forward
    
    // Create multiple ground segments for the "endless" effect
    for (let z = 0; z > -groundDepth; z -= 50) {
      const groundGeometry = new THREE.BoxGeometry(groundWidth, 1, 50);
      const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: currentTheme.groundColor,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const groundSegment = new THREE.Mesh(groundGeometry, groundMaterial);
      groundSegment.position.set(0, -0.5, z - 25); // Center the segment
      groundSegment.receiveShadow = true;
      
      // Assign segment data for recycling later
      groundSegment.userData = {
        segmentType: 'ground',
        zIndex: z,
      };
      
      this.groundSegments.push(groundSegment);
      this.scene.add(groundSegment);
      
      // Track the furthest point we've generated
      this.generatedZ = Math.min(this.generatedZ, z - 50);
    }
    
    // Generate initial platforms - spread out along the path
    const platformCount = 10;
    for (let i = 0; i < platformCount; i++) {
      this.generatePlatform(-(i * 20) - 10); // Stagger platforms with increasing distance
    }
    
    // Generate decorative elements
    this.generateDecorations();
  }
  
  generatePlatform(z) {
    const currentTheme = this.themeProperties[this.currentTheme];
    
    // Generate platform with random properties
    const width = 2 + Math.random() * 3;
    const height = 0.5;
    const depth = 2 + Math.random() * 3;
    
    // Random position - keep platforms accessible but varied
    const x = (Math.random() - 0.5) * 20;
    const y = 1 + Math.random() * 5;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: currentTheme.platformColor,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const platform = new THREE.Mesh(geometry, material);
    platform.position.set(x, y, z);
    platform.receiveShadow = true;
    platform.castShadow = true;
    
    // Store platform data for recycling
    platform.userData = {
      segmentType: 'platform',
      zPosition: z,
      originalY: y,
      movingPlatform: Math.random() > 0.6, // 40% chance to be a moving platform
      movementAmplitude: Math.random() * 1.5,
      movementFrequency: 0.02 + Math.random() * 0.02,
      movementPhase: Math.random() * Math.PI * 2,
      movementAxis: Math.random() > 0.5 ? 'x' : 'y' // Move horizontally or vertically
    };
    
    this.platforms.push(platform);
    this.scene.add(platform);
    
    // Add coins on top of some platforms
    if (Math.random() > 0.3) { // 70% chance to add coins
      this.generateCoinsForPlatform(platform);
    }
    
    // Add obstacles on some platforms
    if (Math.random() > 0.6) { // 40% chance to add an NPC
      this.generateNPCForPlatform(platform);
    }
    
    return platform;
  }
  
  generateDecorations() {
    const currentTheme = this.themeProperties[this.currentTheme];
    
    // Clear old decorations
    this.decorations.forEach(decoration => {
      this.scene.remove(decoration);
    });
    this.decorations = [];
    
    // Generate new decorations based on theme
    const decorationCount = 30;
    
    for (let i = 0; i < decorationCount; i++) {
      // Random position - spread throughout the visible area
      const x = (Math.random() - 0.5) * 40;
      const z = -(Math.random() * 100);
      
      let geometry, material, decoration;
      
      // Different decoration types based on theme
      switch(this.currentTheme) {
        case 'grassland':
          // Trees
          if (Math.random() > 0.5) {
            // Tree trunk
            geometry = new THREE.CylinderGeometry(0.3, 0.5, 2 + Math.random() * 2, 6);
            material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            decoration = new THREE.Mesh(geometry, material);
            
            // Tree top (leaves)
            const leavesGeometry = new THREE.ConeGeometry(1 + Math.random() * 0.5, 2 + Math.random() * 1, 8);
            const leavesColor = currentTheme.decorationColors[Math.floor(Math.random() * currentTheme.decorationColors.length)];
            const leavesMaterial = new THREE.MeshStandardMaterial({ color: leavesColor });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.y = decoration.geometry.parameters.height / 2 + leavesGeometry.parameters.height / 2 - 0.3;
            decoration.add(leaves);
          } else {
            // Bush
            geometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 8, 8);
            const bushColor = currentTheme.decorationColors[Math.floor(Math.random() * currentTheme.decorationColors.length)];
            material = new THREE.MeshStandardMaterial({ color: bushColor });
            decoration = new THREE.Mesh(geometry, material);
          }
          break;
          
        case 'desert':
          // Cactus or rock
          if (Math.random() > 0.5) {
            // Cactus
            geometry = new THREE.CylinderGeometry(0.3, 0.4, 1 + Math.random() * 2, 8);
            material = new THREE.MeshStandardMaterial({ color: 0x2E8B57 });
            decoration = new THREE.Mesh(geometry, material);
            
            // Cactus arms
            if (Math.random() > 0.5) {
              const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
              const arm = new THREE.Mesh(armGeometry, material);
              arm.rotation.z = Math.PI / 2;
              arm.position.set(0.5, decoration.geometry.parameters.height * 0.3, 0);
              decoration.add(arm);
            }
          } else {
            // Rock
            geometry = new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.4, 0);
            const rockColor = currentTheme.decorationColors[Math.floor(Math.random() * currentTheme.decorationColors.length)];
            material = new THREE.MeshStandardMaterial({ color: rockColor });
            decoration = new THREE.Mesh(geometry, material);
          }
          break;
          
        case 'snow':
          // Snowman or ice crystal
          if (Math.random() > 0.5) {
            // Snowman
            decoration = new THREE.Group();
            
            // Bottom sphere
            const bottomGeometry = new THREE.SphereGeometry(0.7, 12, 12);
            const snowMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
            const bottom = new THREE.Mesh(bottomGeometry, snowMaterial);
            decoration.add(bottom);
            
            // Middle sphere
            const middleGeometry = new THREE.SphereGeometry(0.5, 12, 12);
            const middle = new THREE.Mesh(middleGeometry, snowMaterial);
            middle.position.y = 0.9;
            decoration.add(middle);
            
            // Top sphere (head)
            const topGeometry = new THREE.SphereGeometry(0.3, 12, 12);
            const top = new THREE.Mesh(topGeometry, snowMaterial);
            top.position.y = 1.6;
            decoration.add(top);
          } else {
            // Ice crystal
            geometry = new THREE.OctahedronGeometry(0.6 + Math.random() * 0.4, 0);
            const crystalColor = currentTheme.decorationColors[Math.floor(Math.random() * currentTheme.decorationColors.length)];
            material = new THREE.MeshStandardMaterial({ 
              color: crystalColor, 
              transparent: true, 
              opacity: 0.8 
            });
            decoration = new THREE.Mesh(geometry, material);
          }
          break;
        
        case 'lava':
          // Volcanic rock or lava fountain
          if (Math.random() > 0.5) {
            // Volcanic rock
            geometry = new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.5, 1);
            material = new THREE.MeshStandardMaterial({ color: 0x333333 });
            decoration = new THREE.Mesh(geometry, material);
          } else {
            // Lava fountain/pool
            geometry = new THREE.CylinderGeometry(0.5 + Math.random() * 0.3, 0.7 + Math.random() * 0.3, 0.2, 12);
            const lavaColor = currentTheme.decorationColors[Math.floor(Math.random() * currentTheme.decorationColors.length)];
            material = new THREE.MeshStandardMaterial({ 
              color: lavaColor, 
              emissive: lavaColor,
              emissiveIntensity: 0.5
            });
            decoration = new THREE.Mesh(geometry, material);
          }
          break;
          
        default:
          // Default decoration (simple cylinder)
          geometry = new THREE.CylinderGeometry(0.3, 0.3, 1 + Math.random(), 8);
          material = new THREE.MeshStandardMaterial({ color: 0x888888 });
          decoration = new THREE.Mesh(geometry, material);
      }
      
      decoration.position.set(x, 0, z);
      decoration.castShadow = true;
      decoration.receiveShadow = true;
      
      // Store decoration data
      decoration.userData = {
        segmentType: 'decoration',
        zPosition: z
      };
      
      this.decorations.push(decoration);
      this.scene.add(decoration);
    }
  }
  
  generateCoinsForPlatform(platform) {
    // Get platform dimensions and position
    const platformWidth = platform.geometry.parameters.width;
    const platformDepth = platform.geometry.parameters.depth;
    const platformX = platform.position.x;
    const platformY = platform.position.y;
    const platformZ = platform.position.z;
    
    // Determine number of coins to create
    const coinCount = 1 + Math.floor(Math.random() * 3); // 1-3 coins
    
    for (let i = 0; i < coinCount; i++) {
      // Position relative to platform
      let x, z;
      
      if (coinCount === 1) {
        // Single coin in the center
        x = platformX;
        z = platformZ;
      } else {
        // Multiple coins in a row or pattern
        x = platformX + ((i / (coinCount - 1)) - 0.5) * (platformWidth * 0.7);
        z = platformZ;
      }
      
      // Create coin
      const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700, // Gold
        metalness: 1,
        roughness: 0.3,
        emissive: 0x665000,
        emissiveIntensity: 0.5
      });
      
      const coin = new THREE.Mesh(geometry, material);
      coin.rotation.x = Math.PI / 2; // Make it flat
      coin.position.set(x, platformY + 0.5, z); // Position above platform
      coin.castShadow = true;
      
      // Store coin data
      coin.userData = {
        segmentType: 'coin',
        isCollected: false,
        zPosition: z,
        rotationSpeed: 0.02 + Math.random() * 0.02
      };
      
      this.coins.push(coin);
      this.scene.add(coin);
    }
  }
  
  generateNPCForPlatform(platform) {
    // Get platform position
    const platformX = platform.position.x;
    const platformY = platform.position.y;
    const platformZ = platform.position.z;
    
    // Make sure we have NPC types defined
    if (!this.npcTypes || !this.npcTypes.length) {
      // Define NPC types if not already defined
      this.npcTypes = [
        {
          name: 'Goomba',
          geometry: new THREE.BoxGeometry(0.8, 0.6, 0.8),
          material: new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,  // Brown
            roughness: 0.7,
            metalness: 0.2
          }),
          speed: 0.03,
          movementStyle: 'ground',
          jumpHeight: 0,
          strength: 1,
          crushable: true
        },
        {
          name: 'Koopa',
          geometry: new THREE.CylinderGeometry(0.4, 0.6, 1.0, 8),
          material: new THREE.MeshStandardMaterial({ 
            color: 0x00AA00,  // Green
            roughness: 0.7,
            metalness: 0.2
          }),
          speed: 0.02,
          movementStyle: 'ground',
          jumpHeight: 0,
          strength: 1,
          crushable: true
        },
        {
          name: 'Spiny',
          geometry: new THREE.SphereGeometry(0.5, 16, 8),
          material: new THREE.MeshStandardMaterial({ 
            color: 0xDD2222,  // Red
            roughness: 0.6,
            metalness: 0.3
          }),
          speed: 0.04,
          movementStyle: 'ground',
          jumpHeight: 0,
          strength: 2,
          crushable: false
        },
        {
          name: 'Paratroopa',
          geometry: new THREE.CylinderGeometry(0.4, 0.6, 1.0, 8),
          material: new THREE.MeshStandardMaterial({ 
            color: 0xFF2222,  // Red
            roughness: 0.7,
            metalness: 0.2
          }),
          speed: 0.03,
          movementStyle: 'flying',
          jumpHeight: 0.5,
          strength: 1,
          crushable: true
        },
        {
          name: 'Boo',
          geometry: new THREE.SphereGeometry(0.5, 16, 16),
          material: new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,  // White
            roughness: 0.3,
            metalness: 0.1,
            transparent: true,
            opacity: 0.7
          }),
          speed: 0.02,
          movementStyle: 'ghost',
          jumpHeight: 0.2,
          strength: 1,
          crushable: true
        }
      ];
    }
    
    // Select random NPC type
    const npcType = this.npcTypes[Math.floor(Math.random() * this.npcTypes.length)];
    
    // Create the NPC mesh
    const npc = new THREE.Mesh(npcType.geometry, npcType.material.clone());
    
    // Set height based on movement style
    let y = platformY + 0.6; // Default above platform
    if (npcType.movementStyle === 'flying') {
      y = platformY + 1.5; // Flying enemies are higher
    } else if (npcType.movementStyle === 'ghost') {
      y = platformY + 1.0; // Ghosts float at medium height
    }
    
    npc.position.set(platformX, y, platformZ);
    npc.castShadow = true;
    npc.receiveShadow = true;
    
    // Create eyes for all NPCs - same code as in initCrushableObstacles
    const eyeGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    // Create two eyes
    for (let j = 0; j < 2; j++) {
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      const offset = j === 0 ? -0.2 : 0.2;
      
      // Position depends on the NPC type
      if (npcType.name === 'Goomba') {
        eye.position.set(offset, 0.15, 0.3);
      } else if (npcType.name === 'Koopa' || npcType.name === 'Spiny') {
        eye.position.set(offset, 0.2, 0.3);
      } else {
        eye.position.set(offset, 0, 0.3);
      }
      
      // Add pupil
      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        pupilMaterial
      );
      pupil.position.z = 0.08;
      eye.add(pupil);
      
      npc.add(eye);
    }
    
    // Add same special features as in initCrushableObstacles based on type
    this.addSpecialFeaturestoNPC(npc, npcType);
    
    // Set up physics and behavior properties
    const moveStyle = npcType.movementStyle;
    npc.userData = {
      id: `npc-platform-${platformZ}`,
      type: npcType.name,
      segmentType: 'enemy',
      isMoving: true,
      moveSpeed: npcType.speed + Math.random() * 0.01,
      movementRange: platformY + 1.0, // For vertical movement constraint
      platformWidth: platform.geometry.parameters.width,
      startX: platformX,
      startY: y,
      startZ: platformZ,
      moveDirection: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
      isCrushed: false,
      movementStyle: moveStyle,
      jumpHeight: npcType.jumpHeight,
      jumpTime: 0,
      strength: npcType.strength,
      crushable: npcType.crushable,
      attackCooldown: 0,
      wingFlapDirection: 1,
      wingFlapSpeed: 0.05,
      ghostTimer: Math.random() * Math.PI * 2,
      originalY: y,
      zPosition: platformZ
    };
    
    // Add to scene and to our list
    this.scene.add(npc);
    this.crushableObstacles.push(npc);
    
    // Emit to server about this obstacle
    if (this.socket) {
      this.socket.emit('addObstacle', {
        id: npc.userData.id,
        position: npc.position,
        type: npcType.name
      });
    }
    
    return npc;
  }
  
  addSpecialFeaturestoNPC(npc, npcType) {
    if (npcType.name === 'Goomba') {
      // Add feet to Goomba
      const footGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.3);
      const footMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      
      for (let f = 0; f < 2; f++) {
        const foot = new THREE.Mesh(footGeometry, footMaterial);
        foot.position.set(f === 0 ? 0.25 : -0.25, -0.3, 0);
        npc.add(foot);
      }
    } else if (npcType.name === 'Spiny') {
      // Add spikes to the Spiny
      const spikeGeometry = new THREE.ConeGeometry(0.08, 0.25, 4);
      const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
      
      for (let s = 0; s < 8; s++) {
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        const angle = (s / 8) * Math.PI * 2;
        spike.position.set(
          Math.cos(angle) * 0.5,
          Math.sin(angle) * 0.5,
          0
        );
        spike.rotation.z = Math.PI / 2;
        spike.rotation.y = angle;
        npc.add(spike);
      }
    } else if (npcType.name === 'Paratroopa') {
      // Add shell to Koopa/Paratroopa
      const shellGeometry = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const shellMaterial = new THREE.MeshStandardMaterial({ color: 0xFFAA00 });
      const shell = new THREE.Mesh(shellGeometry, shellMaterial);
      shell.rotation.x = Math.PI;
      shell.position.y = 0.2;
      npc.add(shell);
      
      // Add wings to Paratroopa
      const wingGeometry = new THREE.PlaneGeometry(0.6, 0.4);
      const wingMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFFFFF,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      
      for (let w = 0; w < 2; w++) {
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.position.set(w === 0 ? -0.4 : 0.4, 0.2, 0);
        wing.rotation.y = w === 0 ? Math.PI / 4 : -Math.PI / 4;
        npc.add(wing);
        
        // Store wing reference for animation
        if (!npc.userData) npc.userData = {};
        if (!npc.userData.wings) npc.userData.wings = [];
        npc.userData.wings.push(wing);
      }
    } else if (npcType.name === 'Boo') {
      // Add "arms" to Boo
      const armGeometry = new THREE.CapsuleGeometry(0.15, 0.3, 4, 8);
      const armMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.7
      });
      
      for (let a = 0; a < 2; a++) {
        const arm = new THREE.Mesh(armGeometry, armMaterial);
        arm.position.set(a === 0 ? -0.5 : 0.5, -0.2, 0);
        arm.rotation.z = a === 0 ? -Math.PI / 4 : Math.PI / 4;
        npc.add(arm);
      }
    }
  }
  
  createCoins() {
    // Initialize coin array
    this.coins = [];
    this.coinRespawnPool = [];
    
    // First, add coins to all existing platforms
    this.platforms.forEach(platform => {
      if (Math.random() > 0.3) { // 70% chance for each platform to have coins
        this.generateCoinsForPlatform(platform);
      }
    });
    
    // Then create some floating coins in the path for more interest
    const floatingCoinCount = 15;
    for (let i = 0; i < floatingCoinCount; i++) {
      // Create floating coin paths in random arrangements
      const startZ = -(i * 10) - 5; // Stagger coins along the path
      const x = (Math.random() - 0.5) * 15;
      const y = 1 + Math.random() * 3; // Height above ground
      
      // Create a coin cluster
      const clusterSize = Math.random() > 0.7 ? 1 : Math.floor(Math.random() * 4) + 1;
      
      for (let j = 0; j < clusterSize; j++) {
        let coinX, coinY, coinZ;
        
        if (clusterSize === 1) {
          // Single coin
          coinX = x;
          coinY = y;
          coinZ = startZ;
        } else {
          // Arrange in a pattern
          const arrangement = Math.floor(Math.random() * 3);
          
          switch (arrangement) {
            case 0: // Line
              coinX = x;
              coinY = y;
              coinZ = startZ - j * 0.8;
              break;
            case 1: // Arc
              const angle = (j / (clusterSize - 1)) * Math.PI;
              coinX = x + Math.cos(angle) * 1.2;
              coinY = y + Math.sin(angle) * 0.5;
              coinZ = startZ;
              break;
            case 2: // Circle
              const circleAngle = (j / clusterSize) * Math.PI * 2;
              coinX = x + Math.cos(circleAngle) * 0.8;
              coinY = y + Math.sin(circleAngle) * 0.8;
              coinZ = startZ;
              break;
          }
        }
        
        this.createCoin(coinX, coinY, coinZ);
      }
    }
  }
  
  createCoin(x, y, z) {
    // Create coin geometry based on coin size
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700, // Gold
      metalness: 1,
      roughness: 0.3,
      emissive: 0x665000,
      emissiveIntensity: 0.5
    });
    
    const coin = new THREE.Mesh(geometry, material);
    coin.rotation.x = Math.PI / 2; // Make it flat
    coin.position.set(x, y, z);
    coin.castShadow = true;
    
    // Store coin data
    coin.userData = {
      segmentType: 'coin',
      isCollected: false,
      zPosition: z,
      rotationSpeed: 0.02 + Math.random() * 0.02
    };
    
    this.coins.push(coin);
    this.scene.add(coin);
    
    return coin;
  }
  
  selectCharacter(character) {
    this.characterData = character;
    
    // Create player mesh
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh);
    }
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const playerColor = this.getCharacterColor(character.name);
    const material = new THREE.MeshLambertMaterial({ color: playerColor });
    this.playerMesh = new THREE.Mesh(geometry, material);
    this.playerMesh.castShadow = true;
    this.playerMesh.receiveShadow = true;
    this.playerMesh.position.set(0, 1, 0);
    this.scene.add(this.playerMesh);
    
    // Tell server about character selection
    this.socket.emit('selectCharacter', character);
  }
  
  startGame() {
    if (!this.characterData) {
      console.warn('Please select a character first!');
      return;
    }
    
    this.isRunning = true;
    console.log('Game started!');
  }
  
  gameOver() {
    this.isRunning = false;
    console.log('Game over! Final score:', this.score);
  }
  
  handleKeyDown(event) {
    switch (event.key) {
      case 'w':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 's':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'a':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'd':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case ' ': // Space bar
        this.keys.jump = true;
        if (!this.isJumping && this.isRunning) {
          this.velocity.y = this.jumpForce;
          this.isJumping = true;
        }
        break;
      case 'f': // Attack key - common in many games
      case 'e': // Alternative attack key
      case 'x': // Classic console action button
        this.keys.attack = true;
        this.performAttack();
        break;
    }
  }
  
  handleKeyUp(event) {
    switch (event.key) {
      case 'w':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 's':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'a':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'd':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case ' ': // Space bar
        this.keys.jump = false;
        break;
      case 'f': // Attack key
      case 'e': // Alternative attack key
      case 'x': // Classic console action button
        this.keys.attack = false;
        break;
    }
  }
  
  performAttack() {
    if (!this.isRunning || !this.playerMesh || this.isAttacking || this.attackCooldown > 0) return;
    
    console.log('Player attacking!');
    this.isAttacking = true;
    
    // Get player color for the attack effect
    const playerColor = this.characterData ? this.getCharacterColor(this.characterData.name) : 0xFFD700;
    
    // Create a visual effect for the attack (shockwave-like)
    const attackGeometry = new THREE.RingGeometry(0.2, 0.8, 16);
    const attackMaterial = new THREE.MeshBasicMaterial({ 
      color: playerColor, 
      transparent: true, 
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const attackMesh = new THREE.Mesh(attackGeometry, attackMaterial);
    
    // Position the attack effect in front of the player
    const directionVector = new THREE.Vector3(0, 0, -1);
    if (this.velocity.x !== 0 || this.velocity.z !== 0) {
      directionVector.set(this.velocity.x, 0, this.velocity.z).normalize();
    }
    
    attackMesh.position.copy(this.playerMesh.position);
    attackMesh.position.add(directionVector.multiplyScalar(1.2));
    attackMesh.rotation.x = Math.PI / 2; // Make it face forward properly
    
    this.scene.add(attackMesh);
    
    // Create a particle effect for the attack
    const particleCount = 20;
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: playerColor,
      size: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = attackMesh.position.x + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = attackMesh.position.y + (Math.random() - 0.5) * 0.5;
      positions[i3 + 2] = attackMesh.position.z + (Math.random() - 0.5) * 0.5;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(particles);
    
    // Emit socket event to notify other players about the attack
    this.socket.emit('playerAttack', {
      position: {
        x: attackMesh.position.x,
        y: attackMesh.position.y,
        z: attackMesh.position.z
      },
      color: playerColor
    });
    
    // Animate the attack effect (growing ring)
    let scale = 1;
    const animateAttack = () => {
      if (scale < 2) {
        scale += 0.1;
        attackMesh.scale.set(scale, scale, scale);
        requestAnimationFrame(animateAttack);
      }
    };
    animateAttack();
    
    // Check for crushable obstacles in attack range
    this.checkAttackCollisions(attackMesh);
    
    // Remove the attack effects after a short duration
    setTimeout(() => {
      this.scene.remove(attackMesh);
      this.scene.remove(particles);
      this.isAttacking = false;
      
      // Add cooldown
      this.attackCooldown = 20;
    }, 300);
  }
  
  checkAttackCollisions(attackMesh) {
    if (!this.playerMesh) return;
    
    const attackBox = new THREE.Box3().setFromObject(attackMesh);
    
    for (const obstacle of this.crushableObstacles) {
      if (obstacle.userData.isCrushed) continue;
      
      const obstacleBox = new THREE.Box3().setFromObject(obstacle);
      
      if (attackBox.intersectsBox(obstacleBox)) {
        console.log('Attack hit obstacle:', obstacle.userData.id);
        this.crushObstacle(obstacle);
        
        // Increase score
        this.score += 100;
        
        // Tell other players about the crushed obstacle
        this.socket.emit('obstacleUpdate', {
          id: obstacle.userData.id,
          isCrushed: true
        });
      }
    }
  }
  
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  updatePlayerPosition(deltaTime) {
    if (!this.isRunning || !this.playerMesh) return;
    
    // Apply gravity
    this.velocity.y -= this.gravity;
    
    // Handle movement based on key presses
    if (this.keys.forward) {
      this.velocity.z = -this.playerSpeed;
    } else if (this.keys.backward) {
      this.velocity.z = this.playerSpeed;
    } else {
      this.velocity.z = 0;
    }
    
    if (this.keys.left) {
      this.velocity.x = -this.playerSpeed;
    } else if (this.keys.right) {
      this.velocity.x = this.playerSpeed;
    } else {
      this.velocity.x = 0;
    }
    
    // Update player position
    this.playerMesh.position.x += this.velocity.x;
    this.playerMesh.position.y += this.velocity.y;
    this.playerMesh.position.z += this.velocity.z;
    
    // Check ground collision
    if (this.playerMesh.position.y <= 0.5) { // Player height is 1, so center + 0.5 = bottom
      this.playerMesh.position.y = 0.5;
      this.velocity.y = 0;
      this.isJumping = false;
    }
    
    // Check platform collisions
    this.checkPlatformCollisions();
    
    // Check coin collisions
    this.checkCoinCollisions();
    
    // Update camera to follow player
    this.camera.position.x = this.playerMesh.position.x;
    this.camera.position.z = this.playerMesh.position.z + 10;
    this.camera.lookAt(this.playerMesh.position);
    
    // Send position update to server
    if (this.characterData) {
      this.socket.emit('updatePosition', {
        character: this.characterData,
        position: {
          x: this.playerMesh.position.x,
          y: this.playerMesh.position.y,
          z: this.playerMesh.position.z
        }
      });
    }
  }
  
  checkPlatformCollisions() {
    if (!this.playerMesh) return;
    
    // Create a bounding box for the player
    const playerBox = new THREE.Box3().setFromObject(this.playerMesh);
    
    for (const platform of this.platforms) {
      const platformBox = new THREE.Box3().setFromObject(platform);
      
      if (playerBox.intersectsBox(platformBox)) {
        // Check if the player is above the platform
        const playerBottom = playerBox.min.y;
        const platformTop = platformBox.max.y;
        const wasAbove = playerBottom - this.velocity.y > platformTop;
        
        if (wasAbove && this.velocity.y < 0) {
          // Land on the platform
          this.playerMesh.position.y = platformTop + 0.5; // 0.5 is half player height
          this.velocity.y = 0;
          this.isJumping = false;
        }
      }
    }
  }
  
  checkCoinCollisions() {
    if (!this.playerMesh) return;
    
    const playerBox = new THREE.Box3().setFromObject(this.playerMesh);
    
    for (const coin of this.coins) {
      if (coin.userData.isCollected) continue;
      
      const coinBox = new THREE.Box3().setFromObject(coin);
      
      if (playerBox.intersectsBox(coinBox)) {
        // Collect the coin
        coin.userData.isCollected = true;
        coin.visible = false;
        
        // Increase score
        this.score += 10;
        console.log('Score:', this.score);
        
        // Play sound (would be implemented here)
      }
    }
  }
  
  updatePlayerLabels() {
    // Update position of name labels for other players
    this.players.forEach((player, id) => {
      if (player.mesh && player.nameLabel) {
        // Convert 3D position to 2D screen position
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(player.mesh.matrixWorld);
        vector.project(this.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
        
        player.nameLabel.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
      }
    });
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = now;
    
    // Update player position
    this.updatePlayerPosition(deltaTime);
    
    // Update player name labels
    this.updatePlayerLabels();
    
    // Update moving platforms
    this.updateMovingPlatforms();
    
    // Update crushable obstacles
    this.updateCrushableObstacles();
    
    // Check crushable obstacle collisions
    this.checkCrushableObstacleCollisions();
    
    // Update procedural world generation
    if (this.playerMesh) {
      this.updateProceduralWorld();
    }
    
    // Decrease attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    // Rotate coins for visual effect with their individual speeds
    this.coins.forEach(coin => {
      if (!coin.userData.isCollected) {
        coin.rotation.z += coin.userData.rotationSpeed || 0.02;
      }
    });
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  updateMovingPlatforms() {
    // Update positions of moving platforms
    for (const platform of this.platforms) {
      const userData = platform.userData;
      
      if (userData.movingPlatform) {
        const time = Date.now() * 0.001; // Current time in seconds
        
        if (userData.movementAxis === 'y') {
          // Vertical movement (up and down)
          platform.position.y = userData.originalY + 
            Math.sin(time * userData.movementFrequency + userData.movementPhase) * 
            userData.movementAmplitude;
        } else {
          // Horizontal movement (left and right)
          platform.position.x = userData.startX + 
            Math.sin(time * userData.movementFrequency + userData.movementPhase) * 
            userData.movementAmplitude;
        }
      }
    }
  }
  
  updateProceduralWorld() {
    // Track player movement for world generation
    const playerZ = this.playerMesh.position.z;
    
    // Generate new world sections as player advances
    if (playerZ < this.generatedZ + 100) { // If player is within 100 units of the end
      this.extendWorld();
    }
    
    // Check if player has moved far enough to change theme
    this.distanceTraveled = Math.abs(playerZ);
    if (this.distanceTraveled > this.nextThemeChange) {
      this.changeWorldTheme();
    }
    
    // Recycle world elements that are far behind the player
    this.recycleWorldElements(playerZ);
    
    // Respawn collected coins and crushed NPCs
    this.handleRespawning(playerZ);
  }
  
  extendWorld() {
    // Generate new ground segments
    const lastSegmentZ = this.generatedZ;
    const newSegmentZ = lastSegmentZ - 50; // Create a new segment 50 units further
    
    // Create new ground segment
    const groundGeometry = new THREE.BoxGeometry(50, 1, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: this.themeProperties[this.currentTheme].groundColor,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const groundSegment = new THREE.Mesh(groundGeometry, groundMaterial);
    groundSegment.position.set(0, -0.5, newSegmentZ - 25); // Center the segment
    groundSegment.receiveShadow = true;
    
    // Assign segment data
    groundSegment.userData = {
      segmentType: 'ground',
      zIndex: newSegmentZ,
    };
    
    this.groundSegments.push(groundSegment);
    this.scene.add(groundSegment);
    
    // Create new platforms in the new segment
    const platformCount = 1 + Math.floor(Math.random() * 3); // 1-3 platforms per segment
    for (let i = 0; i < platformCount; i++) {
      const z = newSegmentZ + Math.random() * 40; // Random position within segment
      this.generatePlatform(z);
    }
    
    // Create decorations in the new segment
    const decorationCount = 2 + Math.floor(Math.random() * 4); // 2-5 decorations per segment
    for (let i = 0; i < decorationCount; i++) {
      const x = (Math.random() - 0.5) * 40;
      const z = newSegmentZ + Math.random() * 50;
      this.generateDecoration(x, z);
    }
    
    // Update the furthest generated point
    this.generatedZ = newSegmentZ;
  }
  
  changeWorldTheme() {
    // Select a new theme different from the current one
    let newTheme;
    do {
      const themeIndex = Math.floor(Math.random() * this.worldThemes.length);
      newTheme = this.worldThemes[themeIndex];
    } while (newTheme === this.currentTheme);
    
    console.log(`Changing theme from ${this.currentTheme} to ${newTheme}`);
    this.currentTheme = newTheme;
    
    // Set when the next theme change will occur
    this.nextThemeChange = this.distanceTraveled + 300 + Math.random() * 200;
    
    // Update scene properties based on new theme
    const themeProps = this.themeProperties[this.currentTheme];
    this.scene.background = new THREE.Color(themeProps.skyColor);
    this.scene.fog.color = new THREE.Color(themeProps.fogColor);
    this.scene.fog.near = themeProps.fogNear;
    this.scene.fog.far = themeProps.fogFar;
    
    // Ground and decoration changes will happen gradually as new sections are generated
  }
  
  recycleWorldElements(playerZ) {
    // Calculate the cutoff point for recycling (distance behind player)
    const recycleCutoff = playerZ + this.respawnDistance;
    
    // Recycle ground segments
    this.groundSegments.forEach((segment, index) => {
      if (segment.position.z > recycleCutoff) {
        // Move this segment to the end of the world
        this.scene.remove(segment);
        this.groundSegments.splice(index, 1);
        // No need to add back - we'll generate new ones as needed
      }
    });
    
    // Recycle platforms
    this.platforms.forEach((platform, index) => {
      if (platform.position.z > recycleCutoff) {
        // Add platform to respawn pool and remove from active list
        this.scene.remove(platform);
        this.platforms.splice(index, 1);
      }
    });
    
    // Recycle decorations
    this.decorations.forEach((decoration, index) => {
      if (decoration.position.z > recycleCutoff) {
        this.scene.remove(decoration);
        this.decorations.splice(index, 1);
      }
    });
  }
  
  handleRespawning(playerZ) {
    // Respawn coins that were collected
    this.coins.forEach((coin, index) => {
      if (coin.userData.isCollected) {
        // Add to respawn pool
        if (!this.coinRespawnPool.includes(coin)) {
          this.coinRespawnPool.push(coin);
          this.scene.remove(coin);
          this.coins.splice(index, 1);
        }
      }
    });
    
    // Respawn crushed NPCs
    this.crushableObstacles.forEach((npc, index) => {
      if (npc.userData.isCrushed) {
        // Add to respawn pool
        if (!this.npcRespawnPool.includes(npc)) {
          this.npcRespawnPool.push(npc);
          this.scene.remove(npc);
          this.crushableObstacles.splice(index, 1);
        }
      }
    });
    
    // Generate new coins and NPCs from respawn pools
    const respawnCutoff = playerZ - 50; // Only respawn things out of view
    
    // Respawn from the coin pool
    const coinsToRespawn = Math.min(2, this.coinRespawnPool.length);
    for (let i = 0; i < coinsToRespawn; i++) {
      const coin = this.coinRespawnPool.pop();
      if (coin) {
        // Find a platform to place the coin on
        const eligiblePlatforms = this.platforms.filter(p => p.position.z < respawnCutoff);
        
        if (eligiblePlatforms.length > 0) {
          const platform = eligiblePlatforms[Math.floor(Math.random() * eligiblePlatforms.length)];
          
          // Reposition the coin
          coin.position.set(
            platform.position.x, 
            platform.position.y + 0.5, 
            platform.position.z
          );
          
          // Reset coin state
          coin.userData.isCollected = false;
          coin.userData.zPosition = platform.position.z;
          coin.visible = true;
          
          // Add back to scene and active list
          this.scene.add(coin);
          this.coins.push(coin);
        } else {
          // Put back in pool if no platforms available
          this.coinRespawnPool.push(coin);
        }
      }
    }
    
    // Respawn from the NPC pool
    const npcsToRespawn = Math.min(1, this.npcRespawnPool.length);
    for (let i = 0; i < npcsToRespawn; i++) {
      const npc = this.npcRespawnPool.pop();
      if (npc) {
        // Find a platform to place the NPC on
        const eligiblePlatforms = this.platforms.filter(p => p.position.z < respawnCutoff);
        
        if (eligiblePlatforms.length > 0) {
          const platform = eligiblePlatforms[Math.floor(Math.random() * eligiblePlatforms.length)];
          
          // Reposition the NPC
          let y = platform.position.y + 0.6;
          if (npc.userData.movementStyle === 'flying') {
            y = platform.position.y + 1.5;
          } else if (npc.userData.movementStyle === 'ghost') {
            y = platform.position.y + 1.0;
          }
          
          npc.position.set(
            platform.position.x, 
            y, 
            platform.position.z
          );
          
          // Reset NPC state
          npc.userData.isCrushed = false;
          npc.userData.zPosition = platform.position.z;
          npc.userData.startX = platform.position.x;
          npc.userData.startY = y;
          npc.userData.startZ = platform.position.z;
          npc.userData.isMoving = true;
          npc.scale.set(1, 1, 1); // Reset scale (uncrushed)
          
          // Reset materials
          npc.traverse(child => {
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(material => {
                  material.transparent = npc.userData.type === 'Boo';
                  material.opacity = npc.userData.type === 'Boo' ? 0.7 : 1;
                });
              } else {
                child.material.transparent = npc.userData.type === 'Boo';
                child.material.opacity = npc.userData.type === 'Boo' ? 0.7 : 1;
              }
            }
          });
          
          // Add back to scene and active list
          this.scene.add(npc);
          this.crushableObstacles.push(npc);
        } else {
          // Put back in pool if no platforms available
          this.npcRespawnPool.push(npc);
        }
      }
    }
  }
  
  generateDecoration(x, z) {
    const currentTheme = this.themeProperties[this.currentTheme];
    let geometry, material, decoration;
    
    // Create decoration based on theme - simplified from generateDecorations
    switch(this.currentTheme) {
      case 'grassland':
        // Trees or bushes
        if (Math.random() > 0.5) {
          // Simple tree
          decoration = new THREE.Group();
          
          // Trunk
          const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
          const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
          const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
          decoration.add(trunk);
          
          // Leaves
          const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
          const leavesColor = currentTheme.decorationColors[Math.floor(Math.random() * currentTheme.decorationColors.length)];
          const leavesMaterial = new THREE.MeshStandardMaterial({ color: leavesColor });
          const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
          leaves.position.y = 1.5;
          decoration.add(leaves);
        } else {
          // Bush
          geometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 8, 8);
          const bushColor = currentTheme.decorationColors[Math.floor(Math.random() * currentTheme.decorationColors.length)];
          material = new THREE.MeshStandardMaterial({ color: bushColor });
          decoration = new THREE.Mesh(geometry, material);
        }
        break;
        
      default:
        // Simple shape for other themes
        geometry = new THREE.BoxGeometry(1 + Math.random(), 1 + Math.random(), 1 + Math.random());
        const decorColor = currentTheme.decorationColors[Math.floor(Math.random() * currentTheme.decorationColors.length)];
        material = new THREE.MeshStandardMaterial({ color: decorColor });
        decoration = new THREE.Mesh(geometry, material);
    }
    
    decoration.position.set(x, 0, z);
    decoration.castShadow = true;
    decoration.receiveShadow = true;
    
    // Store decoration data
    decoration.userData = {
      segmentType: 'decoration',
      zPosition: z
    };
    
    this.decorations.push(decoration);
    this.scene.add(decoration);
    
    return decoration;
  }
  
  updateCrushableObstacles() {
    this.crushableObstacles.forEach(obstacle => {
      if (obstacle.userData.isMoving && !obstacle.userData.isCrushed) {
        const userData = obstacle.userData;
        
        // Different movement patterns based on NPC type
        if (userData.movementStyle === 'ground') {
          // Ground enemies move left and right with simple patrolling
          
          // Check if we should turn around due to hitting a wall or edge
          const ahead = new THREE.Vector3(
            obstacle.position.x + userData.moveDirection.x * 0.5,
            0, // Cast from high position down
            obstacle.position.z + userData.moveDirection.z * 0.5
          );
          
          // Move the NPC
          obstacle.position.x += userData.moveDirection.x * userData.moveSpeed;
          obstacle.position.z += userData.moveDirection.z * userData.moveSpeed;
          
          // Check if too far from starting position
          const distanceFromStart = new THREE.Vector2(
            obstacle.position.x - userData.startX,
            obstacle.position.z - userData.startZ
          ).length();
          
          if (distanceFromStart > userData.movementRange) {
            // Turn back toward starting position
            userData.moveDirection.set(
              userData.startX - obstacle.position.x,
              0,
              userData.startZ - obstacle.position.z
            ).normalize();
            
            // Set rotation to face direction of movement
            obstacle.rotation.y = Math.atan2(userData.moveDirection.x, userData.moveDirection.z);
          }
        } 
        else if (userData.movementStyle === 'flying') {
          // Flying enemies move in more complex patterns with height changes
          
          // Increment jump time
          userData.jumpTime += 0.02;
          
          // Sinusoidal up and down movement
          const heightOffset = Math.sin(userData.jumpTime) * userData.jumpHeight * 0.5;
          obstacle.position.y = userData.startY + heightOffset;
          
          // Move horizontally
          obstacle.position.x += userData.moveDirection.x * userData.moveSpeed;
          obstacle.position.z += userData.moveDirection.z * userData.moveSpeed;
          
          // Check if too far from starting position
          const distanceFromStart = new THREE.Vector2(
            obstacle.position.x - userData.startX,
            obstacle.position.z - userData.startZ
          ).length();
          
          if (distanceFromStart > userData.movementRange) {
            // Turn back toward starting position
            userData.moveDirection.set(
              userData.startX - obstacle.position.x,
              0,
              userData.startZ - obstacle.position.z
            ).normalize();
            
            // Set rotation to face direction of movement
            obstacle.rotation.y = Math.atan2(userData.moveDirection.x, userData.moveDirection.z);
          }
          
          // Animate wings if they exist
          if (userData.wings && userData.wings.length > 0) {
            userData.wings.forEach(wing => {
              // Flap wings up and down
              wing.rotation.z += userData.wingFlapDirection * userData.wingFlapSpeed;
              
              // Reverse direction at limits
              if (wing.rotation.z > 0.3 || wing.rotation.z < -0.3) {
                userData.wingFlapDirection *= -1;
              }
            });
          }
        } 
        else if (userData.movementStyle === 'ghost') {
          // Ghost enemies fade in and out and move erratically
          
          // Update ghost timer
          userData.ghostTimer += 0.02;
          
          // Sinusoidal opacity changes
          const opacityValue = 0.3 + Math.sin(userData.ghostTimer) * 0.4;
          obstacle.traverse(child => {
            if (child.material && child.material.transparent) {
              child.material.opacity = Math.max(0.1, opacityValue);
            }
          });
          
          // Circular/erratic movement pattern
          const xOffset = Math.sin(userData.ghostTimer) * 2;
          const zOffset = Math.cos(userData.ghostTimer) * 2;
          const yOffset = Math.sin(userData.ghostTimer * 0.7) * 0.5;
          
          obstacle.position.x = userData.startX + xOffset;
          obstacle.position.z = userData.startZ + zOffset;
          obstacle.position.y = userData.originalY + yOffset;
          
          // Always face the player for eerie effect
          if (this.playerMesh) {
            const lookDirection = new THREE.Vector3();
            lookDirection.subVectors(this.playerMesh.position, obstacle.position).normalize();
            obstacle.lookAt(this.playerMesh.position);
          }
        }
        
        // If the NPC has attack capabilities, check for player proximity
        if (this.playerMesh && userData.attackCooldown <= 0) {
          const distanceToPlayer = obstacle.position.distanceTo(this.playerMesh.position);
          
          // If player is close, prepare to attack
          if (distanceToPlayer < 2) {
            userData.attackCooldown = 60; // Reset attack cooldown
            
            // Create enemy attack visual effect
            this.showEnemyAttackEffect(obstacle.position);
          }
        }
        
        // Decrease attack cooldown
        if (userData.attackCooldown > 0) {
          userData.attackCooldown--;
        }
      }
    });
  }
  
  checkCrushableObstacleCollisions() {
    if (!this.playerMesh || !this.isRunning) return;
    
    const playerBox = new THREE.Box3().setFromObject(this.playerMesh);
    
    for (const obstacle of this.crushableObstacles) {
      if (obstacle.userData.isCrushed) continue;
      
      const obstacleBox = new THREE.Box3().setFromObject(obstacle);
      
      if (playerBox.intersectsBox(obstacleBox)) {
        // Check if player is above the obstacle (jumping on its head)
        const playerBottom = this.playerMesh.position.y - 0.5; // Bottom of player
        const obstacleTop = obstacle.position.y + 0.4; // Top of obstacle
        
        if (playerBottom >= obstacleTop && this.velocity.y < 0) {
          // Crushing the obstacle!
          this.crushObstacle(obstacle);
          
          // Bounce the player up
          this.velocity.y = this.jumpForce * 0.8;
          
          // Increase score
          this.score += 50;
          console.log('Crushed obstacle! Score:', this.score);
          
          // Tell other players about the crushed obstacle
          this.socket.emit('obstacleUpdate', {
            id: obstacle.userData.id,
            isCrushed: true
          });
        } else {
          // Player hit the obstacle without crushing it
          if (!obstacle.userData.isCrushed) {
            // Player loses a life
            this.lives -= 1;
            console.log('Ouch! Lives remaining:', this.lives);
            
            // Knockback effect
            const knockbackDirection = new THREE.Vector3();
            knockbackDirection.subVectors(this.playerMesh.position, obstacle.position).normalize();
            this.playerMesh.position.x += knockbackDirection.x * 2;
            this.playerMesh.position.z += knockbackDirection.z * 2;
            this.velocity.y = this.jumpForce * 0.5; // Small bounce
            
            // Create damage effect (red flash)
            this.showPlayerDamageEffect();
            
            // Create enemy attack visual
            this.showEnemyAttackEffect(obstacle.position);
            
            // Check for game over
            if (this.lives <= 0) {
              this.gameOver();
            }
          }
        }
      }
    }
  }
  
  crushObstacle(obstacle) {
    // Mark as crushed
    obstacle.userData.isCrushed = true;
    obstacle.userData.isMoving = false;
    
    // Squash the obstacle
    obstacle.scale.y = 0.2;
    obstacle.position.y = 0.1;
    
    // Make it transparent
    obstacle.traverse(child => {
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            material.transparent = true;
            material.opacity = 0.5;
          });
        } else {
          child.material.transparent = true;
          child.material.opacity = 0.5;
        }
      }
    });
    
    // Remove after delay
    setTimeout(() => {
      this.scene.remove(obstacle);
      const index = this.crushableObstacles.indexOf(obstacle);
      if (index > -1) {
        this.crushableObstacles.splice(index, 1);
      }
    }, 3000);
  }
  
  // Method to be called from outside to update settings
  showPlayerDamageEffect() {
    if (!this.playerMesh) return;
    
    // Store original materials
    const originalMaterials = [];
    this.playerMesh.traverse(child => {
      if (child.material) {
        if (Array.isArray(child.material)) {
          originalMaterials.push(...child.material);
          child.material = child.material.map(m => 
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
          );
        } else {
          originalMaterials.push(child.material);
          child.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        }
      }
    });
    
    // Create a screen flash effect
    const flashGeometry = new THREE.PlaneGeometry(10, 10);
    const flashMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      transparent: true, 
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const flashScreen = new THREE.Mesh(flashGeometry, flashMaterial);
    flashScreen.position.copy(this.camera.position);
    flashScreen.position.z -= 2; // Place it in front of the camera
    flashScreen.quaternion.copy(this.camera.quaternion);
    this.scene.add(flashScreen);
    
    // Restore original materials after a short time
    setTimeout(() => {
      this.playerMesh.traverse((child, i) => {
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material = originalMaterials.splice(0, child.material.length);
          } else {
            child.material = originalMaterials.shift();
          }
        }
      });
      
      this.scene.remove(flashScreen);
    }, 300);
  }
  
  showEnemyAttackEffect(position) {
    // Create an attack visual effect from the enemy
    const attackGeometry = new THREE.RingGeometry(0.1, 0.5, 16);
    const attackMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff3333, 
      transparent: true, 
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const attackMesh = new THREE.Mesh(attackGeometry, attackMaterial);
    attackMesh.position.copy(position);
    attackMesh.rotation.x = Math.PI / 2;
    this.scene.add(attackMesh);
    
    // Add particles for the enemy attack
    const particleCount = 15;
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff3333,
      size: 0.08,
      transparent: true,
      opacity: 0.7
    });
    
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = position.x + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(particles);
    
    // Animate the attack outward
    let scale = 1;
    const animateAttack = () => {
      if (scale < 2) {
        scale += 0.15;
        attackMesh.scale.set(scale, scale, scale);
        attackMesh.material.opacity = 0.8 - (scale - 1) * 0.6;
        requestAnimationFrame(animateAttack);
      }
    };
    animateAttack();
    
    // Remove after a short duration
    setTimeout(() => {
      this.scene.remove(attackMesh);
      this.scene.remove(particles);
    }, 300);
  }
  
  updateSettings(settings) {
    if (settings.musicVolume !== undefined) {
      // Implement music volume control
    }
    
    if (settings.sfxVolume !== undefined) {
      // Implement sound effects volume control
    }
    
    if (settings.shadows !== undefined) {
      this.renderer.shadowMap.enabled = settings.shadows;
    }
    
    console.log('Settings updated:', settings);
  }
  
  // Method to restart the game
  restartGame() {
    // Reset player position
    if (this.playerMesh) {
      this.playerMesh.position.set(0, 1, 0);
      this.velocity.set(0, 0, 0);
    }
    
    // Reset score
    this.score = 0;
    
    // Reset lives
    this.lives = 3;
    
    // Reset coins
    this.coins.forEach(coin => {
      coin.userData.isCollected = false;
      coin.visible = true;
    });
    
    // Start the game
    this.isRunning = true;
  }
}