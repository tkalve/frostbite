export class UI {
  constructor() {
    this.temperatureElement = document.getElementById("temperature");
    this.playerCountElement = document.getElementById("playerCount");
    this.healthFillElement = document.getElementById("healthFill");
    this.respawnScreenElement = document.getElementById("respawnScreen");
    this.respawnTimerElement = document.getElementById("respawnTimer");
    this.playerNameElement = document.getElementById("playerName");
  }

  update(player) {
    // Update temperature display
    if (this.temperatureElement) {
      this.temperatureElement.textContent = `${player.bodyTemperature.toFixed(
        1
      )}°C`;

      // Change color based on temperature (Celsius)
      if (player.bodyTemperature < 33) {
        this.temperatureElement.style.color = "#ff4444";
      } else if (player.bodyTemperature < 35) {
        this.temperatureElement.style.color = "#ffaa44";
      } else {
        this.temperatureElement.style.color = "#44ff44";
      }
    }

    // Update health bar
    if (this.healthFillElement) {
      const healthPercent = (player.health / player.maxHealth) * 100;
      this.healthFillElement.style.width = `${healthPercent}%`;
    }
  }

  updatePlayerName(playerName) {
    if (this.playerNameElement) {
      this.playerNameElement.textContent = playerName;
    }
  }

  updatePlayerCount(count) {
    if (this.playerCountElement) {
      this.playerCountElement.textContent = count.toString();
    }
  }

  showRespawnScreen(timeRemaining) {
    if (this.respawnScreenElement) {
      this.respawnScreenElement.style.display = "flex";
    }

    if (this.respawnTimerElement) {
      this.respawnTimerElement.textContent = Math.ceil(timeRemaining);
    }
  }

  hideRespawnScreen() {
    if (this.respawnScreenElement) {
      this.respawnScreenElement.style.display = "none";
    }
  }

  showMessage(message, duration = 3000) {
    // Create a temporary message element
    const messageElement = document.createElement("div");
    messageElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 18px;
            z-index: 1000;
            pointer-events: none;
        `;
    messageElement.textContent = message;

    document.body.appendChild(messageElement);

    // Remove after duration
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, duration);
  }
}
