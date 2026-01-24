using System.Text.Json;
using StackExchange.Redis;

public class RedisService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;

    public RedisService(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _db = _redis.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        RedisValue value = await _db.StringGetAsync(key);

        if (!value.HasValue)
            return default!;

        try
        {
            return JsonSerializer.Deserialize<T>((string)value!)
                ?? throw new InvalidOperationException($"{typeof(T).Name} data corrupted");
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Failed to deserialize cached {typeof(T).Name} data. The stored JSON may be invalid or corrupted.", ex);
        }
    }

    public async Task UpdateAsync<T>(string key, T entity) {
        string updatedJson = JsonSerializer.Serialize(entity);
        await _db.StringSetAsync(key, updatedJson); 
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        string json = JsonSerializer.Serialize(value);
        await _db.StringSetAsync(key, json, expiry);
    }

    public async Task DeleteAsync(string key)
        => await _db.KeyDeleteAsync(key);

    public async Task<bool> ExistsAsync(string key)
        => await _db.KeyExistsAsync(key);

    public async Task AddToSortedSetAsync(string setKey, string member, double score)
        => await _db.SortedSetAddAsync(setKey, member, score);
        
    public async Task RemoveFromSortedSetAsync(string setKey, string member)
        => await _db.SortedSetRemoveAsync(setKey, member);

    public async Task<RedisValue[]> GetRangeByScoreAsync(string key, double min, double max)
        => await _db.SortedSetRangeByScoreAsync(key, min, max);

    public async Task<RedisValue[]> GetManyAsync(IEnumerable<string> keys)
    {
        RedisKey[] redisKeys = keys.Select(k => (RedisKey)k).ToArray();
        return await _db.StringGetAsync(redisKeys);
    }

    public async Task RemoveFromSortedSetAsync(string key, IEnumerable<RedisValue> values)
        => await _db.SortedSetRemoveAsync(key, values.ToArray());
}
