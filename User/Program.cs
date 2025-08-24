using Microsoft.EntityFrameworkCore;
using DotNetEnv;
using SnowflakeGenerator;
using System.ComponentModel.DataAnnotations;

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

// Configure Swagger Middleware
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApiDocument(config =>
{
    config.DocumentName = "KnowMoreUserAPI";
    config.Title = "KnowMoreUserAPI v1";
    config.Version = "v1";
});

var app = builder.Build();

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

RouteGroupBuilder userItems = app.MapGroup("users");

userItems.MapGet("/", GetAllUsers);
userItems.MapPost("/", CreateUser);
userItems.MapGet("/{id}", GetUser);

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
    // Data validation 
    var context = new ValidationContext(userDTO, serviceProvider: null, items: null);
    var results = new List<ValidationResult>();
    if (!Validator.TryValidateObject(userDTO, context, results, true))
    {
        return TypedResults.BadRequest(results.Select(r => r.ErrorMessage));
    }

    // Ensure unique username
    String normalizedUsername = userDTO.Username.ToLowerInvariant();
    if (await db.Users.AnyAsync(u => u.NormalizedUsername == normalizedUsername))
    {
        return TypedResults.BadRequest($"Username '{userDTO.Username}' already exists.");
    }

    AppUser user = new()
    {
        Id = snowflake.NextID(),
        Username = userDTO.Username,
        NormalizedUsername = normalizedUsername,
        Description = userDTO.Description

    };
    
    db.Users.Add(user);
    await db.SaveChangesAsync();

    return TypedResults.Created($"/users/{user.Id}", new UserDTO(user));
}