import * as signalR from "@microsoft/signalr";
import * as THREE from "three";

type EventHandler = (data?: any) => void;

export class NetworkManager {
  public connection: signalR.HubConnection | null = null;
  public isConnected: boolean = false;
  public playerId: string | null = null;
  public otherPlayers: Map<string, any> = new Map();
  public eventHandlers: Map<string, EventHandler[]> = new Map();
  public preferredGamerTag: string | null = null;
  public serverUrl: string;

  constructor() {
    this.serverUrl = `${import.meta.env.VITE_APP_API_URL || ""}/hub`;

    // Generate or retrieve gamer tag for this session
    this.initializeGamerTag();
  }

  // Generate or retrieve gamer tag per browser tab
  initializeGamerTag(): void {
    // Check if this tab already has a gamer tag
    let storedTag = sessionStorage.getItem("frostbite_gamer_tag");

    if (storedTag) {
      this.preferredGamerTag = storedTag;
      console.log("Retrieved gamer tag from session:", this.preferredGamerTag);
    } else {
      // Generate new gamer tag for this tab
      this.preferredGamerTag = this.generateRandomGamerTag();
      sessionStorage.setItem("frostbite_gamer_tag", this.preferredGamerTag);
      console.log(
        "Generated new gamer tag for session:",
        this.preferredGamerTag
      );
    }
  }

  // Generate random gamer tag (client-side version)
  generateRandomGamerTag(): string {
    const adjectives = [
      "Arctic",
      "Frozen",
      "Icy",
      "Snow",
      "Frost",
      "Winter",
      "Cold",
      "Blizzard",
      "Polar",
      "Glacial",
      "Chilly",
      "Cool",
      "Sharp",
      "Swift",
      "Silent",
      "Mighty",
    ];

    const nouns = [
      "Wolf",
      "Bear",
      "Eagle",
      "Hunter",
      "Warrior",
      "Scout",
      "Ranger",
      "Guardian",
      "Storm",
      "Thunder",
      "Lightning",
      "Shadow",
      "Blade",
      "Arrow",
      "Shield",
      "Sword",
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 90) + 10; // 10-99

    return `${adjective}${noun}${number}`;
  }

  async connect(): Promise<boolean> {
    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.serverUrl)
        .withAutomaticReconnect()
        .build();

      this.setupEventHandlers();

      await this.connection.start();
      this.isConnected = true;
      this.playerId = this.connection.connectionId;

      // Send preferred gamer tag to server
      await this.sendPreferredGamerTag();

