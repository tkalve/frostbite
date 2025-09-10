import React, { useEffect, useRef } from "react";
import "./Game.css";

const Game: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize the 3D game when the component mounts
    const initGame = async () => {
      if (gameContainerRef.current) {
        const { Game } = (await import("../game/Game")) as any;
        const game = new Game(gameContainerRef.current);

        // Start the game
        game.start();

        // Handle window resize
        const handleResize = () => {
          game.onWindowResize();
        };
        window.addEventListener("resize", handleResize);

        // Pointer lock for mouse look
        const handleClick = () => {
          gameContainerRef.current?.requestPointerLock();
        };
        gameContainerRef.current.addEventListener("click", handleClick);

        // Handle pointer lock changes
        const handlePointerLockChange = () => {
          if (document.pointerLockElement === gameContainerRef.current) {
            game.enableMouseLook();
          } else {
            game.disableMouseLook();
          }
        };
        document.addEventListener("pointerlockchange", handlePointerLockChange);

        // Cleanup function
        return () => {
          window.removeEventListener("resize", handleResize);
          gameContainerRef.current?.removeEventListener("click", handleClick);
          document.removeEventListener(
            "pointerlockchange",
            handlePointerLockChange
          );
        };
      }
    };

    initGame();
  }, []);

  return (
    <div ref={gameContainerRef} className="game-container">
      <div className="ui">
        <h2>Frostbite</h2>
        <div>
          Player: <span id="playerName">Connecting...</span>
        </div>
        <div>
          Body Temperature: <span id="temperature">37.0°C</span>
        </div>
        <div>
          Players Online: <span id="playerCount">1</span>
        </div>
      </div>

      <div className="health-bar">
        <div id="healthFill" className="health-fill"></div>
      </div>

      <div className="crosshair"></div>

      <div className="controls">
        <div>
          <strong>Controls:</strong>
        </div>
        <div>WASD - Move</div>
        <div>Mouse - Look around</div>
        <div>Click - Throw snowball</div>
        <div>Space - Jump</div>
      </div>

      <div id="respawnScreen" className="respawn-screen">
        <div>You've been frozen out!</div>
        <div className="respawn-timer" id="respawnTimer">
          5
        </div>
        <div>Warming up for respawn...</div>
      </div>
    </div>
  );
};

export default Game;
