public class Room
{
    public required string JoinCode { get; set; }
    public required string Name { get; set; }
    public required long Player1 { get; set; }
    public long Player2 { get; set; }
    public bool IsPlayer1Ready { get; set; }
    public bool IsPlayer2Ready { get; set; }
    public bool HasGameStarted { get; set; }
}

public class GameData
{
    public required string RoomCode { get; set; }
    public long Player1 { get; set; }
    public long Player2 { get; set; }
    public string Player1Lie { get; set; } = string.Empty;
    public string Player2Lie { get; set; } = string.Empty;
    public long[] Player1Statements { get; set; } = new long[3];
    public long[] Player2Statements { get; set; } = new long[3];
    public int Player1Score { get; set; }
    public int Player2Score { get; set; } 
    public bool IsPlayer1Ready { get; set; }
    public bool IsPlayer2Ready { get; set; }
}