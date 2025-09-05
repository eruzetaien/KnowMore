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
        Room room = await GetRoom(roomKey);

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
            await UpdateRoom(roomKey, room);
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
        Room room = await GetRoom(roomKey);

        if (userId != room.Player1 && userId != room.Player2) 
            throw new HubException("Player is invalid");

        if (room.Player1 == userId)
            room.IsPlayer1Ready = request.IsReady;
        else
            room.IsPlayer2Ready = request.IsReady;
        bool isAllPlayerReady = room.IsPlayer1Ready && room.IsPlayer2Ready;
        room.HasGameStarted = isAllPlayerReady;
        await UpdateRoom(roomKey, room);

        _logger.LogInformation("New ready state : {state}", request.IsReady);
        _logger.LogInformation("Updated room: {room}", JsonSerializer.Serialize(room));

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

    private async Task<Room> GetRoom(string roomKey)
    {
        IDatabase db = _redis.GetDatabase();
        RedisValue roomValue = await db.StringGetAsync(roomKey);

        if (!roomValue.HasValue)
            throw new HubException("Room not found");

        try
        {
            return JsonSerializer.Deserialize<Room>(roomValue!)!;
        }
        catch (JsonException)
        {
            throw new HubException("Room data corrupted");
        }
    }

    private async Task UpdateRoom(string roomKey, Room room)
    {
        IDatabase db = _redis.GetDatabase();
        string updatedJson = JsonSerializer.Serialize(room);
        await db.StringSetAsync(roomKey, updatedJson);
    }


    public async Task LeaveRoom(string roomCode)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);

        await Clients.Group(roomCode).SendAsync("Send", $"{Context.ConnectionId} has left the room {roomCode}.");
    }
}