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

        IDatabase db = _redis.GetDatabase();
        string roomKey = $"room:{roomCode}";
        string? roomJson = await db.StringGetAsync(roomKey);

        if (roomJson == null)
            throw new HubException("Room not found");

        Room? room = JsonSerializer.Deserialize<Room>(roomJson!);

        if (room is null)
            throw new HubException("Invalid room data");

        if (room.RoomMaster == userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
            await Clients.Group(roomCode)
                .SendAsync("ReceiveRoomUpdate", $"Room master {userId} joined {roomCode}.");
            return;
        }

        if (room.SecondPlayer is null)
        {
            room.SecondPlayer = userId;

            string updatedJson = JsonSerializer.Serialize(room);
            await db.StringSetAsync(roomCode, updatedJson);
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);

        await Clients.Group(roomCode)
            .SendAsync("ReceiveRoomUpdate", $"User {userId} has joined {roomCode}.");
    }

    public async Task LeaveRoom(string roomCode)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);

        await Clients.Group(roomCode).SendAsync("Send", $"{Context.ConnectionId} has left the room {roomCode}.");
    }
}