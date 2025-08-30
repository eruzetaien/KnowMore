using Microsoft.EntityFrameworkCore;
using DotNetEnv;
using SnowflakeGenerator;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IdentityModel.Tokens.Jwt;

var builder = WebApplication.CreateBuilder(args);

// Load .env variables
Env.Load();

string jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET")
                    ?? throw new InvalidOperationException("Missing Jwt:Key");
byte[] jwtKeyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services
    .AddDatabase<UserDb>()
    .AddSnowflake(machineId: 1)
    .AddJwtAuth(jwtKeyBytes)
    .AddGoogleAuth()
    .AddCustomCors()
    .AddSwagger(documentName:"KnowMoreUserAPI", title:"KnowMoreUserAPI", version:"v1");

var app = builder.Build();

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseOpenApi();
    app.UseSwaggerUi(config =>
    {
        config.DocumentTitle = "KnowMoreUserAPI";
        config.Path = "/swagger";
        config.DocumentPath = "/swagger/{documentName}/swagger.json";
        config.DocExpansion = "list";
    });
}

static async Task ChallengeProvider(HttpContext context, string provider)
{
    var authProperties = new AuthenticationProperties
    {
        RedirectUri = "/login-callback"
    };
    await context.ChallengeAsync(provider, authProperties);
}
app.MapGet("/login/google", (HttpContext context) => ChallengeProvider(context, "Google"));

app.MapGet("/login-callback", async (HttpContext context, UserDb db, Snowflake snowflake) =>
{
    if (!(context.User.Identity?.IsAuthenticated ?? false))
        return Results.Unauthorized();

    string? provider = context.User.FindFirst("provider")?.Value;
    string? providerId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    if (string.IsNullOrEmpty(provider) || string.IsNullOrEmpty(providerId))
        return Results.Unauthorized();

    AppUser? user = await db.Users
        .FirstOrDefaultAsync(u => u.Provider == provider && u.ProviderId == providerId);

    if (user is null)
    {
        long id = snowflake.NextID();

        string username;
        do
        {
            username = Util.GetRandomUsername();
        }
        while (await db.Users.AnyAsync(u => u.Username == username));

        user = new AppUser
        {
            Id = id,
            Provider = provider,
            ProviderId = providerId,
            Username = username,
            NormalizedUsername = username.ToLowerInvariant(),
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
    }

    // Issue JWT
    SigningCredentials creds = new(
        new SymmetricSecurityKey(jwtKeyBytes),
        SecurityAlgorithms.HmacSha256
    );

    Claim[] claims =
    [
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString())
    ];

    JwtSecurityToken token = new(
        claims: claims,
        expires: DateTime.UtcNow.AddHours(8),
        signingCredentials: creds
    );

    string tokenString = new JwtSecurityTokenHandler().WriteToken(token);

    context.Response.Cookies.Append("jwt", tokenString, new CookieOptions
    {
        HttpOnly = true,
        Secure = false,
        SameSite = SameSiteMode.Strict,
        Expires = DateTime.UtcNow.AddHours(8)
    });

    return Results.Redirect("http://localhost:5173");
});

app.MapGet("/me", async (ClaimsPrincipal userClaim, UserDb db) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    AppUser? user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
    if (user is null)
        return Results.NotFound();

    return Results.Ok(new UserDTO(user));
})
.RequireAuthorization();

app.MapPut("/update", async (ClaimsPrincipal userClaim, UpdateUserDTO updateDto, UserDb db) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    var user = await db.Users.FindAsync(userId);
    if (user == null) return Results.NotFound();

    // Validation
    if (!string.IsNullOrWhiteSpace(updateDto.Username))
    {
        string normalizedUsername = updateDto.Username.ToLowerInvariant();
        if (await db.Users.AnyAsync(u =>
            u.NormalizedUsername == normalizedUsername &&
            u.Id != userId))
        {
            return TypedResults.BadRequest($"Username '{updateDto.Username}' already exists.");
        }
    }

    // Update
    if (!string.IsNullOrWhiteSpace(updateDto.Username))
        user.Username = updateDto.Username;

    if (!string.IsNullOrWhiteSpace(updateDto.Description))
        user.Description = updateDto.Description;

    user.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();

    return Results.Ok(new UserDTO(user));
})
.RequireAuthorization()
.AddEndpointFilter<ValidationFilter<UpdateUserDTO>>();

app.Run();
