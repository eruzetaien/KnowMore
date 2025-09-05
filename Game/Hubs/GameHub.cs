using System.Data.Common;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;


public class GameHub : Hub
{

    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger _logger;

    public GameHub(IConnectionMultiplexer redis, ILogger<GameHub> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        Console.WriteLine($"User {userId} connected with SignalR.");
        await base.OnConnectedAsync();
    }

    public async Task JoinRoom(JoinRoomRequest request)
    {
        string? sub = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (sub is null)
            throw new HubException("Unauthorized: missing claim");

        long userId = long.Parse(sub);

        string roomKey = $"room:{request.RoomCode}";
        Room room = await GetEntity<Room>(roomKey);

        string? playerRole = null;

        if (room.Player1 == userId)
        {
            playerRole = "Player1";
        }
        else if (room.Player2 == userId)
        {
            playerRole = "Player2";
        }
        else if (room.Player2 is null or 0)
        {
            room.Player2 = userId;
            playerRole = "Player2";
            await UpdateEntity<Room>(roomKey, room);
        }

        if (playerRole is null)
            throw new HubException("Room is full or you are not allowed to join");

        Context.Items["PlayerRole"] = playerRole;
        await Groups.AddToGroupAsync(Context.ConnectionId, request.RoomCode);
        await Clients.Caller.SendAsync("PlayerJoined", new {Role = playerRole});
        await Clients.Group(request.RoomCode).SendAsync("ReceiveRoomUpdate", room);
    }
    
    public async Task SetPlayerReadyState(SetPlayerReadyStateRequest request)
    {
        string? sub = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (sub is null)
            throw new HubException("Unauthorized: missing claim");
        long userId = long.Parse(sub);

        string roomKey = $"room:{request.RoomCode}";
        Room room = await GetEntity<Room>(roomKey);

        if (room.HasGameStarted) return;

        if (userId != room.Player1 && userId != room.Player2)
            throw new HubException("Player is invalid");

        if (room.Player1 == userId)
            room.IsPlayer1Ready = request.IsReady;
        else
            room.IsPlayer2Ready = request.IsReady;
        room.HasGameStarted = room.IsPlayer1Ready && room.IsPlayer2Ready;
        await UpdateEntity<Room>(roomKey, room);

        if (room.HasGameStarted)
        { 
            string gameKey = $"game:{room.JoinCode}";
            GameData game = new() { RoomCode = room.JoinCode };
            string gameJson = JsonSerializer.Serialize(game);

            int ttlInMinutes = 30;
            IDatabase db = _redis.GetDatabase();
            await db.StringSetAsync(gameKey, gameJson, TimeSpan.FromMinutes(ttlInMinutes));
        }

        await Clients.Group(request.RoomCode)
            .SendAsync("ReceiveRoomUpdate", room);
    }

    public async Task SendEmoticon(SendEmoticonRequest request)
    {
        if (!Context.Items.TryGetValue("PlayerRole", out var roleObj) || roleObj is not string role)
            throw new HubException("Role not set");

        await Clients.Group(request.RoomCode).SendAsync("ReceiveEmoticon",
            new { Sender = role, Emoticon = request.Emoticon });   
    }

    public async Task SendOptions(SendOptionsRequest request)
    {
        if (!Context.Items.TryGetValue("PlayerRole", out var roleObj) || roleObj is not string role)
            throw new HubException("Role not set");

        string gameKey = $"game:{request.RoomCode}";
        GameData game = await GetEntity<GameData>(gameKey);

        if (role.Equals("Player1"))
        {
            game.Player1Lie = request.Lie;
            game.Player1Options = Util.BuildPlayerOptions(request.FactId1, request.FactId2);
            game.IsPlayer1Ready = true;
        }
        else if (role.Equals("Player2"))
        {
            game.Player2Lie = request.Lie;
            game.Player2Options = Util.BuildPlayerOptions(request.FactId1, request.FactId2);
            game.IsPlayer2Ready = true;
        }
        else
        {
            throw new HubException("Role not set");
        }

        if (game.IsPlayer1Ready && game.IsPlayer2Ready)
        { 
            await Clients.Group(request.RoomCode).SendAsync("StartPlayingPhase",
                new {});   
        }
    }

    private async Task<T> GetEntity<T>(string key)
    {
        IDatabase db = _redis.GetDatabase();
        RedisValue value = await db.StringGetAsync(key);

        if (!value.HasValue)
            throw new HubException($"{typeof(T).Name} not found");

        try
        {
            return JsonSerializer.Deserialize<T>(value!) 
                ?? throw new HubException($"{typeof(T).Name} data corrupted");
        }
        catch (JsonException)
        {
            throw new HubException($"{typeof(T).Name} data corrupted");
        }
    }

    private async Task UpdateEntity<T>(string key, T entity)
    {
        IDatabase db = _redis.GetDatabase();
        string updatedJson = JsonSerializer.Serialize(entity);
        await db.StringSetAsync(key, updatedJson);
    }


    

    public async Task LeaveRoom(string roomCode)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);

        await Clients.Group(roomCode).SendAsync("Send", $"{Context.ConnectionId} has left the room {roomCode}.");
    }
}