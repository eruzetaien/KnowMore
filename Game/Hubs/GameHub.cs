using System.Net;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;


public class GameHub : Hub
{

    private readonly IConnectionMultiplexer _redis;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger _logger;

    public GameHub(IConnectionMultiplexer redis, IHttpClientFactory httpClientFactory, ILogger<GameHub> logger)
    {
        _redis = redis;
        _httpClientFactory = httpClientFactory;
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
        long userId = GetUserId();

        string roomKey = $"room:{request.RoomCode}";
        Room room = await GetEntity<Room>(roomKey);

        PlayerSlot playerSlot = PlayerSlot.None;
        if (room.Player1 == userId)
        {
            playerSlot = PlayerSlot.Player1;
        }
        else if (room.Player2 == userId)
        {
            playerSlot = PlayerSlot.Player2;
        }
        else if (room.Player2 == 0)
        {
            room.Player2 = userId;
            playerSlot = PlayerSlot.Player2;
            await UpdateEntity<Room>(roomKey, room);
        }

        if (playerSlot == PlayerSlot.None)
            throw new HubException("Room is full or you are not allowed to join");

        await Groups.AddToGroupAsync(Context.ConnectionId, request.RoomCode);
        await Clients.Caller.SendAsync("PlayerJoined", new { Role = playerSlot });
        await Clients.Group(request.RoomCode).SendAsync("ReceiveRoomUpdate", new RoomDto(room));
        await Clients.Group(request.RoomCode).SendAsync("InitRoom", new {room.Player1, room.Player2});
    }
    
    public async Task SetReadyStateToStartGame(SetPlayerReadyStateRequest request)
    {
        long userId = GetUserId();

        string roomKey = $"room:{request.RoomCode}";
        _logger.LogInformation(roomKey);
        Room room = await GetEntity<Room>(roomKey);

        if (room.HasGameStarted) return;

        PlayerSlot playerSlot = room.GetPlayerSlot(userId);

        if (playerSlot == PlayerSlot.None)
            throw new HubException("Player is invalid");

        if (playerSlot == PlayerSlot.Player1)
            room.IsPlayer1Ready = request.IsReady;
        else
            room.IsPlayer2Ready = request.IsReady;
        room.HasGameStarted = room.IsPlayer1Ready && room.IsPlayer2Ready;
        await UpdateEntity<Room>(roomKey, room);
        
        await Clients.Group(request.RoomCode).SendAsync("ReceivePlayerReadiness",
                new { room.IsPlayer1Ready, room.IsPlayer2Ready });

        if (room.HasGameStarted)
        {
            string gameKey = $"game:{room.JoinCode}";
            GameData game = new() { RoomCode = room.JoinCode, Player1 = room.Player1, Player2 = room.Player2 };
            string gameJson = JsonSerializer.Serialize(game);

            int ttlInMinutes = 30;
            IDatabase db = _redis.GetDatabase();
            await db.StringSetAsync(gameKey, gameJson, TimeSpan.FromMinutes(ttlInMinutes));
            await db.KeyDeleteAsync(roomKey);
            await Clients.User(game.Player1.ToString()).SendAsync("InitPreparationPhase",
                new { });
            await Clients.Group(request.RoomCode).SendAsync("SetGamePhase",
                new { phase = GamePhase.Preparation });
        }
    }

    public async Task SendEmoticon(SendEmoticonRequest request)
    {
        long userId = GetUserId();
        
        string gameKey = $"game:{request.RoomCode}";
        GameData game = await GetEntity<GameData>(gameKey);
        PlayerSlot playerSlot = game.GetPlayerSlot(userId);

        await Clients.Group(request.RoomCode).SendAsync("ReceiveEmoticon",
            new { Sender = playerSlot, Emoticon = request.Emoticon });   
    }

    public async Task SendStatements(SendStatementsRequest request)
    {
        long userId = GetUserId();
        
        string gameKey = $"game:{request.RoomCode}";
        GameData game = await GetEntity<GameData>(gameKey);
        PlayerSlot playerSlot = game.GetPlayerSlot(userId);
        if (playerSlot == PlayerSlot.Player1)
        {
            game.Player1Lie = request.Lie;
            game.Player1Statements = Util.BuildPlayerStatements(request.FactId1, request.FactId2);
            game.IsPlayer1Ready = true;
        }
        else if (playerSlot == PlayerSlot.Player2)
        {
            game.Player2Lie = request.Lie;
            game.Player2Statements = Util.BuildPlayerStatements(request.FactId1, request.FactId2);
            game.IsPlayer2Ready = true;
        }
        else
            throw new HubException("You are not a participant in this game");
           
        await UpdateEntity<GameData>(gameKey, game);
        
        await Clients.Group(request.RoomCode).SendAsync("ReceivePlayerReadiness",
                new { game.IsPlayer1Ready, game.IsPlayer2Ready });

        if (game.IsPlayer1Ready && game.IsPlayer2Ready)
        {
            game.IsPlayer1Ready = game.IsPlayer2Ready = false;
            await UpdateEntity<GameData>(gameKey, game);

            var player1Statements = new List<Object>();
            for (int i = 0; i < game.Player1Statements.Length; i++)
            {
                long id = game.Player1Statements[i];
                string desc;
                if (id == 0)
                    desc = game.Player1Lie;
                else
                    desc = await FetchFactDescription(id);
                player1Statements.Add(new { idx=i, description=desc });
            }
            // Send Player 1 statement to Player 2, its opponent
            await Clients.User(game.Player2.ToString()).SendAsync("InitPlayingPhase",
                new { OpponentStatements = player1Statements });

            var player2Statements = new List<Object>();
            for (int i = 0; i < game.Player2Statements.Length; i++)
            {
                long id = game.Player2Statements[i];
                string desc;
                if (id == 0)
                    desc = game.Player2Lie;
                else
                    desc = await FetchFactDescription(id);
                player2Statements.Add(new { idx=i, description=desc });
            }
            // Send Player 2 statement to Player 1, its opponent
            await Clients.User(game.Player1.ToString()).SendAsync("InitPlayingPhase",
                new { OpponentStatements = player2Statements });

            await Clients.Group(request.RoomCode).SendAsync("SetGamePhase",
                new { phase = GamePhase.Playing });
        }
    }

