public class Room
{
    public required string JoinCode { get; set; }
    public required string Name { get; set; }
    public required long RoomMaster { get; set; } 
    public long? SecondPlayer { get; set; } 
    public bool IsPlayer1Ready { get; set; } 
    public bool IsPlayer2Ready { get; set; } 
    public bool HasGameStarted { get; set; } 
}