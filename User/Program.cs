using Microsoft.EntityFrameworkCore;
using DotNetEnv;
using SnowflakeGenerator;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

// Load .env variables
Env.Load();

// Build connection string from env vars
var connectionString =
    $"Host={Environment.GetEnvironmentVariable("DB_HOST")};" +
    $"Port={Environment.GetEnvironmentVariable("DB_PORT")};" +
    $"Database={Environment.GetEnvironmentVariable("DB_NAME")};" +
    $"Username={Environment.GetEnvironmentVariable("DB_USER")};" +
    $"Password={Environment.GetEnvironmentVariable("DB_PASSWORD")}";

// Register DbContext with PostgreSQL
builder.Services.AddDbContext<UserDb>(options =>
    options.UseNpgsql(connectionString));

// Register Snowflake ID generator 
Settings settings = new()
{ 
    MachineID = 1,
    CustomEpoch = new DateTimeOffset(2025, 8, 23, 0, 0, 0, TimeSpan.Zero)
};
builder.Services.AddSingleton<Snowflake>(sp => new Snowflake(settings));

// Login with Google Service & Configure JWT 
string jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET")
             ?? throw new InvalidOperationException("Missing Jwt:Key");

byte[] jwtKeyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "Cookies";
    options.DefaultChallengeScheme = "Google";
})
.AddCookie("Cookies")
.AddGoogle("Google", options =>
{
    options.ClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID")
        ?? throw new InvalidOperationException("Missing GOOGLE_CLIENT_ID environment variable.");

    options.ClientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET")
        ?? throw new InvalidOperationException("Missing GOOGLE_CLIENT_SECRET environment variable.");

    options.Scope.Clear();
    options.Scope.Add("email");
    options.SaveTokens = true;

    options.Events.OnCreatingTicket = ctx =>
    {
        var identity = (ClaimsIdentity)ctx.Principal!.Identity!;
        identity.AddClaim(new Claim("provider", "Google"));

        return Task.CompletedTask;
    };
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = false, // For Dev 
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(jwtKeyBytes)
    };
});
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

// Configure Swagger Middleware
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApiDocument(config =>
{
    config.DocumentName = "KnowMoreUserAPI";
    config.Title = "KnowMoreUserAPI v1";
    config.Version = "v1";
});

var app = builder.Build();

app.UseCors();
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

RouteGroupBuilder userGroup = app.MapGroup("users");

app.MapGet("/login/{provider}", async (HttpContext context, string provider) =>
{
    var authProperties = new AuthenticationProperties
    {
        RedirectUri = "/login-callback"
    };

    await context.ChallengeAsync(provider, authProperties);
});

app.MapGet("/login-callback", async (HttpContext context, UserDb db, Snowflake snowflake) =>
{
    if (context.User.Identity?.IsAuthenticated ?? false)
    {
        string? provider = context.User.FindFirst("provider")?.Value;
        string? providerId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (providerId is not null && provider is not null)
        {
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
                    Description = string.Empty
                };

                db.Users.Add(user);
                await db.SaveChangesAsync();
            }

            // JWT
            SigningCredentials creds = new(new SymmetricSecurityKey(jwtKeyBytes), SecurityAlgorithms.HmacSha256);
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
            return Results.Ok(new UserDTO(user, tokenString));
        }
    }

    return Results.Unauthorized();
});

app.MapGet("/me", async (HttpContext context, UserDb db) =>
{
    if (context.User.Identity?.IsAuthenticated != true)
        return Results.Json(new { error = "User is not authenticated" }, statusCode: 401);

    string? sub = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(sub) || !long.TryParse(sub, out long userId))
    { 
        var claims = context.User.Claims.Select(c => new { c.Type, c.Value });
        return Results.Json(new { error = "JWT claim missing", claims }, statusCode: 401);
    }

    AppUser? user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
    if (user is null)
        return Results.Json(new { error = "User not found in database" }, statusCode: 401);

    return Results.Ok(new UserDTO(user, sub));
})
.RequireAuthorization(new AuthorizeAttribute { AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme });

app.MapGet("/logout", async (HttpContext context) =>
{
    await context.SignOutAsync("Cookies");
    return Results.Redirect("/");
});

app.Run();