    public async Task SendAnswer(SendAnswerRequest request)
    {
        long userId = GetUserId();

        string gameKey = $"game:{request.RoomCode}";
        GameData game = await GetEntity<GameData>(gameKey);
        PlayerSlot playerSlot = game.GetPlayerSlot(userId);
        if (playerSlot == PlayerSlot.Player1)
        {
            game.Player1Answer = request.answerIdx;
            game.IsPlayer1Ready = true;
        }
        else if (playerSlot == PlayerSlot.Player2)
        {
            game.Player2Answer = request.answerIdx;
            game.IsPlayer2Ready = true;
        }
        else
            throw new HubException("You are not a participant in this game");

        await UpdateEntity<GameData>(gameKey, game);

        await Clients.Group(request.RoomCode).SendAsync("ReceivePlayerReadiness",
                new { game.IsPlayer1Ready, game.IsPlayer2Ready });

        if (game.IsPlayer1Ready && game.IsPlayer2Ready)
        {
            game.IsPlayer1Ready = game.IsPlayer2Ready = false;
            await UpdateEntity<GameData>(gameKey, game);

            // Assess player answer
            bool isPlayer1Correct = game.Player2Statements[game.Player1Answer] == 0;
            bool isPlayer2Correct = game.Player1Statements[game.Player2Answer] == 0;

            var player1rewardStatement = isPlayer1Correct
                ? await GetRewardStatements(game.Player2Statements, game.Player1)
                : new List<object>();

            var player2rewardStatement = isPlayer2Correct
                ? await GetRewardStatements(game.Player1Statements, game.Player2)
                : new List<object>();

            await Clients.User(game.Player1.ToString()).SendAsync("InitResultPhase",
                new { isPlayerCorrect = isPlayer1Correct, rewardStatements = player1rewardStatement });
            await Clients.User(game.Player2.ToString()).SendAsync("InitResultPhase",
                new {isPlayerCorrect = isPlayer2Correct, rewardStatements = player2rewardStatement});

            await Clients.Group(request.RoomCode).SendAsync("SetGamePhase",
                new { phase = GamePhase.Result });
        }
    }

    public async Task SendReadyStateForNextGame(SetPlayerReadyStateRequest request)
    {
        long userId = GetUserId();

        string gameKey = $"game:{request.RoomCode}";
        GameData game = await GetEntity<GameData>(gameKey);
        PlayerSlot playerSlot = game.GetPlayerSlot(userId);
        if (playerSlot == PlayerSlot.Player1)
        {
            game.IsPlayer1Ready = true;
        }
        else if (playerSlot == PlayerSlot.Player2)
        {
            game.IsPlayer2Ready = true;
        }
        else
            throw new HubException("You are not a participant in this game");

        await UpdateEntity<GameData>(gameKey, game);

        await Clients.Group(request.RoomCode).SendAsync("ReceivePlayerReadiness",
                new { game.IsPlayer1Ready, game.IsPlayer2Ready });

        if (game.IsPlayer1Ready && game.IsPlayer2Ready)
        {
            game.IsPlayer1Ready = game.IsPlayer2Ready = false;
            await UpdateEntity<GameData>(gameKey, game);

            await Clients.User(game.Player1.ToString()).SendAsync("InitPreparationPhase",
                new { });
            await Clients.Group(request.RoomCode).SendAsync("SetGamePhase",
                new { phase = GamePhase.Preparation });
        }
    }

    private long GetUserId()
    {
        string? sub = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(sub))
            throw new HubException("Unauthorized: missing claim");

        return long.Parse(sub);
    }

    
    private async Task<string> FetchFactDescription(long id)
    {
        HttpClient client = _httpClientFactory.CreateClient("FactService");
        var response = await client.GetAsync($"/internal/facts/{id}");
        if (!response.IsSuccessStatusCode)
            return "[Fact not found]";

        var fact = await response.Content.ReadFromJsonAsync<FactDTO>();
        return fact?.Description ?? "[Invalid Fact]";
    }

    private async Task<List<object>> GetRewardStatements(
    long[] statementIds,
    long targetUserId)
    {
        var rewards = new List<object>();
        var client = _httpClientFactory.CreateClient("FactService");

        foreach (long statementId in statementIds)
        {
            if (statementId == 0)
                continue;

            var response = await client.GetAsync(
                $"/internal/shared-facts/{statementId}/info?targetUserId={targetUserId}");

            if (!response.IsSuccessStatusCode)
                continue;

            var factInfo = await response.Content.ReadFromJsonAsync<ShareFactInfoDTO>();
            if (factInfo is { IsShared: false })
            {
                rewards.Add(new { id = statementId, factInfo.Description });
            }
        }

        return rewards;
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