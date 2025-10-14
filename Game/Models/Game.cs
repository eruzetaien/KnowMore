public enum PlayerSlot
{
    None = 0,
    Player1 = 1,
    Player2 = 2
}

public abstract class HasPlayersBase
{
    public long Player1 { get; set; }
    public long Player2 { get; set; }
    public string Player1Name { get; set; } = string.Empty;
    public string Player2Name { get; set; } = string.Empty;

    public PlayerSlot GetPlayerSlot(long userId) =>
        userId == Player1 ? PlayerSlot.Player1 : userId == Player2 ? PlayerSlot.Player2 : PlayerSlot.None;
}


public class Room : HasPlayersBase
{
    public required string JoinCode { get; set; }
    public required string Name { get; set; }
    public bool IsPlayer1Ready { get; set; }
    public bool IsPlayer2Ready { get; set; }
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
    public bool IsPlayer1Ready { get; set; }
    public bool IsPlayer2Ready { get; set; }
    public List<FactGroupDTO> Player1Facts { get; set; } = [];
    public List<FactGroupDTO> Player2Facts { get; set; } = [];
    public Dictionary<long, string> PlayerFactDescriptionMap { get; set; } = [];
}