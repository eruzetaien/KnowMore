using System.ComponentModel.DataAnnotations;

public class FactDTO
{
    public long Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public FactDTO(UserFact fact)
    {
        Id = fact.Id;
        Description = fact.Description;
    }
}

public class FactGroupDTO
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<FactDTO> Facts { get; set; } = [];

    public FactGroupDTO(FactGroup factGroup)
    {
        Id = factGroup.Id;
        Name = factGroup.Name;
        Facts = factGroup.Facts.Select(f => new FactDTO(f)).ToList();
    }

}

public class ShareFactInfoDTO
{
    public long FactId { get; set; }
    public long TargetUserId { get; set; }
    public bool IsShared { get; set; }
    public string? Description { get; set; }
}