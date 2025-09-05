public class Room
{
    public required string JoinCode { get; set; }
    public required string Name { get; set; }
    public required long Player1 { get; set; } 
    public long? Player2 { get; set; } 
    public bool IsPlayer1Ready { get; set; } 
    public bool IsPlayer2Ready { get; set; } 
    public bool HasGameStarted { get; set; } 
}