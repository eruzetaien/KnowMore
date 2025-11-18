using System.Text.Json.Serialization;

public enum PlayerSlot
{
    None = 0,
    Player1 = 1,
    Player2 = 2
}

public class PlayerData
{
    public long Id { get; set; }
    public string Name { get; set; }  = string.Empty;
    public bool IsReady { get; set;}
}

public abstract class HasPlayersBase
{
    [JsonInclude]
    public required PlayerData Player1;
    [JsonInclude]
    public PlayerData? Player2;

    public PlayerSlot GetPlayerSlot(long userId)
    {
        if (Player1.Id == userId)
            return PlayerSlot.Player1;

        if (Player2?.Id == userId)
            return PlayerSlot.Player2;

        return PlayerSlot.None;
    }
}


public class Room : HasPlayersBase
{
    public required string JoinCode { get; set; }
    public required string Name { get; set; }
    public bool HasGameStarted { get; set; }
}

public class GameData : HasPlayersBase
{
    public required string RoomCode { get; set; }
    public string Player1Lie { get; set; } = string.Empty;
    public string Player2Lie { get; set; } = string.Empty;
    public long[] Player1Statements { get; set; } = new long[3];
    public long[] Player2Statements { get; set; } = new long[3];
    public int Player1Answer { get; set; }
    public int Player2Answer { get; set; }
    public int Player1Score { get; set; }
    public int Player2Score { get; set; }
    public List<FactGroupDTO> Player1Facts { get; set; } = [];
    public List<FactGroupDTO> Player2Facts { get; set; } = [];
    public Dictionary<long, string> PlayerFactDescriptionMap { get; set; } = [];
}