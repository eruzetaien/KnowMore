public class CreateUserDTO
{
    public string Username { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class UserDTO
{
    public long Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public UserDTO(AppUser user) =>
    (Id, Username, Description) = (user.Id, user.Username, user.Description);
}
