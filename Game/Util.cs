public static class Util
{
    public static string GetRandomCode()
    {
        return Guid.NewGuid().ToString("N")[..6].ToUpper();
    }

    public static long[] BuildPlayerStatements(long factId1, long factId2)
    {
        // include the lie as ID = 0
        List<long> statements = [factId1, factId2, 0];

        var rnd = new Random();
        return statements.OrderBy(_ => rnd.Next()).ToArray();
    }
}