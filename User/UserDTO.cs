using System.ComponentModel.DataAnnotations;

public class UpdateUserDTO
{
    [StringLength(20, MinimumLength = 4, ErrorMessage = "Username must be between 4 and 20 characters.")]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username can only contain letters, numbers, and underscores.")]
    public string? Username { get; set; }

    [StringLength(200, ErrorMessage = "Description cannot exceed 200 characters.")]
    [RegularExpression(@"^\S(.*\S)?$", ErrorMessage = "Description cannot start or end with whitespace.")]
    public string? Description { get; set; }
}

public class UserDTO
{
    public string Username { get; set; }
    public string Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; } 
    public UserDTO(AppUser user) =>
    (Username, Description, CreatedAt, UpdatedAt) = (user.Username, user.Description, user.CreatedAt, user.UpdatedAt);
}

public enum UserAction
{
    Created,
    Updated,
    Deleted
}

public record UserEvent(UserAction action, long UserId, string Username);
