import * as signalR from "@microsoft/signalr";

export class NetworkManager {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.playerId = null;
    this.otherPlayers = new Map();
    this.eventHandlers = new Map();

    this.serverUrl = `${import.meta.env.VITE_APP_API_URL || ""}/hub`;
  }

  async connect() {
    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.serverUrl)
        .withAutomaticReconnect()
        .build();

      this.setupEventHandlers();

      await this.connection.start();
      this.isConnected = true;
      this.playerId = this.connection.connectionId;

      console.log("Connected to game server:", this.playerId);
      return true;
    } catch (error) {
      console.error("Failed to connect to server:", error);
      return false;
    }
  }

  setupEventHandlers() {
    // Handle own player connection data
    this.connection.on("PlayerConnected", (playerData) => {
      console.log("Received own player data:", playerData);
      this.emit("playerConnected", playerData);
    });

    // Handle initial players list
    this.connection.on("PlayersUpdate", (players) => {
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
    this.connection.on("PlayerJoined", (player) => {
      console.log("Player joined:", player);
      this.otherPlayers.set(player.playerId, player);
      this.emit("playerJoined", player);
    });

    // Handle player leaving
    this.connection.on("PlayerLeft", (playerId) => {
      console.log("Player left:", playerId);
      this.otherPlayers.delete(playerId);
      this.emit("playerLeft", playerId);
    });

    // Handle player position updates
    this.connection.on("PlayerPositionUpdate", (playerId, position) => {
      if (this.otherPlayers.has(playerId)) {
        this.otherPlayers.get(playerId).position = position;
        this.emit("playerPositionUpdate", { playerId, position });
      }
    });

    // Handle player stats updates
    this.connection.on(
      "PlayerStatsUpdate",
      (playerId, bodyTemperature, health, isAlive) => {
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

    // Handle snowball throws
    this.connection.on("SnowballThrown", (snowball) => {
      console.log("Snowball thrown:", snowball);
      this.emit("snowballThrown", snowball);
    });

    // Handle snowball hits
    this.connection.on(
      "SnowballHit",
      (snowballId, targetPlayerId, damage, health) => {
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
    this.connection.on("SnowballRemoved", (snowballId) => {
      this.emit("snowballRemoved", snowballId);
    });

    // Handle player respawn
    this.connection.on("PlayerRespawned", (playerId, player) => {
      console.log("Player respawned:", playerId);
      this.otherPlayers.set(playerId, player);
      this.emit("playerRespawned", { playerId, player });
    });

    // Handle player count
    this.connection.on("PlayerCount", (count) => {
      this.emit("playerCount", count);
    });
  }

  // Send player position update
  async sendPlayerPosition(position, rotation, isGrounded) {
    if (!this.isConnected) return;

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
  async sendPlayerStats(bodyTemperature, health, isAlive) {
    if (!this.isConnected) return;

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
  async sendSnowballThrow(position, velocity) {
    if (!this.isConnected) return;

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
  async sendSnowballHit(snowballId, targetPlayerId, damage) {
    if (!this.isConnected) return;

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
  async sendPlayerRespawn() {
    if (!this.isConnected) return;

    try {
      await this.connection.invoke("PlayerRespawn");
    } catch (error) {
      console.error("Failed to send respawn:", error);
    }
  }

  // Request player count
  async requestPlayerCount() {
    if (!this.isConnected) return;

    try {
      await this.connection.invoke("GetPlayerCount");
    } catch (error) {
      console.error("Failed to get player count:", error);
    }
  }

  // Event system for the game to subscribe to network events
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error("Error in event handler:", error);
        }
      });
    }
  }

  disconnect() {
    if (this.connection) {
      this.connection.stop();
      this.isConnected = false;
      this.playerId = null;
      this.otherPlayers.clear();
    }
  }
}
