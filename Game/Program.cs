using System.Security.Claims;
using System.Text.Json;
using DotNetEnv;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Load .env variables
Env.Load();

builder.Services.AddSignalR();
builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect("localhost"));

builder.Services
    .AddDatabase<FactDb>()
    .AddJwtAuth()
    .AddCustomCors();

builder.Services.AddHttpClient("UserService", client =>
{
    string factBaseUrl = Environment.GetEnvironmentVariable("USER_BASE_URL")
        ?? throw new InvalidOperationException("USER_BASE_URL environment variable is not set.");
    client.BaseAddress = new Uri(factBaseUrl);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.DefaultRequestHeaders.Add("X-API-KEY", Environment.GetEnvironmentVariable("API_KEY"));
});
builder.Services.AddScoped<UserService>();
builder.Services.AddHostedService<UserEventSubscriber>();

var app = builder.Build();

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<GameHub>("/gamehub")
   .RequireAuthorization();

app.MapPost("/rooms", async (ClaimsPrincipal userClaim, CreateRoomDto createDto, IConnectionMultiplexer redis, UserService userService) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    IDatabase db = redis.GetDatabase();

    string joinCode = Util.GetRandomCode();
    string roomKey = $"{RedisConstant.RoomPrefix}{joinCode}";
    Room room = new()
    {
        JoinCode = joinCode,
        Name = createDto.Name,
        Player1 = userId,
        Player1Name = await userService.GetUsername(userId),
        Player2 = 0,
        IsPlayer1Ready = false,
        IsPlayer2Ready = false,
    };
    string roomJson = JsonSerializer.Serialize(room);

    int ttlInMinutes = 10;
    await db.StringSetAsync(roomKey, roomJson, TimeSpan.FromMinutes(ttlInMinutes));
    var expiryAt = DateTimeOffset.UtcNow.AddMinutes(ttlInMinutes).ToUnixTimeSeconds();
    await db.SortedSetAddAsync(RedisConstant.RoomSetKey, roomKey, expiryAt);
    await db.StringSetAsync($"{RedisConstant.UserRoomPrefix}{userId}", joinCode);

    return Results.Ok(new { room.JoinCode });
})
.RequireAuthorization()
.AddEndpointFilter<ValidationFilter<CreateRoomDto>>();

app.MapGet("/rooms", async (ClaimsPrincipal userClaim, IConnectionMultiplexer redis) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    IDatabase db = redis.GetDatabase();
    long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

    RedisValue[] expiredKeys = await db.SortedSetRangeByScoreAsync(RedisConstant.RoomSetKey, double.NegativeInfinity, now - 1);
    if (expiredKeys.Length > 0)
        await db.SortedSetRemoveAsync(RedisConstant.RoomSetKey, expiredKeys);

    RedisValue[] validKeys = await db.SortedSetRangeByScoreAsync(RedisConstant.RoomSetKey, now, double.PositiveInfinity);
    RedisKey[] redisKeys = validKeys.Select(v => (RedisKey)v.ToString()).ToArray();
    RedisValue[] roomJsons = await db.StringGetAsync(redisKeys);

    List<RoomDto> rooms = [];
    List<RedisValue> hasStartedRoomKeys = [];
    foreach (RedisValue roomJson in roomJsons)
    {
        if (!roomJson.IsNullOrEmpty)
        {
            Room? room = JsonSerializer.Deserialize<Room>(roomJson!);
            if (room is null)
                continue;

            if (room.HasGameStarted)
            {
                hasStartedRoomKeys.Add(roomJson);
                continue;
            }

            if ( room.Player2 == 0)
                rooms.Add(new RoomDto(room));
        }
    }

    if (hasStartedRoomKeys.Count > 0)
        await db.SortedSetRemoveAsync(RedisConstant.RoomSetKey, hasStartedRoomKeys.ToArray());

    return Results.Ok(rooms);
})
.RequireAuthorization();


app.MapGet("/rooms/user", async (ClaimsPrincipal userClaim, IConnectionMultiplexer redis) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    IDatabase db = redis.GetDatabase();
    string? roomCode = await db.StringGetAsync($"{RedisConstant.UserRoomPrefix}{userId}");

    if (string.IsNullOrEmpty(roomCode))
        return Results.NotFound(new { message = "User is not in any room." });

    return Results.Ok(new { roomCode });
})
.RequireAuthorization();

app.Run();
