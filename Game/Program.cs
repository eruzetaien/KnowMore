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

    IDatabase db = redis.GetDatabase();

    string joinCode = Guid.NewGuid().ToString("N")[..6].ToUpper();
    string roomKey = $"room:{joinCode}";
    Room room = new()
    {
        JoinCode = joinCode,
        Name = createDto.Name,
        RoomMaster = userId,
        SecondPlayer = 0
    };
    string roomJson = JsonSerializer.Serialize(room);

    int ttlInMinutes = 10;
    await db.StringSetAsync(roomKey, roomJson, TimeSpan.FromMinutes(ttlInMinutes));
    var expiryAt = DateTimeOffset.UtcNow.AddMinutes(ttlInMinutes).ToUnixTimeSeconds();
    await db.SortedSetAddAsync("rooms:index", roomKey, expiryAt);

    return Results.Ok(room);
})
.RequireAuthorization()
.AddEndpointFilter<ValidationFilter<CreateRoomDto>>();

app.MapGet("/rooms", async (ClaimsPrincipal userClaim, IConnectionMultiplexer redis) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    IDatabase db = redis.GetDatabase();
    long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

    RedisValue[] expiredKeys = await db.SortedSetRangeByScoreAsync("rooms:index", double.NegativeInfinity, now - 1);    
    if (expiredKeys.Length > 0)
        await db.SortedSetRemoveAsync("rooms:index", expiredKeys);

    RedisValue[] validKeys = await db.SortedSetRangeByScoreAsync("rooms:index", now, double.PositiveInfinity);
    RedisKey[] redisKeys = validKeys.Select(v => (RedisKey)v.ToString()).ToArray();
    RedisValue[] roomJsons = await db.StringGetAsync(redisKeys);

    List<Room> rooms = new ();
    foreach (RedisValue roomJson in roomJsons)
    {
        if (!roomJson.IsNullOrEmpty)
        {
            Room? room = JsonSerializer.Deserialize<Room>(roomJson!);
            if (room is not null)
                rooms.Add(room);
        }
    }

    return Results.Ok(rooms);
})
.RequireAuthorization();

app.Run();
