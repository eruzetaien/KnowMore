using System.Security.Claims;
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

app.MapPost("/rooms", async (ClaimsPrincipal userClaim, CreateRoomDto createDto, IConnectionMultiplexer redis) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    var db = redis.GetDatabase();

    var joinCode = Guid.NewGuid().ToString("N")[..6].ToUpper();

    var key = joinCode;
    await db.HashSetAsync(key, new HashEntry[]
    {   
        new("joinCode", joinCode),
        new("roomName", createDto.Name),
        new("roomMaster", userId),
        new("secondPlayer", ""), 
    });

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
