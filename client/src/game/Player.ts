import * as THREE from "three";
import { NetworkManager } from "./NetworkManager";

interface Snowball {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  age: number;
}

interface MoveInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

interface MouseInput {
  x: number;
  y: number;
}

export class Player {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public networkManager: NetworkManager | null;
  public mesh!: THREE.Mesh;

  // Player properties
  public position: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public rotation: THREE.Euler = new THREE.Euler(0, 0, 0);

  // Player stats
  public health: number = 100;
  public maxHealth: number = 100;
  public bodyTemperature: number = 37.0; // Normal body temperature in Celsius
  public isAlive: boolean = true;
  public respawnTime: number = 0;

  // Movement properties
  public speed: number = 5;
  public jumpPower: number = 8;
  public isGrounded: boolean = true;
  public gravity: number = -20;

  // Look sensitivity
  public mouseSensitivity: number = 0.002;

  // Snowball properties
  public snowballs: Snowball[] = [];
  public snowballCooldown: number = 0;
  public snowballCooldownTime: number = 0.5;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    networkManager: NetworkManager | null = null
  ) {
    this.scene = scene;
    this.camera = camera;
    this.networkManager = networkManager;

    // Set initial spawn position within limited area
    this.setRandomSpawnPosition();

    this.init();
  }

  // Generate random spawn position within a 10x10 area
  setRandomSpawnPosition(): void {
    const spawnRange = 5; // 5 units in each direction from center
    const x = (Math.random() - 0.5) * 2 * spawnRange; // Random between -5 and 5
    const z = (Math.random() - 0.5) * 2 * spawnRange; // Random between -5 and 5
    this.position.set(x, 1, z);
  }

  init(): void {
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

  update(
    deltaTime: number,
    moveInput: MoveInput,
    mouseInput: MouseInput
  ): void {
    if (!this.isAlive) {
      this.handleRespawn(deltaTime);
      return;
    }

    // Handle mouse look
    if (mouseInput.x !== 0 || mouseInput.y !== 0) {
      // Only apply horizontal rotation (yaw) to player rotation
      this.rotation.y -= mouseInput.x * this.mouseSensitivity;

      // Apply vertical rotation (pitch) directly to camera
      this.rotation.x -= mouseInput.y * this.mouseSensitivity;

      // Clamp vertical rotation to prevent over-rotation
      this.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, this.rotation.x)
      );

      // Keep roll at zero to prevent leaning
      this.rotation.z = 0;
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

    // Simulate temperature loss over time (gameplay mechanic)
    // Disable by setting VITE_APP_HYPOTHERMIA=false in .env
    if (import.meta.env.VITE_APP_HYPOTHERMIA !== "false") {
      this.bodyTemperature -= deltaTime * 0.1;
      this.health = Math.max(0, (this.bodyTemperature - 32) * (100 / 5)); // 32°C = 0 health, 37°C = 100 health

      // Check if player is "frozen out"
      if (this.health <= 0 && this.isAlive) {
        this.freeze();
      }
    }
  }

  handleMovement(_deltaTime: number, moveInput: MoveInput): void {
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

  jump(): void {
    if (this.isGrounded && this.isAlive) {
      this.velocity.y = this.jumpPower;
      this.isGrounded = false;
    }
  }

  throwSnowball(): void {
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

  createSnowball(): Snowball {
    const geometry = new THREE.SphereGeometry(0.1, 8, 6);
    const material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Position at camera/player position
    const startPosition = this.camera.position.clone();
    mesh.position.copy(startPosition);

    // Calculate direction based on camera rotation
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    direction.normalize();

    const snowball: Snowball = {
      mesh: mesh,
      velocity: direction.multiplyScalar(20),
      lifetime: 5.0,
      age: 0,
    };

    return snowball;
  }

  updateSnowballs(deltaTime: number): void {
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

  freeze(): void {
    this.isAlive = false;
    this.respawnTime = 5.0; // 5 second respawn time
    this.mesh.visible = false;

    // Show respawn screen
    const respawnScreen = document.getElementById("respawnScreen");
    if (respawnScreen) {
      respawnScreen.style.display = "flex";
    }

    console.log("Player frozen out! Respawning in 5 seconds...");
  }

  handleRespawn(deltaTime: number): void {
    this.respawnTime -= deltaTime;

    // Update respawn timer UI
    const timerElement = document.getElementById("respawnTimer");
    if (timerElement) {
      timerElement.textContent = Math.ceil(this.respawnTime).toString();
    }

    if (this.respawnTime <= 0) {
      this.respawn();
    }
  }

  respawn(): void {
    this.isAlive = true;
    this.health = this.maxHealth;
    this.bodyTemperature = 37.0;
    this.mesh.visible = true;

    // Reset position to random spawn location
    this.setRandomSpawnPosition();
    this.velocity.set(0, 0, 0);

    // Hide respawn screen
    const respawnScreen = document.getElementById("respawnScreen");
    if (respawnScreen) {
      respawnScreen.style.display = "none";
    }

    console.log("Player respawned!");
  }

  updateCameraPosition(): void {
    // Position camera at player's eye level
    const eyePosition = this.position.clone();
    eyePosition.y += 1.7;

    this.camera.position.copy(eyePosition);

    // Apply rotations separately for proper FPS camera
    // Only apply yaw (Y) and pitch (X), no roll (Z)
    this.camera.rotation.order = "YXZ"; // Set rotation order
    this.camera.rotation.set(this.rotation.x, this.rotation.y, 0);
  }

  takeDamage(amount: number): void {
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