      console.log("Connected to game server:", this.playerId);
      return true;
    } catch (error) {
      console.error("Failed to connect to server:", error);
      return false;
    }
  }

  setupEventHandlers(): void {
    if (!this.connection) return;

    // Handle own player connection data
    this.connection.on("PlayerConnected", (playerData: any) => {
      console.log("Received own player data:", playerData);
      this.emit("playerConnected", playerData);
    });

    // Handle initial players list
    this.connection.on("PlayersUpdate", (players: any[]) => {
      console.log("Received players update:", players);
      this.otherPlayers.clear();
      players.forEach((player) => {
        if (player.playerId !== this.playerId) {
          this.otherPlayers.set(player.playerId, player);
        }
      });
      this.emit("playersUpdate", players);
    });

    // Handle new player joining
    this.connection.on("PlayerJoined", (player: any) => {
      console.log("Player joined:", player);
      this.otherPlayers.set(player.playerId, player);
      this.emit("playerJoined", player);
    });

    // Handle player leaving
    this.connection.on("PlayerLeft", (playerId: string) => {
      console.log("Player left:", playerId);
      this.otherPlayers.delete(playerId);
      this.emit("playerLeft", playerId);
    });

    // Handle player position updates
    this.connection.on(
      "PlayerPositionUpdate",
      (playerId: string, position: any) => {
        if (this.otherPlayers.has(playerId)) {
          this.otherPlayers.get(playerId).position = position;
          this.emit("playerPositionUpdate", { playerId, position });
        }
      }
    );

    // Handle player stats updates
    this.connection.on(
      "PlayerStatsUpdate",
      (
        playerId: string,
        bodyTemperature: number,
        health: number,
        isAlive: boolean
      ) => {
        if (this.otherPlayers.has(playerId)) {
          const player = this.otherPlayers.get(playerId);
          player.bodyTemperature = bodyTemperature;
          player.health = health;
          player.isAlive = isAlive;
          this.emit("playerStatsUpdate", {
            playerId,
            bodyTemperature,
            health,
            isAlive,
          });
        }
      }
    );

    // Handle player name updates
    this.connection.on(
      "PlayerNameUpdate",
      (playerId: string, playerName: string) => {
        console.log("Player name updated:", playerId, playerName);

        // Update the player's name in our local data
        if (this.otherPlayers.has(playerId)) {
          this.otherPlayers.get(playerId).playerName = playerName;
        }

        // If this is our own player, update our stored gamer tag
        if (playerId === this.playerId) {
          this.preferredGamerTag = playerName;
          // Update sessionStorage with the confirmed name
          sessionStorage.setItem("frostbite_gamer_tag", playerName);
        }

        this.emit("playerNameUpdate", { playerId, playerName });
      }
    );

    // Handle snowball throws
    this.connection.on("SnowballThrown", (snowball: any) => {
      console.log("Snowball thrown:", snowball);
      this.emit("snowballThrown", snowball);
    });

    // Handle snowball hits
    this.connection.on(
      "SnowballHit",
      (
        snowballId: string,
        targetPlayerId: string,
        damage: number,
        health: number
      ) => {
        console.log("Snowball hit:", {
          snowballId,
          targetPlayerId,
          damage,
          health,
        });
        this.emit("snowballHit", {
          snowballId,
          targetPlayerId,
          damage,
          health,
        });
      }
    );

    // Handle snowball removal
    this.connection.on("SnowballRemoved", (snowballId: string) => {
      this.emit("snowballRemoved", snowballId);
    });

    // Handle player respawn
    this.connection.on("PlayerRespawned", (playerId: string, player: any) => {
      console.log("Player respawned:", playerId);
      this.otherPlayers.set(playerId, player);
      this.emit("playerRespawned", { playerId, player });
    });

    // Handle player count
    this.connection.on("PlayerCount", (count: number) => {
      this.emit("playerCount", count);
    });
  }

  // Send preferred gamer tag to server
  async sendPreferredGamerTag(): Promise<void> {
    if (!this.isConnected || !this.connection) return;

    try {
      await this.connection.invoke(
        "SetPreferredGamerTag",
        this.preferredGamerTag
      );
      console.log(
        "Sent preferred gamer tag to server:",
        this.preferredGamerTag
      );
    } catch (error) {
      console.error("Failed to send preferred gamer tag:", error);
    }
  }

  // Send player position update
  async sendPlayerPosition(
    position: THREE.Vector3,
    rotation: THREE.Euler,
    isGrounded: boolean
  ): Promise<void> {
    if (!this.isConnected || !this.connection) return;

    try {
      await this.connection.invoke("UpdatePlayerPosition", {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
        isGrounded: isGrounded,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to send position:", error);
    }
  }

  // Send player stats update
  async sendPlayerStats(
    bodyTemperature: number,
    health: number,
    isAlive: boolean
  ): Promise<void> {
    if (!this.isConnected || !this.connection) return;

    try {
      await this.connection.invoke(
        "UpdatePlayerStats",
        bodyTemperature,
        health,
        isAlive
      );
    } catch (error) {
      console.error("Failed to send stats:", error);
    }
  }

  // Send snowball throw
  async sendSnowballThrow(
    position: THREE.Vector3,
    velocity: THREE.Vector3
  ): Promise<void> {
    if (!this.isConnected || !this.connection) return;

    try {
      await this.connection.invoke("ThrowSnowball", {
        position: { x: position.x, y: position.y, z: position.z },
        velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
        throwTime: new Date().toISOString(),
        lifetime: 5.0,
      });
    } catch (error) {
      console.error("Failed to send snowball:", error);
    }
  }

  // Send snowball hit
  async sendSnowballHit(
    snowballId: string,
    targetPlayerId: string,
    damage: number
  ): Promise<void> {
    if (!this.isConnected || !this.connection) return;

    try {
      await this.connection.invoke(
        "SnowballHit",
        snowballId,
        targetPlayerId,
        damage
      );
    } catch (error) {
      console.error("Failed to send snowball hit:", error);
    }
  }

  // Send player respawn
  async sendPlayerRespawn(): Promise<void> {
    if (!this.isConnected || !this.connection) return;

    try {
      await this.connection.invoke("PlayerRespawn");
    } catch (error) {
      console.error("Failed to send respawn:", error);
    }
  }

  // Request player count
  async requestPlayerCount(): Promise<void> {
    if (!this.isConnected || !this.connection) return;

    try {
      await this.connection.invoke("GetPlayerCount");
    } catch (error) {
      console.error("Failed to get player count:", error);
    }
  }

  // Event system for the game to subscribe to network events
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: EventHandler): void {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any): void {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event)!.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error("Error in event handler:", error);
        }
      });
    }
  }

  disconnect(): void {
    if (this.connection) {
      this.connection.stop();
      this.isConnected = false;
      this.playerId = null;
      this.otherPlayers.clear();
    }
  }
}
