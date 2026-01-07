using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

public class FactInputBaseDto
{ 
    [Required(ErrorMessage = "Description is required.")]
    [StringLength(200, ErrorMessage = "Description cannot exceed 200 characters.")]
    [RegularExpression(@"^\S(.*\S)?$", ErrorMessage = "Description cannot start or end with whitespace.")]
    public string Description { get; set; } = string.Empty;
}
public class CreateFactDTO :  FactInputBaseDto
{
    [Required(ErrorMessage = "FactGroupId is required.")]
    public string FactGroupId { get; set; } = string.Empty;  // FK to FactGroup
}

public class UpdateFactDTO: FactInputBaseDto {}

public class FactGroupInputBaseDto
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(50, MinimumLength = 4, ErrorMessage = "Name must be between 4 and 50 characters.")]
    [RegularExpression(@"^\S(.*\S)?$", ErrorMessage = "Name cannot start or end with whitespace.")]
    public string Name { get; set; } = string.Empty;
}

public class FactDTO
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FactGroupId { get; set; }

    public string Description { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public FactDTO(UserFact fact, bool isOwner=true)
    {
        Id = fact.Id.ToString();
        UserId = fact.UserId.ToString();
        Description = fact.Description;
        CreatedAt = fact.CreatedAt;
        UpdatedAt = fact.UpdatedAt;

        FactGroupId = isOwner ? fact.FactGroupId.ToString() : null;
    }
}


public class FactGroupDTO
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<FactDTO> Facts { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public FactGroupDTO(FactGroup factGroup)
    {
        Id = factGroup.Id.ToString();
        UserId = factGroup.UserId.ToString();
        Name = factGroup.Name;
        Facts = factGroup.Facts.Select(f => new FactDTO(f)).ToList();
        CreatedAt = factGroup.CreatedAt;
        UpdatedAt = factGroup.UpdatedAt;
    }

}

public class ShareFactInfoDTO
{
    public string FactId { get; set; } = string.Empty;
    public string TargetUserId { get; set; } = string.Empty;
    public bool IsShared { get; set; }
    public string? Description { get; set; }
}