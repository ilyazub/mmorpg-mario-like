import * as THREE from 'three';
import { io } from 'socket.io-client';

export default class MultiplayerPlatformer {
  constructor(container) {
    // Game state
    this.isRunning = false;
    this.score = 0;
    this.lives = 3;
    this.players = new Map(); // Store other players
    
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
    
    // Controls state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false
    };
    
    // Setup event listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Initialize game elements
    this.initLights();
    this.initWorld();
    
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
  
  initWorld() {
    // Create ground
    const groundGeometry = new THREE.BoxGeometry(100, 1, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 1,
      metalness: 0
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.position.y = -0.5; // Place it below the player
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    
    // Create platforms
    const platformPositions = [
      { x: 0, y: 3, z: -5, width: 3, height: 0.5, depth: 3 },
      { x: 5, y: 1, z: 3, width: 2, height: 0.5, depth: 2 },
      { x: -5, y: 2, z: 3, width: 2, height: 0.5, depth: 2 },
      { x: 0, y: 5, z: -10, width: 2, height: 0.5, depth: 2 }
    ];
    
    this.platforms = [];
    
    platformPositions.forEach(platform => {
      const geometry = new THREE.BoxGeometry(platform.width, platform.height, platform.depth);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x4CAF50,
        roughness: 0.8,
        metalness: 0.2
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(platform.x, platform.y, platform.z);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      
      this.platforms.push(mesh);
      this.scene.add(mesh);
    });
    
    // Create collectible coins
    this.createCoins();
  }
  
  createCoins() {
    const coinPositions = [
      { x: 0, y: 1, z: -5 },
      { x: 5, y: 2, z: 3 },
      { x: -5, y: 3, z: 3 },
      { x: 0, y: 6, z: -10 }
    ];
    
    this.coins = [];
    
    coinPositions.forEach(pos => {
      const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700,
        metalness: 1,
        roughness: 0.3,
        emissive: 0x665000,
        emissiveIntensity: 0.5
      });
      const coin = new THREE.Mesh(geometry, material);
      coin.rotation.x = Math.PI / 2; // Make it flat
      coin.position.set(pos.x, pos.y, pos.z);
      coin.castShadow = true;
      coin.userData.isCollected = false;
      
      this.coins.push(coin);
      this.scene.add(coin);
    });
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
    
    // Rotate coins for visual effect
    this.coins.forEach(coin => {
      if (!coin.userData.isCollected) {
        coin.rotation.z += 0.02;
      }
    });
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  // Method to be called from outside to update settings
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