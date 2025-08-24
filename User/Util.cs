public static class Util
{
    public static string GetRandomUsername()
    {
        Guid guid = Guid.NewGuid();
        return "user_" + guid.ToString("N").Substring(0, 8);
    }
}