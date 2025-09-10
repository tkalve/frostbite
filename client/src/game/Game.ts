import * as THREE from "three";
import { Player } from "./Player";
import { World } from "./World";
import { UI } from "./UI";
import { NetworkManager } from "./NetworkManager";

interface OtherPlayer {
  mesh: THREE.Mesh;
  nameTag: THREE.Mesh;
  data: any;
  color: number;
}

interface NetworkSnowball {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  startTime: number;
}

interface KeysState {
  [key: string]: boolean;
}

interface MouseState {
  x: number;
  y: number;
}

interface MoveInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

export class Game {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public clock: THREE.Clock;
  public isRunning: boolean = false;
  public mouseLookEnabled: boolean = false;

  // Game objects
  public player: Player | null = null;
  public world: World | null = null;
  public ui: UI | null = null;
  public networkManager: NetworkManager | null = null;
  public otherPlayers: Map<string, OtherPlayer> = new Map();
  public networkSnowballs: Map<string, NetworkSnowball> = new Map();

  // Input handling
  public keys: KeysState = {};
  public mouse: MouseState = { x: 0, y: 0 };

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.clock = new THREE.Clock();

    this.init();
  }

  init(): void {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87ceeb, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Setup scene lighting
    this.setupLighting();

    // Create game objects
    this.world = new World(this.scene);
    this.networkManager = new NetworkManager();
    this.player = new Player(this.scene, this.camera, this.networkManager);
    this.ui = new UI();

    // Setup input handlers
    this.setupInputHandlers();

    // Setup network events
    this.setupNetworkEvents();

    // Position camera at player
    this.camera.position.copy(this.player.position);
    this.camera.position.y += 1.7; // Eye height
  }

  setupLighting(): void {
    // Ambient light for overall illumination - brighter for snow scenes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Directional light (sun) - stronger for bright snow reflection
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);
  }

  setupInputHandlers(): void {
    // Keyboard input
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      this.keys[event.code] = true;

      // Handle space for jumping
      if (event.code === "Space") {
        event.preventDefault();
        this.player?.jump();
      }
    });

    document.addEventListener("keyup", (event: KeyboardEvent) => {
      this.keys[event.code] = false;
    });

    // Mouse input
    document.addEventListener("mousemove", (event: MouseEvent) => {
      if (this.mouseLookEnabled) {
        this.mouse.x = event.movementX || 0;
        this.mouse.y = event.movementY || 0;
      }
    });

    // Mouse click for snowball throwing
    document.addEventListener("click", (event: MouseEvent) => {
      if (this.mouseLookEnabled) {
        this.player?.throwSnowball();
      }
    });
  }

  setupNetworkEvents(): void {
    if (!this.networkManager) return;

    // Handle own player connection data
    this.networkManager.on("playerConnected", (playerData: any) => {
      console.log("Received own player data:", playerData);
      this.ui?.updatePlayerName(playerData.playerName);
    });

    // Handle initial players list when connecting
    this.networkManager.on("playersUpdate", (players: any[]) => {
      console.log("Received initial players list:", players);
      players.forEach((player) => {
        if (player.playerId !== this.networkManager?.playerId) {
          this.createOtherPlayer(player);
        }
      });
    });

    // Handle other players joining
    this.networkManager.on("playerJoined", (player: any) => {
      console.log("Player joined event:", player);
      this.createOtherPlayer(player);
    });

    // Handle other players leaving
    this.networkManager.on("playerLeft", (playerId: string) => {
      this.removeOtherPlayer(playerId);
    });

    // Handle other players position updates
    this.networkManager.on(
      "playerPositionUpdate",
      ({ playerId, position }: { playerId: string; position: any }) => {
        this.updateOtherPlayerPosition(playerId, position);
      }
    );

    // Handle snowball throws from other players
    this.networkManager.on("snowballThrown", (snowball: any) => {
      this.createNetworkSnowball(snowball);
    });

    // Handle snowball removal
    this.networkManager.on("snowballRemoved", (snowballId: string) => {
      this.removeNetworkSnowball(snowballId);
    });

    // Handle player count updates
    this.networkManager.on("playerCount", (count: number) => {
      this.ui?.updatePlayerCount(count);
    });

    // Handle player name updates
    this.networkManager.on(
      "playerNameUpdate",
      ({ playerId, playerName }: { playerId: string; playerName: string }) => {
        console.log("Player name update event:", playerId, playerName);

        // If this is our own player, update the UI
        if (playerId === this.networkManager?.playerId) {
          this.ui?.updatePlayerName(playerName);
        }

        // Update the name tag for other players
        if (this.otherPlayers.has(playerId)) {
          const player = this.otherPlayers.get(playerId)!;
          player.data.playerName = playerName;

          // Recreate the name tag with the new name
          if (player.nameTag) {
            player.mesh.remove(player.nameTag);
            const newNameTag = this.createNameTag(playerName);
            newNameTag.position.set(0, 3.2, 0);
            player.mesh.add(newNameTag);
            player.nameTag = newNameTag;
          }
        }
      }
    );
  }

  createOtherPlayer(playerData: any): void {
    if (this.otherPlayers.has(playerData.playerId)) return;

    // Generate a unique color for this player based on their ID
    const playerColor = this.generatePlayerColor(playerData.playerId);

    // Create a simple representation of other player - Made larger for visibility
    const geometry = new THREE.CapsuleGeometry(0.8, 2.5, 4, 8);
    const material = new THREE.MeshLambertMaterial({ color: playerColor });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(
      playerData.position.position.x,
      playerData.position.position.y,
      playerData.position.position.z
    );

    mesh.castShadow = true;
    this.scene.add(mesh);

    // Create name tag above player (moved higher)
    const nameTag = this.createNameTag(playerData.playerName);
    nameTag.position.set(0, 3.2, 0); // Position higher above player
    mesh.add(nameTag); // Attach to player mesh so it moves with them

    this.otherPlayers.set(playerData.playerId, {
      mesh: mesh,
      nameTag: nameTag,
      data: playerData,
      color: playerColor,
    });

    console.log(
      "Created other player:",
      playerData.playerId,
      "Name:",
      playerData.playerName,
      "Color:",
      `#${playerColor.toString(16).padStart(6, "0")}`
    );
  }

  generatePlayerColor(playerId: string): number {
    // Create a consistent color based on player ID
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      const char = playerId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Generate bright, distinct colors
    const hue = Math.abs(hash) % 360;
    const saturation = 70 + (Math.abs(hash >> 8) % 30); // 70-100%
    const lightness = 50 + (Math.abs(hash >> 16) % 20); // 50-70%

    // Convert HSL to RGB
    const c = ((1 - Math.abs((2 * lightness) / 100 - 1)) * saturation) / 100;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lightness / 100 - c / 2;

    let r: number, g: number, b: number;
    if (hue >= 0 && hue < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (hue >= 60 && hue < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (hue >= 120 && hue < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (hue >= 180 && hue < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (hue >= 240 && hue < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    // Convert to 0-255 range and then to hex color
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return (r << 16) | (g << 8) | b;
  }

  createNameTag(playerName: string): THREE.Mesh {
    // Create canvas for text rendering
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;

    // Set canvas size
    canvas.width = 256;
    canvas.height = 64;

    // Draw background
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    context.fillStyle = "white";
    context.font = "bold 20px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(playerName, canvas.width / 2, canvas.height / 2);

    // Create texture and material
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
    });

    // Create plane geometry for the name tag
    const geometry = new THREE.PlaneGeometry(2, 0.5);
    const nameTag = new THREE.Mesh(geometry, material);

    // Make name tag always face the camera
    nameTag.lookAt(this.camera.position);

    return nameTag;
  }

  removeOtherPlayer(playerId: string): void {
    if (this.otherPlayers.has(playerId)) {
      const player = this.otherPlayers.get(playerId)!;
      this.scene.remove(player.mesh);
      // Name tag will be removed automatically since it's attached to the mesh
      this.otherPlayers.delete(playerId);
      console.log("Removed other player:", playerId);
    }
  }

  updateOtherPlayerPosition(playerId: string, position: any): void {
    if (this.otherPlayers.has(playerId)) {
      const player = this.otherPlayers.get(playerId)!;
      player.mesh.position.set(
        position.position.x,
        position.position.y,
        position.position.z
      );
      player.mesh.rotation.set(
        position.rotation.x,
        position.rotation.y,
        position.rotation.z
      );
    }
  }

  createNetworkSnowball(snowballData: any): void {
    if (snowballData.playerId === this.networkManager?.playerId) return; // Skip own snowballs

    const geometry = new THREE.SphereGeometry(0.1, 8, 6);
    const material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
    });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(
      snowballData.position.x,
      snowballData.position.y,
      snowballData.position.z
    );

    const velocity = new THREE.Vector3(
      snowballData.velocity.x,
      snowballData.velocity.y,
      snowballData.velocity.z
    );

    this.scene.add(mesh);
    this.networkSnowballs.set(snowballData.snowballId, {
      mesh: mesh,
      velocity: velocity,
      startTime: Date.now(),
    });

    console.log("Created network snowball:", snowballData.snowballId);
  }

  removeNetworkSnowball(snowballId: string): void {
    if (this.networkSnowballs.has(snowballId)) {
      const snowball = this.networkSnowballs.get(snowballId)!;
      this.scene.remove(snowball.mesh);
      this.networkSnowballs.delete(snowballId);
    }
  }

  async connectToServer(): Promise<boolean> {
    if (!this.networkManager) return false;

    const connected = await this.networkManager.connect();
    if (connected) {
      console.log("Connected to game server!");
      // Request initial player count
      this.networkManager.requestPlayerCount();
      return true;
    } else {
      console.error("Failed to connect to game server");
      this.ui?.showMessage(
        "Failed to connect to server. Playing offline.",
        5000
      );
      return false;
    }
  }

  enableMouseLook(): void {
    this.mouseLookEnabled = true;
  }

  disableMouseLook(): void {
    this.mouseLookEnabled = false;
    this.mouse.x = 0;
    this.mouse.y = 0;
  }

  async start(): Promise<void> {
    this.isRunning = true;

    // Connect to server
    await this.connectToServer();

    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
  }

  gameLoop(): void {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.gameLoop());

    const deltaTime = this.clock.getDelta();

    // Update game objects
    this.update(deltaTime);

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  update(deltaTime: number): void {
    if (!this.player) return;

    // Handle player input
    const moveInput: MoveInput = {
      forward: this.keys["KeyW"] || false,
      backward: this.keys["KeyS"] || false,
      left: this.keys["KeyA"] || false,
      right: this.keys["KeyD"] || false,
    };

    // Store previous player state for network updates
    const prevPosition = this.player.position.clone();
    const prevRotation = this.player.rotation.clone();
    const prevStats = {
      temperature: this.player.bodyTemperature,
      health: this.player.health,
      isAlive: this.player.isAlive,
    };

    // Update player
    this.player.update(deltaTime, moveInput, this.mouse);

    // Send network updates if connected and player moved significantly
    if (this.networkManager && this.networkManager.isConnected) {
      const positionChanged =
        prevPosition.distanceTo(this.player.position) > 0.01;
      const rotationChanged =
        Math.abs(prevRotation.y - this.player.rotation.y) > 0.01;

      if (positionChanged || rotationChanged) {
        this.networkManager.sendPlayerPosition(
          this.player.position,
          this.player.rotation,
          this.player.isGrounded
        );
      }

      // Send stats updates if they changed
      if (
        prevStats.temperature !== this.player.bodyTemperature ||
        prevStats.health !== this.player.health ||
        prevStats.isAlive !== this.player.isAlive
      ) {
        this.networkManager.sendPlayerStats(
          this.player.bodyTemperature,
          this.player.health,
          this.player.isAlive
        );
      }
    }

    // Update network snowballs
    this.updateNetworkSnowballs(deltaTime);

    // Update name tags to always face camera
    this.updateNameTags();

    // Update world
    this.world?.update(deltaTime);

    // Update UI
    this.ui?.update(this.player);

    // Reset mouse movement
    this.mouse.x = 0;
    this.mouse.y = 0;
  }

  updateNameTags(): void {
    // Make name tags always face the camera
    this.otherPlayers.forEach((player) => {
      if (player.nameTag) {
        player.nameTag.lookAt(this.camera.position);
      }
    });
  }

  updateNetworkSnowballs(deltaTime: number): void {
    for (const [snowballId, snowball] of this.networkSnowballs.entries()) {
      // Update snowball position based on velocity
      snowball.mesh.position.add(
        snowball.velocity.clone().multiplyScalar(deltaTime)
      );

      // Apply gravity
      snowball.velocity.y -= 9.8 * deltaTime;

      // Remove if hit ground or too old
      if (
        snowball.mesh.position.y < 0 ||
        Date.now() - snowball.startTime > 5000
      ) {
        this.removeNetworkSnowball(snowballId);
      }
    }
  }

  onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
