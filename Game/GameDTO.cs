using System.ComponentModel.DataAnnotations;

public class CreateRoomDto
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(50, MinimumLength = 4, ErrorMessage = "Name must be between 4 and 50 characters.")]
    [RegularExpression(@"^\S(.*\S)?$", ErrorMessage = "Name cannot start or end with whitespace.")]
    public string Name { get; set; } = string.Empty;
}
