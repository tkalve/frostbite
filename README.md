# Frostbite

Frostbite is a 3D online multiplayer snowball fighting game. Players can walk around a snowy world, see each other in real time, throw snowballs, and compete to stay warm. The game features:

- Real-time multiplayer (SignalR backend)
- 3D graphics (Three.js frontend)
- Unique gamer tags and player colors
- Health/temperature system (Celsius)
- Respawn mechanics
- Dockerized client and server for production

First version built in a couple of hours during a vibe coding session, have a look at the [agent log](agent-log.md).

> **Disclaimer:** The Frostbite name used in this project is in no way affiliated with or endorsed by the Frostbite game engine or Electronic Arts. This project is an independent creation and has no association with Electronic Arts or its products.

## Getting Started (Local Development)

### Prerequisites

- Node.js (v18+ recommended)
- .NET 8 SDK
- (Optional) Docker & Docker Compose

---

## 1. Backend server (ASP.NET Core web api with SignalR Hub)

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

## 2. Frontend client (Vite + Three.js)

```
cd client
# Install dependencies
yarn
# Start the dev server (default: http://localhost:3000 or 3001)
yarn dev
```

Open your browser at the printed local address. Open multiple tabs/windows to test multiplayer.

---

## 3. Running with Docker or Docker compose

You can run the frontend using Docker for a production-like environment. Make sure Docker is installed and running.

### Build and run the backend server

```sh
cd backend
docker build -t frostbite-backend .
docker run -p 8000:8080 frostbite-backend
```

The backend will be available at [http://localhost:8000](http://localhost:8000).

### Build and run the frontend client

From the project root:

```sh
cd client
docker build -t frostbite-client .
docker run -p 8001:8080 frostbite-client
```

The game will be available at [http://localhost:8001](http://localhost:8001).

To point the frontend client to your local backend, create the file `client/.env`:

```sh
VITE_APP_API_URL=http://localhost:5286
```

### Using Docker compose

If you want to orchestrate both backend and frontend client, you can use Docker Compose.

```sh
docker compose up --build
```

This will start both services.

The client is served using nginx with a reverse proxy making server hub available on `/hub`. Access the client at [http://localhost:8080](http://localhost:8080).

---

## 4. Game Controls

- **WASD**: Move
- **Mouse**: Look around
- **Click**: Throw snowball
- **Space**: Jump

---

## 5. Project Structure

- `client/` — Frontend client (Three.js, Vite, Docker, Nginx)
- `backend/` — Backend server (ASP.NET Core, SignalR)
- `docker-compose.yml` - Docker compose configuration file

---

## 6. Notes

- Player count and gamer tags update in real time
- Each player gets a unique color and name
- For best development experience, run both backend and frontend locally using `yarn dev` and `dotnet watch`
- For production, run backend and frontend as containers using provided Dockerfiles

---

Enjoy the snowball fight! ❄️
