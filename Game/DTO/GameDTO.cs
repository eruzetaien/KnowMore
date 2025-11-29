using System.ComponentModel.DataAnnotations;

public class CreateRoomDto
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(50, MinimumLength = 4, ErrorMessage = "Name must be between 4 and 50 characters.")]
    [RegularExpression(@"^\S(.*\S)?$", ErrorMessage = "Name cannot start or end with whitespace.")]
    public string Name { get; set; } = string.Empty;
}

public class RoomDto
{
    public string JoinCode { get; set; }
    public string Name { get; set; }
    public string RoomMaster { get; set; }

    public RoomDto(Room room)
    {
        JoinCode = room.JoinCode;
        Name = room.Name;
        RoomMaster = room.Player1.Name;
    }
}

public enum Emoticon
{
    None = 0,
    Shocked = 1
}

public enum GamePhase
{
    None = 0,
    Preparation = 1,
    Playing = 2,
    Result = 3,
}

public class RoomRequest
{
    public string RoomCode { get; set; } = string.Empty;
}

public class JoinRoomRequest : RoomRequest {}

public class KickPlayerRequest : RoomRequest {}


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

public class SendStatementsRequest()
{
    public string RoomCode { get; set; } = string.Empty;
    public string Lie { get; set; } = string.Empty;
    public long FactId1 { get; set; }
    public long FactId2 { get; set; }
}

public class SendAnswerRequest()
{
    public string RoomCode { get; set; } = string.Empty;
    public int answerIdx { get; set; }
}

public class SendRewardChoiceRequest()
{
    public long factId { get; set;} 
}

public record UserNameDto(string Username);