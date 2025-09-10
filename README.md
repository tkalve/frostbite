# Frostbite

Frostbite is a 3D online multiplayer snowball fighting game. Players can walk around a snowy world, see each other in real time, throw snowballs, and compete to stay warm. The game features:

- Real-time multiplayer (SignalR backend)
- 3D graphics (Three.js frontend)
- Unique gamer tags and player colors
- Health/temperature system (Celsius)
- Respawn mechanics
- Dockerized frontend for production

> **Disclaimer:** The Frostbite name used in this project is in no way affiliated with or endorsed by the Frostbite game engine or Electronic Arts. This project is an independent creation and has no association with Electronic Arts or its products.

## Getting Started (Local Development)

### Prerequisites

- Node.js (v18+ recommended)
- .NET 8 SDK
- (Optional) Docker & Docker Compose

---

## 1. Backend (ASP.NET Core server with SignalR Hub)

```
cd backend
# Restore dependencies
dotnet restore
# Run the server (default port: 5286)
dotnet run
```

The backend will start and listen for SignalR connections at:

- http://localhost:5286/hub

---

## 2. Frontend (Vite + Three.js)

```
cd client
# Install dependencies
yarn
# Start the dev server (default: http://localhost:3000 or 3001)
yarn dev
```

Open your browser at the printed local address. Open multiple tabs/windows to test multiplayer.

---

## 3. Game Controls

- **WASD**: Move
- **Mouse**: Look around
- **Click**: Throw snowball
- **Space**: Jump

---

## 4. Project Structure

- `client/` — Frontend (Three.js, Vite, Docker, Nginx)
- `backend/` — Backend (ASP.NET Core, SignalR)

---

## 5. Notes

- Player count and gamer tags update in real time
- Each player gets a unique color and name
- For best experience, run both backend and frontend locally
- For production, use the Dockerized frontend

---

Enjoy the snowball fight! ❄️
