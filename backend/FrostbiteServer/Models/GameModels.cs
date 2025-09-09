namespace FrostbiteServer.Models;

public class Vector3
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }

    public Vector3() { }

    public Vector3(float x, float y, float z)
    {
        X = x;
        Y = y;
        Z = z;
    }
}

public class PlayerPosition
{
    public Vector3 Position { get; set; } = new();
    public Vector3 Rotation { get; set; } = new();
    public bool IsGrounded { get; set; }
    public string Timestamp { get; set; } = string.Empty;
}

public class PlayerData
{
    public string PlayerId { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty;
    public PlayerPosition Position { get; set; } = new();
    public float BodyTemperature { get; set; } = 37.0f;
    public float Health { get; set; } = 100.0f;
    public bool IsAlive { get; set; } = true;
    public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
}

public class SnowballData
{
    public string SnowballId { get; set; } = string.Empty;
    public string PlayerId { get; set; } = string.Empty;
    public Vector3 Position { get; set; } = new();
    public Vector3 Velocity { get; set; } = new();
    public DateTime ThrowTime { get; set; }
    public float Lifetime { get; set; } = 5.0f;
}
