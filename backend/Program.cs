using FrostbiteServer.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add SignalR
builder.Services.AddSignalR();

// Add CORS policy for local development
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrostbiteCorsPolicy", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "https://localhost:3000",
            "https://localhost:3001"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
}

// Apply CORS policy
app.UseCors("FrostbiteCorsPolicy");

// Map SignalR hub
app.MapHub<GameHub>("/hub");

Console.WriteLine("Frostbite Server starting...");
Console.WriteLine("SignalR Hub available at: /hub");

app.Run();
