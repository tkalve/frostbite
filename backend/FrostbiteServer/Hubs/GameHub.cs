using System.Collections.Concurrent;
using FrostbiteServer.Models;
using Microsoft.AspNetCore.SignalR;

namespace FrostbiteServer.Hubs;

public class GameHub : Hub
{
    private static readonly ConcurrentDictionary<string, PlayerData> Players = new();
    private static readonly ConcurrentDictionary<string, SnowballData> ActiveSnowballs = new();

    // Random gamer tag generation
    private static readonly string[] Adjectives = {
        "Arctic", "Frozen", "Icy", "Snow", "Frost", "Winter", "Cold", "Blizzard",
        "Polar", "Glacial", "Chilly", "Cool", "Sharp", "Swift", "Silent", "Mighty"
    };

    private static readonly string[] Nouns = {
        "Wolf", "Bear", "Eagle", "Hunter", "Warrior", "Scout", "Ranger", "Guardian",
        "Storm", "Thunder", "Lightning", "Shadow", "Blade", "Arrow", "Shield", "Sword"
    };

    private static string GenerateRandomGamerTag()
    {
        var adjective = Adjectives[Random.Shared.Next(Adjectives.Length)];
        var noun = Nouns[Random.Shared.Next(Nouns.Length)];
        var number = Random.Shared.Next(10, 100);
        return $"{adjective}{noun}{number}";
    }

    public override async Task OnConnectedAsync()
    {
        var playerId = Context.ConnectionId;

        // Create new player with random spawn position (limited area)
        var spawnRange = 5f; // 5 units in each direction from center
        var randomX = (Random.Shared.NextSingle() - 0.5f) * 2 * spawnRange;
        var randomZ = (Random.Shared.NextSingle() - 0.5f) * 2 * spawnRange;

        var newPlayer = new PlayerData
        {
            PlayerId = playerId,
            PlayerName = GenerateRandomGamerTag(),
            Position = new PlayerPosition
            {
                Position = new Vector3(randomX, 1, randomZ),
                Rotation = new Vector3(0, 0, 0),
                IsGrounded = true
            }
        };

        Players.TryAdd(playerId, newPlayer);

        // Send the new player their own data
        await Clients.Caller.SendAsync("PlayerConnected", newPlayer);

        // Send current players to the new player
        await Clients.Caller.SendAsync("PlayersUpdate", Players.Values.ToList());

        // Notify all other players about the new player
        await Clients.Others.SendAsync("PlayerJoined", newPlayer);

        // Broadcast updated player count to all players
        await Clients.All.SendAsync("PlayerCount", Players.Count);

        Console.WriteLine($"Player {playerId} ({newPlayer.PlayerName}) connected. Total players: {Players.Count}");

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var playerId = Context.ConnectionId;

        if (Players.TryRemove(playerId, out var player))
        {
            // Notify all players about the disconnection
            await Clients.Others.SendAsync("PlayerLeft", playerId);

            // Broadcast updated player count to all remaining players
            await Clients.All.SendAsync("PlayerCount", Players.Count);

            Console.WriteLine($"Player {playerId} disconnected. Total players: {Players.Count}");
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task UpdatePlayerPosition(PlayerPosition position)
    {
        var playerId = Context.ConnectionId;

        if (Players.TryGetValue(playerId, out var player))
        {
            player.Position = position;
            player.LastUpdate = DateTime.UtcNow;

            // Broadcast position update to all other players
            await Clients.All.SendAsync("PlayerPositionUpdate", playerId, position);
        }
    }

    public async Task UpdatePlayerStats(float bodyTemperature, float health, bool isAlive)
    {
        var playerId = Context.ConnectionId;

        if (Players.TryGetValue(playerId, out var player))
        {
            player.BodyTemperature = bodyTemperature;
            player.Health = health;
            player.IsAlive = isAlive;
            player.LastUpdate = DateTime.UtcNow;

            // Broadcast stats update to all other players
            await Clients.Others.SendAsync("PlayerStatsUpdate", playerId, bodyTemperature, health, isAlive);
        }
    }

    public async Task ThrowSnowball(SnowballData snowball)
    {
        var playerId = Context.ConnectionId;
        snowball.PlayerId = playerId;
        snowball.SnowballId = Guid.NewGuid().ToString();
        snowball.ThrowTime = DateTime.UtcNow;

        ActiveSnowballs.TryAdd(snowball.SnowballId, snowball);

        // Broadcast snowball to all players (including sender for confirmation)
        await Clients.All.SendAsync("SnowballThrown", snowball);

        Console.WriteLine($"Player {playerId} threw snowball {snowball.SnowballId}");

        // Remove snowball after lifetime (fire and forget)
        RemoveSnowballAfterDelay(snowball.SnowballId, snowball.Lifetime);
    }

    private void RemoveSnowballAfterDelay(string snowballId, float lifetime)
    {
        Task.Run(async () =>
        {
            await Task.Delay(TimeSpan.FromSeconds(lifetime));
            if (ActiveSnowballs.TryRemove(snowballId, out _))
            {
                await Clients.All.SendAsync("SnowballRemoved", snowballId);
            }
        });
    }

    public async Task SnowballHit(string snowballId, string targetPlayerId, float damage)
    {
        var playerId = Context.ConnectionId;

        if (ActiveSnowballs.TryRemove(snowballId, out var snowball) &&
            Players.TryGetValue(targetPlayerId, out var targetPlayer))
        {
            // Apply damage to target player
            targetPlayer.BodyTemperature -= damage;
            targetPlayer.Health = Math.Max(0, (targetPlayer.BodyTemperature - 32) * (100 / 5));

            if (targetPlayer.Health <= 0 && targetPlayer.IsAlive)
            {
                targetPlayer.IsAlive = false;
            }

            // Notify all players about the hit
            await Clients.All.SendAsync("SnowballHit", snowballId, targetPlayerId, damage, targetPlayer.Health);
            await Clients.All.SendAsync("SnowballRemoved", snowballId);

            Console.WriteLine($"Snowball {snowballId} hit player {targetPlayerId} for {damage} damage");
        }
    }

    public async Task PlayerRespawn()
    {
        var playerId = Context.ConnectionId;

        if (Players.TryGetValue(playerId, out var player))
        {
            // Generate new random spawn position
            var spawnRange = 5f;
            var randomX = (Random.Shared.NextSingle() - 0.5f) * 2 * spawnRange;
            var randomZ = (Random.Shared.NextSingle() - 0.5f) * 2 * spawnRange;

            player.IsAlive = true;
            player.Health = 100f;
            player.BodyTemperature = 37.0f;
            player.Position = new PlayerPosition
            {
                Position = new Vector3(randomX, 1, randomZ),
                Rotation = new Vector3(0, 0, 0),
                IsGrounded = true
            };

            // Notify all players about the respawn
            await Clients.All.SendAsync("PlayerRespawned", playerId, player);

            Console.WriteLine($"Player {playerId} respawned");
        }
    }

    public async Task GetPlayerCount()
    {
        await Clients.Caller.SendAsync("PlayerCount", Players.Count);
    }
}
