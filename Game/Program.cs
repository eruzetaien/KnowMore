using System.Security.Claims;
using System.Text.Json;
using DotNetEnv;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Load .env variables
Env.Load(Path.Combine(Directory.GetCurrentDirectory(), ".env"));

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
builder.Services.AddScoped<RedisService>();
builder.Services.AddHostedService<UserEventSubscriber>();

var app = builder.Build();

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<GameHub>("/gamehub")
   .RequireAuthorization();

app.MapPost("/rooms", async (ClaimsPrincipal userClaim, CreateRoomRequest createReq, RedisService redisService, UserService userService) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    string code = Util.GetRandomCode();
    string roomKey = $"{RedisConstant.RoomPrefix}{code}";
    PlayerData player1 = new()
    {
        Id = userId,
        Name = await userService.GetUsername(userId),
    };
    Room room = new()
    {
        Code = code,
        Name = createReq.Name,
        Player1 = player1,
        Player2 = null,
    };

    int ttlInMinutes = 10;
    await redisService.SetAsync(roomKey, room, TimeSpan.FromMinutes(ttlInMinutes));

    var expiryAt = DateTimeOffset.UtcNow.AddMinutes(ttlInMinutes).ToUnixTimeSeconds();
    await redisService.AddToSortedSetAsync(RedisConstant.RoomSetKey, roomKey, expiryAt);

    await redisService.SetAsync($"{RedisConstant.UserRoomPrefix}{userId}", code);
    
    Response<RoomCodeDto> response = new ()
    {
        Status = RequestStatus.Success,
        Data = new () {RoomCode = room.Code}
    };
    return Results.Ok(response);
})
.RequireAuthorization()
.AddEndpointFilter<ValidationFilter<CreateRoomRequest>>();

app.MapGet("/rooms", async (ClaimsPrincipal userClaim, RedisService redisService) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    
    long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

    RedisValue[] expiredKeys = await redisService.GetRangeByScoreAsync(RedisConstant.RoomSetKey, double.NegativeInfinity, now - 1);
    if (expiredKeys.Length > 0)
        await redisService.RemoveFromSortedSetAsync(RedisConstant.RoomSetKey, expiredKeys);

    RedisValue[] validKeys = await redisService.GetRangeByScoreAsync(RedisConstant.RoomSetKey, now, double.PositiveInfinity);
    RedisKey[] redisKeys = validKeys.Select(v => (RedisKey)v.ToString()).ToArray();
    RedisValue[] roomJsons = await redisService.GetManyAsync(redisKeys.Select(v => v.ToString()));

    List<RoomDto> rooms = [];
    List<RedisValue> hasStartedRoomKeys = [];
    foreach (RedisValue roomJson in roomJsons)
    {
        if (!roomJson.IsNullOrEmpty)
        {
            Room? room = JsonSerializer.Deserialize<Room>((string)roomJson!);
            if (room is null)
                continue;

            if (room.HasGameStarted)
            {
                hasStartedRoomKeys.Add(roomJson);
                continue;
            }

            if ( room.Player2 == null)
                rooms.Add(new RoomDto(room));
        }
    }

    if (hasStartedRoomKeys.Count > 0)
        await redisService.RemoveFromSortedSetAsync(RedisConstant.RoomSetKey, hasStartedRoomKeys.ToArray());

    Response<List<RoomDto>> response = new ()
    {
        Status = RequestStatus.Success,
        Data = rooms
    };
    return Results.Ok(response);
})
.RequireAuthorization();


app.MapGet("/rooms/user", async (ClaimsPrincipal userClaim, RedisService redisService) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    string userRoomKey = $"{RedisConstant.UserRoomPrefix}{userId}";
    string? roomCode = await redisService.GetAsync<string>(userRoomKey);
    
    if (string.IsNullOrEmpty(roomCode))
        return UserRoomNotFound();
        

    if (!await redisService.ExistsAsync($"{RedisConstant.RoomPrefix}{roomCode}"))
    {
        await redisService.DeleteAsync(userRoomKey);
        return UserRoomNotFound();
    }

    Response<RoomCodeDto> response = new ()
    {
        Status = RequestStatus.Success,
        Data = new (){RoomCode = roomCode}
    };
    return Results.Ok(response);
})
.RequireAuthorization();

IResult UserRoomNotFound()
{
    return Results.NotFound(new Response<FactGroupDTO>
    {
        Status = RequestStatus.BusinessValidationError,
        Message = ErrorMessages.UserRoomNotFound 
    });
}

app.Run();
