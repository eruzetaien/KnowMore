using Microsoft.EntityFrameworkCore;

public class UserService
{
    private readonly FactDb _db;

    public UserService(FactDb db)
    {
        _db = db;
    }

    public async Task<string> GetUsername(long userId)
    {
        var name = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.Username)
            .FirstOrDefaultAsync();

        return name ?? string.Empty;
    }
}
