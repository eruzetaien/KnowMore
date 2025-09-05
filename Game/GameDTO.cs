using System.ComponentModel.DataAnnotations;

public class CreateRoomDto
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(50, MinimumLength = 4, ErrorMessage = "Name must be between 4 and 50 characters.")]
    [RegularExpression(@"^\S(.*\S)?$", ErrorMessage = "Name cannot start or end with whitespace.")]
    public string Name { get; set; } = string.Empty;
}

public enum Emoticon
{
    None = 0,
    Shocked = 1
}

public enum GamePhase
{
    Preparation = 0,
    Playing = 1,
    Result = 1,
}

public class JoinRoomRequest()
{
    public string RoomCode { get; set; } = string.Empty;
}

public class SetPlayerReadyStateRequest()
{
    public string RoomCode { get; set; } = string.Empty;
    public bool IsReady { get; set; }
}

public class SendEmoticonRequest()
{
    public string RoomCode { get; set; } = string.Empty;
    public Emoticon Emoticon { get; set; }
}

public class SendOptionsRequest()
{
    public string RoomCode { get; set; } = string.Empty;
    public string Lie { get; set; } = string.Empty; 
    public long FactId1 { get; set;} 
    public long FactId2 { get; set;} 
}
