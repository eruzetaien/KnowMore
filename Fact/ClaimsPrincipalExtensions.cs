using System.Security.Claims;

public static class ClaimsPrincipalExtensions
{
    public static bool TryGetUserId(this ClaimsPrincipal user, out long userId)
    {
        userId = 0;
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(sub, out userId);
    }
}
