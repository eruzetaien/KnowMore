public class UserServiceClient
{
    private readonly IHttpClientFactory _httpClientFactory;

    public UserServiceClient(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<string> GetPlayerName(long userId)
    {
        HttpClient client = _httpClientFactory.CreateClient("UserService");
        HttpResponseMessage response = await client.GetAsync($"/internal/users/{userId}/name");

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"User service returned {(int)response.StatusCode} {response.StatusCode} for userId={userId}"
            );
        }

        UserNameDto? playerName = await response.Content.ReadFromJsonAsync<UserNameDto>();
        if (playerName == null)
            throw new InvalidOperationException("API response did not contain a valid UserNameDto.");

        return playerName.Username;
    }
}
