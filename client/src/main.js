import * as THREE from "three";
import { Game } from "./game/Game.js";

// Initialize the game when the page loads
window.addEventListener("DOMContentLoaded", () => {
  const gameContainer = document.getElementById("gameContainer");
  const game = new Game(gameContainer);

  // Start the game
  game.start();

  // Handle window resize
  window.addEventListener("resize", () => {
    game.onWindowResize();
  });

  // Pointer lock for mouse look
  gameContainer.addEventListener("click", () => {
    gameContainer.requestPointerLock();
  });

  // Handle pointer lock changes
  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === gameContainer) {
      game.enableMouseLook();
    } else {
      game.disableMouseLook();
    }
  });
});
