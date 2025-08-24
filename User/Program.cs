using Microsoft.EntityFrameworkCore;
using DotNetEnv;
using SnowflakeGenerator;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;

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

// Login with Google Service
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

app.UseAuthentication();

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

userGroup.MapGet("/", GetAllUsers);
userGroup.MapPost("/", CreateUser).AddEndpointFilter<ValidationFilter<CreateUserDTO>>();
userGroup.MapGet("/{id}", GetUser);

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
            var user = await db.Users
                .FirstOrDefaultAsync(u => u.Provider == provider && u.ProviderId == providerId);

            if (user is null)
            {
                var id = snowflake.NextID();
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
            return Results.Ok(user);
        }
    }

    return Results.Unauthorized();
});

app.MapGet("/logout", async (HttpContext context) =>
{
    await context.SignOutAsync("Cookies");
    return Results.Redirect("/");
});

app.Run();

static async Task<IResult> GetAllUsers(UserDb db)
{
    return TypedResults.Ok(await db.Users.Select(x => new UserDTO(x)).ToArrayAsync());
}

static async Task<IResult> GetUser(long id, UserDb db)
{
    return await db.Users.FindAsync(id)
        is AppUser user
            ? TypedResults.Ok(new UserDTO(user))
            : TypedResults.NotFound();
}

static async Task<IResult> CreateUser(CreateUserDTO userDTO, UserDb db, Snowflake snowflake)
{
    // Ensure unique username
    String normalizedUsername = userDTO.Username.ToLowerInvariant();
    if (await db.Users.AnyAsync(u => u.NormalizedUsername == normalizedUsername))
    {
        return TypedResults.BadRequest($"Username '{userDTO.Username}' already exists.");
    }

    AppUser user = new()
    {
        Id = snowflake.NextID(),
        Provider = "Google",
        ProviderId = "",
        Username = userDTO.Username,
        NormalizedUsername = normalizedUsername,
        Description = userDTO.Description

    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return TypedResults.Created($"/users/{user.Id}", new UserDTO(user));
}
