using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

public class CreateFactDTO
{
    [Required(ErrorMessage = "Description is required.")]
    [StringLength(200, ErrorMessage = "Description cannot exceed 200 characters.")]
    [RegularExpression(@"^\S(.*\S)?$", ErrorMessage = "Description cannot start or end with whitespace.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "FactGroupId is required.")]
    public long FactGroupId { get; set; }   // FK to FactGroup
}

public class UpdateFactDTO
{
    [Required(ErrorMessage = "Description is required.")]
    [StringLength(200, ErrorMessage = "Description cannot exceed 200 characters.")]
    [RegularExpression(@"^\S(.*\S)?$", ErrorMessage = "Description cannot start or end with whitespace.")]
    public string Description { get; set; } = string.Empty;
}

public class CreateFactGroupDTO
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(50, MinimumLength = 4, ErrorMessage = "Name must be between 4 and 50 characters.")]
    [RegularExpression(@"^\S(.*\S)?$", ErrorMessage = "Name cannot start or end with whitespace.")]
    public string Name { get; set; } = string.Empty;
}

public class FactDTO
{
    public  long Id { get; set; }
    public  long UserId { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public  long? FactGroupId { get; set; }

    public string Description { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
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


public class FactGroupDTO
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<FactDTO> Facts { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
}