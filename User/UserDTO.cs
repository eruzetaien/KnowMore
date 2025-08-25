using System.ComponentModel.DataAnnotations;

public class CreateUserDTO
{
    [Required(ErrorMessage = "Username is required.")]
    [StringLength(20, MinimumLength = 4, ErrorMessage = "Username must be between 4 and 20 characters.")]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username can only contain letters, numbers, and underscores.")]
    public string Username { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "Description cannot exceed 200 characters.")]
    public string Description { get; set; } = string.Empty;
}

public class UserDTO
{
    public string Username { get; set; }
    public string Description { get; set; }
    public string Token { get; set; }
    public UserDTO(AppUser user, string userToken)
    {
        Username = user.Username;
        Description = user.Description;
        Token = userToken;
    }
}

