using System.Data.Common;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;


public class GameHub : Hub
{

    private readonly IConnectionMultiplexer _redis;

    public GameHub(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst("sub")?.Value;
        Console.WriteLine($"User {userId} connected with SignalR.");
        await base.OnConnectedAsync();
    }

    public async Task JoinRoom(string roomCode)
    {
        string? sub = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (sub is null)
            throw new HubException("Unauthorized: missing claim");

        long userId = long.Parse(sub);

        string roomKey = $"room:{roomCode}";
        Room room = await GetRoom(roomKey);

        string? playerRole = null;

        if (room.RoomMaster == userId)
        {
            playerRole = "Player1";
        }
        else if (room.SecondPlayer == userId)
        {
            playerRole = "Player2";
        }
        else if (room.SecondPlayer is null or 0)
        {
            room.SecondPlayer = userId;
            playerRole = "Player2";
            await UpdateRoom(roomKey, room);
        }

        if (playerRole is null)
            throw new HubException("Room is full or you are not allowed to join");

        Context.Items["PlayerRole"] = playerRole;
        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Caller.SendAsync("PlayerJoined", playerRole);
        await Clients.Group(roomCode).SendAsync("ReceiveRoomUpdate", room);
    }

    
    
    public async Task SetPlayerReadyStatus(string roomCode, bool isReady)
    {
        string? sub = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (sub is null)
            throw new HubException("Unauthorized: missing claim");
        long userId = long.Parse(sub);

        string roomKey = $"room:{roomCode}";
        Room room = await GetRoom(roomKey);

        if (userId != room.RoomMaster && userId != room.SecondPlayer) 
            throw new HubException("Player is invalid");

        if (room.RoomMaster == userId)
            room.IsPlayer1Ready = isReady;
        else
            room.IsPlayer2Ready = isReady;
        bool isAllPlayerReady = room.IsPlayer1Ready && room.IsPlayer2Ready;
        room.HasGameStarted = isAllPlayerReady;
        await UpdateRoom(roomKey, room);

        await Clients.Group(roomCode)
            .SendAsync("ReceiveRoomUpdate", room);
    }

    public async Task SendEmoticon(string roomCode, Emoticon emoticon)
    {
        if (!Context.Items.TryGetValue("PlayerRole", out var roleObj) || roleObj is not string role)
            throw new HubException("Role not set");

        await Clients.Group(roomCode).SendAsync("ReceiveEmoticon", new {
            Sender = role,
            Emoticon = emoticon
        });
        
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