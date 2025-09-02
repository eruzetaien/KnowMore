using System.Security.Claims;
using System.Text.Json;
using DotNetEnv;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Load .env variables
Env.Load();

builder.Services.AddSignalR();
builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect("localhost"));
builder.Services.AddHttpClient();

builder.Services
    .AddDatabase<FactDb>()
    .AddJwtAuth()
    .AddCustomCors();

var app = builder.Build();

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<GameHub>("/gamehub")
   .RequireAuthorization();

app.MapPost("/rooms", async (ClaimsPrincipal userClaim, CreateRoomDto createDto, IConnectionMultiplexer redis) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    var db = redis.GetDatabase();

    string joinCode = Guid.NewGuid().ToString("N")[..6].ToUpper();

    string key = joinCode;
    Room room = new()
    {
        JoinCode = joinCode,
        Name = createDto.Name,
        RoomMaster = userId,
        SecondPlayer = 0
    };

    string roomJson = JsonSerializer.Serialize(room);
    await db.StringSetAsync(joinCode, roomJson);
    await db.KeyExpireAsync(key, TimeSpan.FromMinutes(10));

    return Results.Ok(new
    {
        joinCode,
        name = createDto.Name
    });
})
.RequireAuthorization()
.AddEndpointFilter<ValidationFilter<CreateRoomDto>>();

app.Run();
