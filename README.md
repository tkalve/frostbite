# Frostbite

Frostbite is a 3D online multiplayer snowball fighting game. Players can walk around a snowy world, see each other in real time, throw snowballs, and compete to stay warm. The game features:

- Real-time multiplayer (SignalR backend)
- 3D graphics (Three.js frontend)
- Unique gamer tags and player colors
- Health/temperature system (Celsius)
- Respawn mechanics
- Dockerized frontend for production

## Getting Started (Local Development)

### Prerequisites

- Node.js (v18+ recommended)
- .NET 8 SDK
- (Optional) Docker & Docker Compose

---

## 1. Backend (SignalR Server)

```
cd backend/FrostbiteServer
# Restore dependencies
 dotnet restore
# Run the server (default port: 5286)
 dotnet run
```

The backend will start and listen for SignalR connections at:

- http://localhost:5286/gamehub

---

## 2. Frontend (Vite + Three.js)

```
cd client
# Install dependencies
npm install
# Start the dev server (default: http://localhost:3000 or 3001)
npm run dev
```

Open your browser at the printed local address. Open multiple tabs/windows to test multiplayer.

---

## 3. Production Frontend (Docker + Nginx)

```
cd client
# Build and run with Docker Compose
# (Serves frontend at http://localhost:3000)
docker-compose up -d --build
```

---

## 4. Game Controls

- **WASD**: Move
- **Mouse**: Look around
- **Click**: Throw snowball
- **Space**: Jump

---

## 5. Project Structure

- `client/` — Frontend (Three.js, Vite, Docker, Nginx)
- `backend/FrostbiteServer/` — Backend (ASP.NET Core, SignalR)

---

## 6. Notes

- Player count and gamer tags update in real time
- Each player gets a unique color and name
- For best experience, run both backend and frontend locally
- For production, use the Dockerized frontend

---

Enjoy the snowball fight! ❄️
