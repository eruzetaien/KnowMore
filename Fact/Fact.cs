public class UserFact
{
    public required long Id { get; set; }
    public required long UserId { get; set; }
    public required string Description { get; set; }
    public long FactGroupId { get; set; }   // FK to FactGroup
    public FactGroup? Group { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class FactGroup
{
    public required long Id { get; set; }
    public required long UserId { get; set; }
    public required string Name { get; set; }
    public required string NormalizedName { get; set; }

    public List<UserFact> Facts { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}