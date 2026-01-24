public class FactDTO
{
    public string Id { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public FactDTO(UserFact fact)
    {
        Id = fact.Id.ToString();
        Description = fact.Description;
    }
    public FactDTO() { }
}

public class FactGroupDTO
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<FactDTO> Facts { get; set; } = [];

    public FactGroupDTO(FactGroup factGroup)
    {
        Id = factGroup.Id.ToString();
        Name = factGroup.Name;
        Facts = factGroup.Facts.Select(f => new FactDTO(f)).ToList();
    }
    public FactGroupDTO() {}
}

public class ShareFactInfoDTO
{
    public string FactId { get; set; } = string.Empty;
    public string TargetUserId { get; set; } = string.Empty;
    public bool IsShared { get; set; }
    public string? Description { get; set; }
}