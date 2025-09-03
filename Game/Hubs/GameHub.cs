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

        Room room = await GetRoom(roomCode);

        if (room.RoomMaster == userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
            await Clients.Group(roomCode)
                .SendAsync("ReceiveRoomUpdate", room);
            return;
        }

        if (room.SecondPlayer is null || room.SecondPlayer == 0 )
        {
            IDatabase db = _redis.GetDatabase();
            room.SecondPlayer = userId;

            string updatedJson = JsonSerializer.Serialize(room);
            await db.StringSetAsync(roomCode, updatedJson);
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);

        await Clients.Group(roomCode)
            .SendAsync("ReceiveRoomUpdate", room);
    }

    private async Task<Room> GetRoom(string roomCode) {
        IDatabase db = _redis.GetDatabase();
        string roomKey = $"room:{roomCode}";
        RedisValue roomValue = await db.StringGetAsync(roomKey);

        if (!roomValue.HasValue)
            throw new HubException("Room not found");

        try {
            return JsonSerializer.Deserialize<Room>(roomValue!)!;
        } catch (JsonException) {
            throw new HubException("Room data corrupted");
        }
    }


    public async Task LeaveRoom(string roomCode)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);

        await Clients.Group(roomCode).SendAsync("Send", $"{Context.ConnectionId} has left the room {roomCode}.");
    }
}