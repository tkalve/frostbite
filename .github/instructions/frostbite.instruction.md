---
applyTo: "**"
---

# Frostbite Game Development Instructions

## Project Structure

- **Backend**: ASP.NET Core (.NET 9) with SignalR Hub at `/Users/thomas.kalve/Code/vibe/backend/FrostbiteServer`
- **Frontend**: Vite + Three.js client at `/Users/thomas.kalve/Code/vibe/frostbite/client`

## Development Workflow

1. Backend runs on `http://localhost:5009` with SignalR hub at `/gamehub`
2. Frontend runs on `http://localhost:3000` or `http://localhost:3001` (auto-assigned)
3. CORS is configured for both ports in `Program.cs`

## Key Commands

### Backend (from `/Users/thomas.kalve/Code/vibe/backend/FrostbiteServer`):

```bash
dotnet build
dotnet run
```

### Frontend (from `/Users/thomas.kalve/Code/vibe/frostbite/client`):

```bash
npm install
npm run dev
```

## Architecture Notes

- **SignalR Hub**: `GameHub.cs` handles real-time multiplayer communication
- **NetworkManager.js**: Frontend SignalR client wrapper
- **Player sync**: Position, rotation, health, snowball throws
- **Game loop**: 60fps with network updates on movement/stat changes

## CORS Configuration

Always include both development ports in CORS policy:

- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

## Temperature System

- Uses Celsius (37°C = healthy, 32°C = frozen)
- Health = (bodyTemperature - 32) \* (100 / 5)

## Multiplayer Features

- Real-time player movement sync
- Snowball throwing and hit detection
- Player join/leave events
- Temperature/health synchronization
- Respawn system (5 second countdown)

## Common Issues

1. **Port conflicts**: Kill processes with `lsof -ti:5009 | xargs kill -9`
2. **CORS errors**: Update Program.cs to include current frontend port
3. **SignalR connection**: Check NetworkManager.js serverUrl matches backend port

## File Structure

```
/Users/thomas.kalve/Code/vibe/
├── backend/FrostbiteServer/
│   ├── Program.cs (CORS + SignalR config)
│   ├── Hubs/GameHub.cs (multiplayer logic)
│   └── Models/GameModels.cs (data models)
└── frostbite/client/
    ├── src/game/
    │   ├── Game.js (main game controller)
    │   ├── Player.js (local player + network sync)
    │   ├── NetworkManager.js (SignalR client)
    │   ├── World.js (3D environment)
    │   └── UI.js (user interface)
    └── package.json
```
