import * as THREE from "three";

export class Player {
  constructor(scene, camera, networkManager = null) {
    this.scene = scene;
    this.camera = camera;
    this.networkManager = networkManager;

    // Player properties
    this.position = new THREE.Vector3(0, 1, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);

    // Player stats
    this.health = 100;
    this.maxHealth = 100;
    this.bodyTemperature = 37.0; // Normal body temperature in Celsius
    this.isAlive = true;
    this.respawnTime = 0;

    // Movement properties
    this.speed = 5;
    this.jumpPower = 8;
    this.isGrounded = true;
    this.gravity = -20;

    // Look sensitivity
    this.mouseSensitivity = 0.002;

    // Snowball properties
    this.snowballs = [];
    this.snowballCooldown = 0;
    this.snowballCooldownTime = 0.5;

    // Set initial spawn position within limited area
    this.setRandomSpawnPosition();

    this.init();
  }

  // Generate random spawn position within a 10x10 area
  setRandomSpawnPosition() {
    const spawnRange = 5; // 5 units in each direction from center
    const x = (Math.random() - 0.5) * 2 * spawnRange; // Random between -5 and 5
    const z = (Math.random() - 0.5) * 2 * spawnRange; // Random between -5 and 5
    this.position.set(x, 1, z);
  }

  init() {
    // Create player representation (simple capsule for now) - Made larger for visibility
    const geometry = new THREE.CapsuleGeometry(0.8, 2.5, 4, 8);
    const material = new THREE.MeshLambertMaterial({ color: 0x4444ff });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;

    // Hide own player mesh in first-person view (you don't see yourself)
    this.mesh.visible = false;

    this.scene.add(this.mesh);

    // Set initial camera position
    this.updateCameraPosition();
  }

  update(deltaTime, moveInput, mouseInput) {
    if (!this.isAlive) {
      this.handleRespawn(deltaTime);
      return;
    }

    // Handle mouse look
    if (mouseInput.x !== 0 || mouseInput.y !== 0) {
      this.rotation.y -= mouseInput.x * this.mouseSensitivity;
      this.rotation.x -= mouseInput.y * this.mouseSensitivity;

      // Clamp vertical rotation
      this.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, this.rotation.x)
      );
    }

    // Handle movement
    this.handleMovement(deltaTime, moveInput);

    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y += this.gravity * deltaTime;
    }

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Ground collision (simple)
    if (this.position.y <= 1) {
      this.position.y = 1;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Update mesh position
    this.mesh.position.copy(this.position);

    // Update camera
    this.updateCameraPosition();

    // Update snowballs
    this.updateSnowballs(deltaTime);

    // Update cooldowns
    if (this.snowballCooldown > 0) {
      this.snowballCooldown -= deltaTime;
    }

    // Simulate temperature loss over time (gameplay mechanic) - DISABLED FOR DEV
    // this.bodyTemperature -= deltaTime * 0.1;
    // this.health = Math.max(0, (this.bodyTemperature - 32) * (100 / 5)); // 32°C = 0 health, 37°C = 100 health

    // Check if player is "frozen out"
    // if (this.health <= 0 && this.isAlive) {
    //   this.freeze();
    // }
  }

  handleMovement(deltaTime, moveInput) {
    const moveVector = new THREE.Vector3();

    // Calculate movement direction based on camera rotation
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);

    forward.applyQuaternion(this.camera.quaternion);
    right.applyQuaternion(this.camera.quaternion);

    // Project vectors onto horizontal plane
    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();

    // Apply input
    if (moveInput.forward) moveVector.add(forward);
    if (moveInput.backward) moveVector.sub(forward);
    if (moveInput.left) moveVector.sub(right);
    if (moveInput.right) moveVector.add(right);

    // Normalize and apply speed
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(this.speed);

      // Only apply horizontal movement
      this.velocity.x = moveVector.x;
      this.velocity.z = moveVector.z;

      // Warm up slightly when moving - DISABLED FOR DEV
      // this.bodyTemperature += deltaTime * 0.5;
      // this.bodyTemperature = Math.min(37.0, this.bodyTemperature);
    } else {
      // Apply friction
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
    }
  }

  jump() {
    if (this.isGrounded && this.isAlive) {
      this.velocity.y = this.jumpPower;
      this.isGrounded = false;
    }
  }

  throwSnowball() {
    if (this.snowballCooldown > 0 || !this.isAlive) return;

    // Create snowball
    const snowball = this.createSnowball();
    this.snowballs.push(snowball);
    this.scene.add(snowball.mesh);

    // Send to network if connected
    if (this.networkManager && this.networkManager.isConnected) {
      this.networkManager.sendSnowballThrow(
        snowball.mesh.position,
        snowball.velocity
      );
    }

    // Set cooldown
    this.snowballCooldown = this.snowballCooldownTime;

    console.log("Snowball thrown!");
  }

  createSnowball() {
    const geometry = new THREE.SphereGeometry(0.1, 8, 6);
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);

    // Position at camera/player position
    const startPosition = this.camera.position.clone();
    mesh.position.copy(startPosition);

    // Calculate direction based on camera rotation
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    direction.normalize();

    const snowball = {
      mesh: mesh,
      velocity: direction.multiplyScalar(20),
      lifetime: 5.0,
      age: 0,
    };

    return snowball;
  }

  updateSnowballs(deltaTime) {
    for (let i = this.snowballs.length - 1; i >= 0; i--) {
      const snowball = this.snowballs[i];

      // Update position
      snowball.mesh.position.add(
        snowball.velocity.clone().multiplyScalar(deltaTime)
      );

      // Apply gravity to snowball
      snowball.velocity.y -= 9.8 * deltaTime;

      // Update age
      snowball.age += deltaTime;

      // Remove if too old or hit ground
      if (snowball.age > snowball.lifetime || snowball.mesh.position.y < 0) {
        this.scene.remove(snowball.mesh);
        this.snowballs.splice(i, 1);
      }
    }
  }

  freeze() {
    this.isAlive = false;
    this.respawnTime = 5.0; // 5 second respawn time
    this.mesh.visible = false;

    // Show respawn screen
    document.getElementById("respawnScreen").style.display = "flex";

    console.log("Player frozen out! Respawning in 5 seconds...");
  }

  handleRespawn(deltaTime) {
    this.respawnTime -= deltaTime;

    // Update respawn timer UI
    const timerElement = document.getElementById("respawnTimer");
    if (timerElement) {
      timerElement.textContent = Math.ceil(this.respawnTime);
    }

    if (this.respawnTime <= 0) {
      this.respawn();
    }
  }

  respawn() {
    this.isAlive = true;
    this.health = this.maxHealth;
    this.bodyTemperature = 37.0;
    this.mesh.visible = true;

    // Reset position to random spawn location
    this.setRandomSpawnPosition();
    this.velocity.set(0, 0, 0);

    // Hide respawn screen
    document.getElementById("respawnScreen").style.display = "none";

    console.log("Player respawned!");
  }

  updateCameraPosition() {
    // Position camera at player's eye level
    const eyePosition = this.position.clone();
    eyePosition.y += 1.7;

    this.camera.position.copy(eyePosition);
    this.camera.rotation.copy(this.rotation);
  }

  takeDamage(amount) {
    if (!this.isAlive) return;

    this.bodyTemperature -= amount;
    this.health = Math.max(0, (this.bodyTemperature - 32) * (100 / 5));

    console.log(
      `Player took ${amount} damage! Temperature: ${this.bodyTemperature.toFixed(
        1
      )}°C`
    );
  }
}
