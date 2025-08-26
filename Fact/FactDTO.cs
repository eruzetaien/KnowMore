using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

public class CreateFactDTO
{
    [Required(ErrorMessage = "Description is required.")]
    [StringLength(200, ErrorMessage = "Description cannot exceed 200 characters.")]
    public required string Description { get; set; }

    public long FactGroupId { get; set; }   // FK to FactGroup
}

public class CreateFactGroupDTO
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(50, MinimumLength = 4, ErrorMessage = "Name must be between 4 and 50 characters.")]
    public required string Name { get; set; }
}

public class FactDTO
{
    public required long Id { get; set; }
    public required long UserId { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public required long? FactGroupId { get; set; }

    public required string Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public FactDTO(UserFact fact, bool isOwner)
    {
        Id = fact.Id;
        UserId = fact.UserId;
        Description = fact.Description;
        CreatedAt = fact.CreatedAt;
        UpdatedAt = fact.UpdatedAt;

        FactGroupId = isOwner ? fact.FactGroupId : null;
    }
}
