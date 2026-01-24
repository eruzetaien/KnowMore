using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;



public class GameHub : Hub
{

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<GameHub> _logger;
    private readonly FactDb _db;
    private readonly UserService _userService;
    private readonly RedisService _redisService;

    public GameHub(
        IHttpClientFactory httpClientFactory,
        ILogger<GameHub> logger,
        FactDb db,
        UserService userService,
        RedisService redisService)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _db = db;
        _userService = userService;
        _redisService = redisService;
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

        string roomKey = $"{RedisConstant.RoomPrefix}{request.RoomCode}";
        Room room = await _redisService.GetAsync<Room>(roomKey) ?? throw new HubException($"Room not found");

        PlayerSlot playerSlot = PlayerSlot.None;
        if (room.Player1.Id == userId)
        {
            playerSlot = PlayerSlot.Player1;
        }
        else if (room.Player2?.Id == userId)
        {
            playerSlot = PlayerSlot.Player2;
        }
        else if (room.Player2 == null)
        {
            PlayerData player2 = new()
            {
                Id = userId,
                Name = await _userService.GetUsername(userId),
            };
            room.Player2 = player2;
            await _redisService.UpdateAsync<Room>(roomKey, room);
            await _redisService.SetAsync($"{RedisConstant.UserRoomPrefix}{userId}", request.RoomCode);

            playerSlot = PlayerSlot.Player2;
        }

        if (playerSlot == PlayerSlot.None)
            throw new HubException("Room is full or you are not allowed to join");

