using System.ComponentModel.DataAnnotations;

public class FactDTO
{
    public  long Id { get; set; }
    public  long UserId { get; set; }

    public string Description { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ShareFactInfoDTO
{
    public  long FactId { get; set; }
    public  long TargetUserId { get; set; }
    public bool IsShared { get; set; }
    public string? Description { get; set; }
}