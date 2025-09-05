public static class Util
{
    public static string GetRandomCode()
    {
        return Guid.NewGuid().ToString("N")[..6].ToUpper();
    }

    public static long[] BuildPlayerOptions(long factId1, long factId2)
    {
        // include the lie as ID = 0
        var options = new List<long> { factId1, factId2, 0 };

        var rnd = new Random();
        return options.OrderBy(_ => rnd.Next()).ToArray();
    }
}