        await Groups.AddToGroupAsync(Context.ConnectionId, request.RoomCode);
        await Clients.Caller.SendAsync("PlayerJoined", new { Slot = playerSlot });
        await Clients.Group(request.RoomCode).SendAsync("ReceiveRoomUpdate", new RoomDto(room));
        await Clients.Group(request.RoomCode).SendAsync("InitPlayer", new
        {
            room.Player1,
            room.Player2,
        });
    }
    
    public async Task SetReadyStateToStartGame(SetPlayerReadyStateRequest request)
    {
        long userId = GetUserId();

        string roomKey = $"{RedisConstant.RoomPrefix}{request.RoomCode}";
        Room room = await _redisService.GetAsync<Room>(roomKey) ?? throw new HubException($"Room not found");

        PlayerSlot playerSlot = room.GetPlayerSlot(userId);

        if (playerSlot == PlayerSlot.None)
            throw new HubException("Player is invalid");

        if (playerSlot == PlayerSlot.Player1)
            room.Player1.IsReady = request.IsReady;
        else
            room.Player2!.IsReady = request.IsReady;

        bool isPlayer1Ready = room.Player1.IsReady;
        bool isPlayer2Ready = room.Player2 != null && room.Player2.IsReady;
        room.HasGameStarted = isPlayer1Ready && isPlayer2Ready;

        await _redisService.UpdateAsync<Room>(roomKey, room);
        
        await Clients.Group(request.RoomCode).SendAsync("ReceivePlayerReadiness",
                new { IsPlayer1Ready=isPlayer1Ready, IsPlayer2Ready=isPlayer2Ready});

        if (room.HasGameStarted)
        {
            GameData game = await CreateGameData(room, roomKey);
            string gameKey = $"{RedisConstant.GamePrefix}{game.RoomCode}";
            await InitPreparationPhase(game, gameKey);
        }
    }

    public async Task SendEmoticon(SendEmoticonRequest request)
    {
        long userId = GetUserId();

        string gameKey = $"{RedisConstant.GamePrefix}{request.RoomCode}";
        GameData game = await _redisService.GetAsync<GameData>(gameKey) ?? throw new HubException($"Game Data not found");;
        PlayerSlot playerSlot = game.GetPlayerSlot(userId);

        await Clients.Group(request.RoomCode).SendAsync("ReceiveEmoticon",
            new { Sender = playerSlot, Emoticon = request.Emoticon });
    }

    public async Task SendStatements(SendStatementsRequest request)
    {
        long userId = GetUserId();

        long factId1 = long.Parse(request.FactId1);
        long factId2 = long.Parse(request.FactId2);
        
        string gameKey = $"{RedisConstant.GamePrefix}{request.RoomCode}";
        GameData game = await _redisService.GetAsync<GameData>(gameKey) ?? throw new HubException($"Game Data not found");;
        PlayerSlot playerSlot = game.GetPlayerSlot(userId);
        if (playerSlot == PlayerSlot.Player1)
        {
            game.Player1Lie = request.Lie;
            game.Player1Statements = Util.BuildPlayerStatements(factId1, factId2);
            game.Player1.IsReady = true;
        }
        else if (playerSlot == PlayerSlot.Player2)
        {
            game.Player2Lie = request.Lie;
            game.Player2Statements = Util.BuildPlayerStatements(factId1, factId2);
            game.Player2!.IsReady = true;
        }
        else
            throw new HubException("You are not a participant in this game");
           
        await _redisService.UpdateAsync<GameData>(gameKey, game);
        
        await Clients.Group(request.RoomCode).SendAsync("ReceivePlayerReadiness",
                new { IsPlayer1Ready=game.Player1.IsReady, IsPlayer2Ready=game.Player2!.IsReady });

        if (game.Player1.IsReady && game.Player2!.IsReady)
            await InitPlayingPhase(game, gameKey);
    }

    public async Task SendAnswer(SendAnswerRequest request)
    {
        long userId = GetUserId();

        string gameKey = $"{RedisConstant.GamePrefix}{request.RoomCode}";
        GameData game = await _redisService.GetAsync<GameData>(gameKey) ?? throw new HubException($"Game Data not found");;
        PlayerSlot playerSlot = game.GetPlayerSlot(userId);
        if (playerSlot == PlayerSlot.Player1)
        {
            game.Player1Answer = request.AnswerIdx;
            game.Player1.IsReady = true;
        }
        else if (playerSlot == PlayerSlot.Player2)
        {
            game.Player2Answer = request.AnswerIdx;
            game.Player2!.IsReady = true;
        }
        else
            throw new HubException("You are not a participant in this game");

        await _redisService.UpdateAsync<GameData>(gameKey, game);

        await Clients.Group(request.RoomCode).SendAsync("ReceivePlayerReadiness",
                new { IsPlayer1Ready=game.Player1.IsReady, IsPlayer2Ready=game.Player2!.IsReady });

        if (game.Player1.IsReady && game.Player2!.IsReady)
            await InitResultPhase(game, gameKey);
    }
    
    public async Task SendRewardChoice(SendRewardChoiceRequest request)
    {
        long userId = GetUserId();

        long factId = long.Parse(request.FactId);
        bool exists = await _db.SharedFacts
                .AnyAsync(sf => sf.FactId == factId && sf.UserId == userId);

        if (exists)
            return;

        SharedFact sharedFact = new() { FactId = factId, UserId = userId };
        _db.SharedFacts.Add(sharedFact);
        await _db.SaveChangesAsync();
    }

    public async Task SendReadyStateForNextGame(SetPlayerReadyStateRequest request)
    {
        long userId = GetUserId();

        string gameKey = $"{RedisConstant.GamePrefix}{request.RoomCode}";
        GameData game = await _redisService.GetAsync<GameData>(gameKey) ?? throw new HubException($"Game Data not found");
        PlayerSlot playerSlot = game.GetPlayerSlot(userId);
        if (playerSlot == PlayerSlot.Player1)
        {
            game.Player1.IsReady = true;
        }
        else if (playerSlot == PlayerSlot.Player2)
        {
            game.Player2!.IsReady = true;
        }
        else
            throw new HubException("You are not a participant in this game");

        await _redisService.UpdateAsync<GameData>(gameKey, game);

        await Clients.Group(request.RoomCode).SendAsync("ReceivePlayerReadiness",
                new { IsPlayer1Ready=game.Player1.IsReady, IsPlayer2Ready=game.Player2!.IsReady });

        if (game.Player1.IsReady && game.Player2!.IsReady)
            await InitPreparationPhase(game, gameKey);
    }
    
    private async Task<GameData> CreateGameData(Room room, string roomKey)
    {
        string gameKey = $"{RedisConstant.GamePrefix}{room.Code}";
        GameData game = new()
        {
            RoomCode = room.Code,
            Player1 = room.Player1,
            Player2 = room.Player2,
        };
        string gameJson = JsonSerializer.Serialize(game);

        int ttlInMinutes = 30;
        await _redisService.SetAsync(gameKey, gameJson, TimeSpan.FromMinutes(ttlInMinutes));
        await _redisService.DeleteAsync(roomKey);

        return game;
    }

    private async Task InitPreparationPhase(GameData game, string gameKey)
    { 
        game.Player1.IsReady = game.Player2!.IsReady = false;

        if (game.Player1Facts.Count <= 0)
        { 
            game.Player1Facts = await GetAllPlayerFact(game.Player1.Id);
            foreach (FactDTO fact in game.Player1Facts.SelectMany(g => g.Facts))
                game.PlayerFactDescriptionMap.Add(long.Parse(fact.Id), fact.Description);
        }

        if (game.Player2Facts.Count <= 0)
        { 
            game.Player2Facts = game.Player2 != null ? await GetAllPlayerFact(game.Player2.Id) : [] ;
            foreach (FactDTO fact in game.Player2Facts.SelectMany(g => g.Facts))
                game.PlayerFactDescriptionMap.Add(long.Parse(fact.Id), fact.Description);
        }

        await _redisService.UpdateAsync<GameData>(gameKey, game);

        await Clients.User(game.Player1.Id.ToString()).SendAsync("InitPreparationPhase",
            new { playerFacts = game.Player1Facts });
        
        await Clients.User(game.Player2!.Id.ToString()).SendAsync("InitPreparationPhase",
            new { playerFacts = game.Player2Facts });

        await Clients.Group(game.RoomCode).SendAsync("SetGamePhase",
            new { phase = GamePhase.Preparation });
    }

    private async Task InitPlayingPhase(GameData game, string gameKey)
    {
        game.Player1.IsReady = game.Player2!.IsReady = false;
        await _redisService.UpdateAsync<GameData>(gameKey, game);

        var player1Statements = new List<Object>();
        for (int i = 0; i < game.Player1Statements.Length; i++)
        {
            long id = game.Player1Statements[i];
            string desc;
            if (id == 0)
                desc = game.Player1Lie;
            else
                desc = game.PlayerFactDescriptionMap[id];
            player1Statements.Add(new { idx = i, description = desc });
        }
        // Send Player 1 statement to Player 2, its opponent
        await Clients.User(game.Player2!.Id.ToString()).SendAsync("InitPlayingPhase",
            new { OpponentStatements = player1Statements });

        var player2Statements = new List<Object>();
        for (int i = 0; i < game.Player2Statements.Length; i++)
        {
            long id = game.Player2Statements[i];
            string desc;
            if (id == 0)
                desc = game.Player2Lie;
            else
                desc = game.PlayerFactDescriptionMap[id];
            player2Statements.Add(new { idx = i, description = desc });
        }
        // Send Player 2 statement to Player 1, its opponent
        await Clients.User(game.Player1.Id.ToString()).SendAsync("InitPlayingPhase",
            new { OpponentStatements = player2Statements });

        await Clients.Group(game.RoomCode).SendAsync("SetGamePhase",
            new { phase = GamePhase.Playing });
    }

    private async Task InitResultPhase(GameData game, string gameKey)
    { 
        game.Player1.IsReady = game.Player2!.IsReady = false;

        // Assess player answer
        bool isPlayer1Correct = game.Player2Statements[game.Player1Answer] == 0;
        bool isPlayer2Correct = game.Player1Statements[game.Player2Answer] == 0;

        game.Player1Score += isPlayer1Correct ? 1 : 0;
        game.Player2Score += isPlayer2Correct ? 1 : 0;

        await _redisService.UpdateAsync<GameData>(gameKey, game);

        var player1rewardStatement = isPlayer1Correct
            ? await GetRewardStatements(game.Player2Statements, game.Player1.Id)
            : new List<object>();

        var player2rewardStatement = isPlayer2Correct
            ? await GetRewardStatements(game.Player1Statements, game.Player2!.Id)
            : new List<object>();

        await Clients.User(game.Player1.Id.ToString()).SendAsync("InitResultPhase",
            new
            {
                isPlayerCorrect = isPlayer1Correct,
                rewardStatements = player1rewardStatement,
                player1Score = game.Player1Score,
                player2Score = game.Player2Score,
            });
        await Clients.User(game.Player2!.Id.ToString()).SendAsync("InitResultPhase",
            new
            {
                isPlayerCorrect = isPlayer2Correct,
                rewardStatements = player2rewardStatement,
                player1Score = game.Player1Score,
                player2Score = game.Player2Score,
            });

        await Clients.Group(game.RoomCode).SendAsync("SetGamePhase",
            new { phase = GamePhase.Result });
    }

    private long GetUserId()
    {
        string? sub = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(sub))
            throw new HubException("Unauthorized: missing claim");

        return long.Parse(sub);
    }

    private async Task<List<FactGroupDTO>> GetAllPlayerFact(long userId)
    {
        List<FactGroup> factGroups = await _db.FactGroups
                .Include(g => g.Facts)
                .Where(g => g.UserId == userId)
                .ToListAsync();

        return factGroups.Select(g => new FactGroupDTO(g)).ToList();
    }

    private async Task<List<object>> GetRewardStatements(
    long[] statementIds,
    long targetUserId)
    {
        List<object> rewards = [];

        foreach (long factId in statementIds)
        {
            if (factId == 0)
                continue;

            UserFact? fact = await _db.Facts.FindAsync(factId);
            if (fact == null)
                throw new KeyNotFoundException($"Fact with id {factId} is not found");

            bool alreadyShared = await _db.SharedFacts
                .AnyAsync(sf => sf.FactId == factId && sf.UserId == targetUserId);

            if (!alreadyShared)
                rewards.Add(new { id = factId, fact.Description });
        }

        return rewards;
    }

    public async Task KickPlayer(KickPlayerRequest request)
    {
        long userId = GetUserId();
        string roomKey = $"{RedisConstant.RoomPrefix}{request.RoomCode}";
        Room room = await _redisService.GetAsync<Room>(roomKey) ?? throw new HubException($"Room not found");

        if (room.GetPlayerSlot(userId) != PlayerSlot.Player1)
            return;
            
        await _redisService.DeleteAsync($"{RedisConstant.UserRoomPrefix}{room.Player2!.Id}");

        string player2Id = room.Player2!.Id.ToString();
        room.Player2 = null;
        await _redisService.UpdateAsync<Room>(roomKey, room);

        await Clients.User(player2Id).SendAsync("Disconnect");
        await Clients.Group(request.RoomCode).SendAsync("Player2LeaveRoom");
    }

    public async Task Disconnect()
    {
        long userId = GetUserId();
        string userRoomKey = $"{RedisConstant.UserRoomPrefix}{userId}";

        string? roomCode = await _redisService.GetAsync<string>(userRoomKey);
        if (string.IsNullOrEmpty(roomCode))
            throw new KeyNotFoundException($"User with id {userId} is not in a room");

        await _redisService.DeleteAsync(userRoomKey);

        string roomKey = $"{RedisConstant.RoomPrefix}{roomCode}";
        Room room = await _redisService.GetAsync<Room>(roomKey) ?? throw new HubException($"Room not found");

        if (!room.HasGameStarted && room.GetPlayerSlot(userId) == PlayerSlot.Player2)
        {
            room.Player2 = null;
            await _redisService.UpdateAsync<Room>(roomKey, room);

            await Clients.Caller.SendAsync("Disconnect");
            await Clients.Group(roomCode).SendAsync("Player2LeaveRoom");
            return;
        }

        if (!room.HasGameStarted)
        {
            string gameKey = $"{RedisConstant.GamePrefix}{roomCode}";
            await _redisService.DeleteAsync(gameKey);
        }
        await _redisService.DeleteAsync($"{RedisConstant.UserRoomPrefix}{room.Player2}");
        await _redisService.DeleteAsync(roomKey);
        await Clients.Group(roomCode).SendAsync("Disconnect");
    }
    
}