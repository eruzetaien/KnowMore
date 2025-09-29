public enum UserAction
{
    Created,
    Updated,
    Deleted
}

public record UserEvent(UserAction action, long UserId, string Username);