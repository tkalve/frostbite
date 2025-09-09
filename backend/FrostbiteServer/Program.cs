using FrostbiteServer.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Apply CORS policy
app.UseCors("FrostbiteCorsPolicy");

// Map SignalR hub
app.MapHub<GameHub>("/gamehub");

Console.WriteLine("Frostbite Server starting...");
Console.WriteLine("SignalR Hub available at: /gamehub");

app.Run();
