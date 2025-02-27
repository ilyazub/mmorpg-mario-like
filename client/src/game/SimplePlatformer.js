import * as THREE from 'three';

export default class SimplePlatformer {
  constructor(container) {
    // Game state
    this.isRunning = false;
    this.score = 0;
    this.lives = 3;
    
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
    this.initPlayer();
    this.initPlatforms();
    this.initCollectibles();
    
    // Start animation loop
    this.animate();
  }
  
  initLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);
  }
  
  initPlayer() {
    // Create player character (simple for now)
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red for Mario-like
    this.player = new THREE.Mesh(geometry, material);
    this.player.position.set(0, 1, 0); // Start above ground
    this.player.castShadow = true;
    this.player.receiveShadow = true;
    
    // Add player to scene
    this.scene.add(this.player);
  }
  
  initPlatforms() {
    // Create ground
    const groundGeometry = new THREE.BoxGeometry(30, 1, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.position.y = -0.5;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    
    // Create platforms
    this.platforms = [];
    
    // Platform 1
    const platform1 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1, 3),
      new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    platform1.position.set(8, 2, 0);
    platform1.receiveShadow = true;
    this.scene.add(platform1);
    this.platforms.push(platform1);
    
    // Platform 2
    const platform2 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1, 3),
      new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    platform2.position.set(-8, 3, 0);
    platform2.receiveShadow = true;
    this.scene.add(platform2);
    this.platforms.push(platform2);
    
    // Platform 3 (moving)
    const platform3 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1, 3),
      new THREE.MeshStandardMaterial({ color: 0x32CD32 }) // Green
    );
    platform3.position.set(0, 5, 0);
    platform3.receiveShadow = true;
    platform3.userData.direction = 1; // For moving direction
    platform3.userData.speed = 0.05; // Movement speed
    platform3.userData.range = 6; // Movement range
    platform3.userData.startX = 0; // Starting position
    this.scene.add(platform3);
    this.platforms.push(platform3);
  }
  
  initCollectibles() {
    // Create coins
    this.coins = [];
    const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
    const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 }); // Gold
    
    // Add several coins at different positions
    const coinPositions = [
      { x: 8, y: 3.5, z: 0 },  // Above platform 1
      { x: -8, y: 4.5, z: 0 }, // Above platform 2
      { x: 0, y: 6.5, z: 0 },  // Above platform 3
      { x: 4, y: 1.5, z: 2 },  // On the ground
      { x: -4, y: 1.5, z: -2 } // On the ground
    ];
    
    coinPositions.forEach(pos => {
      const coin = new THREE.Mesh(coinGeometry, coinMaterial);
      coin.position.set(pos.x, pos.y, pos.z);
      coin.rotation.x = Math.PI / 2; // Rotate to face up
      coin.castShadow = true;
      this.scene.add(coin);
      this.coins.push(coin);
    });
  }
  
  startGame() {
    this.isRunning = true;
    this.score = 0;
    this.lives = 3;
    
    // Reset player position
    this.player.position.set(0, 1, 0);
    this.velocity.set(0, 0, 0);
    
    // Make sure all coins are visible
    this.coins.forEach(coin => {
      coin.visible = true;
    });
  }
  
  gameOver() {
    this.isRunning = false;
    console.log('Game Over! Final Score:', this.score);
    // Could implement a game over screen or restart option here
  }
  
  handleKeyDown(event) {
    switch(event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'Space':
        this.keys.jump = true;
        break;
    }
  }
  
  handleKeyUp(event) {
    switch(event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'Space':
        this.keys.jump = false;
        break;
    }
  }
  
  handleResize() {
    // Update camera aspect ratio and renderer size on window resize
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  update() {
    if (!this.isRunning) return;
    
    // Apply gravity
    this.velocity.y -= this.gravity;
    
    // Handle movement based on keys pressed
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
    
    // Handle jumping
    if (this.keys.jump && !this.isJumping) {
      this.velocity.y = this.jumpForce;
      this.isJumping = true;
    }
    
    // Update player position
    this.player.position.x += this.velocity.x;
    this.player.position.y += this.velocity.y;
    this.player.position.z += this.velocity.z;
    
    // Collision detection with ground and platforms
    this.handleCollisions();
    
    // Update moving platforms
    this.updatePlatforms();
    
    // Collect coins
    this.checkCoinCollisions();
    
    // Check if player fell off the map
    if (this.player.position.y < -10) {
      this.lives--;
      if (this.lives <= 0) {
        this.gameOver();
      } else {
        // Reset position
        this.player.position.set(0, 1, 0);
        this.velocity.set(0, 0, 0);
      }
    }
    
    // Update camera to follow player
    this.camera.position.x = this.player.position.x;
    this.camera.position.z = this.player.position.z + 10;
    this.camera.lookAt(this.player.position);
  }
  
  handleCollisions() {
    // Check ground collision
    if (this.player.position.y - 1 <= this.ground.position.y + 0.5 &&
        Math.abs(this.player.position.x) < 15 && 
        Math.abs(this.player.position.z) < 5) {
      this.player.position.y = this.ground.position.y + 1.5; // 1.5 = ground height (0.5) + player height (1)
      this.velocity.y = 0;
      this.isJumping = false;
    }
    
    // Check platform collisions
    this.platforms.forEach(platform => {
      const platformWidth = platform.geometry.parameters.width;
      const platformDepth = platform.geometry.parameters.depth;
      
      // Check if player is above platform and falling
      if (this.velocity.y <= 0 && 
          Math.abs(this.player.position.x - platform.position.x) < platformWidth / 2 &&
          Math.abs(this.player.position.z - platform.position.z) < platformDepth / 2 &&
          this.player.position.y - 1 <= platform.position.y + 0.5 &&
          this.player.position.y - 1 > platform.position.y) {
        
        this.player.position.y = platform.position.y + 1.5; // 1.5 = platform height (0.5) + player height (1)
        this.velocity.y = 0;
        this.isJumping = false;
        
        // If it's the moving platform, player moves with it
        if (platform.userData.speed) {
          this.player.position.x += platform.userData.direction * platform.userData.speed;
        }
      }
    });
    
    // Keep player within bounds
    if (this.player.position.x > 15) this.player.position.x = 15;
    if (this.player.position.x < -15) this.player.position.x = -15;
    if (this.player.position.z > 5) this.player.position.z = 5;
    if (this.player.position.z < -5) this.player.position.z = -5;
  }
  
  updatePlatforms() {
    // Update moving platform
    const movingPlatform = this.platforms[2]; // Third platform is moving
    
    movingPlatform.position.x += movingPlatform.userData.direction * movingPlatform.userData.speed;
    
    // Change direction when reaching the range limits
    if (Math.abs(movingPlatform.position.x - movingPlatform.userData.startX) > movingPlatform.userData.range) {
      movingPlatform.userData.direction *= -1;
    }
    
    // Rotate all coins for animation
    this.coins.forEach(coin => {
      coin.rotation.z += 0.02;
    });
  }
  
  checkCoinCollisions() {
    // Check if player collects coins
    this.coins.forEach(coin => {
      if (coin.visible && 
          Math.abs(this.player.position.x - coin.position.x) < 1 &&
          Math.abs(this.player.position.y - coin.position.y) < 1 &&
          Math.abs(this.player.position.z - coin.position.z) < 1) {
        
        // Collect coin
        coin.visible = false;
        this.score += 10;
        console.log('Score:', this.score);
      }
    });
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Update game state
    this.update();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
}