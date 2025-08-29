using System.Security.Claims;
using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using SnowflakeGenerator;
using Sprache;

var builder = WebApplication.CreateBuilder(args);

// Load .env variables
Env.Load();

builder.Services
    .AddDatabase<FactDb>()
    .AddSnowflake(machineId:1)
    .AddJwtAuth()
    .AddCustomCors()
    .AddSwagger(documentName:"KnowMoreFactAPI", title:"KnowMoreFactAPI", version:"v1");

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

app.MapGet("/groups", async (HttpContext context, FactDb db) =>
{
    string? sub = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(sub) || !long.TryParse(sub, out var userId))
        return Results.Unauthorized();


    var factGroups = await db.FactGroups
        .Include(g => g.Facts)
        .Where(g => g.UserId == userId)
        .ToListAsync();

    var factGroupDtoList = factGroups.Select(g => new FactGroupDTO
    {
        Id = g.Id,
        UserId = g.UserId,
        Name = g.Name,
        CreatedAt = g.CreatedAt,
        UpdatedAt = g.UpdatedAt,
        Facts = g.Facts.Select(f => new FactDTO(f, isOwner: true)).ToList()
    }).ToList();

    return Results.Ok(factGroupDtoList);
})
.RequireAuthorization();

app.MapGet("/groups/{id}", async (HttpContext context, long id, FactDb db) =>
{
    string? sub = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(sub) || !long.TryParse(sub, out var userId))
    {
        return Results.Unauthorized();
    }

    FactGroup? factGroup = await db.FactGroups
        .Where(g => g.Id == id && g.UserId == userId)
        .Include(g => g.Facts)
        .FirstOrDefaultAsync();

    return factGroup is not null
        ? Results.Ok(factGroup)
        : Results.NotFound();
})
.RequireAuthorization();

app.MapPost("/groups", async (HttpContext context, CreateFactGroupDTO createDto, FactDb db, Snowflake snowflake) =>
{
    string sub = context.User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    long userId = long.Parse(sub);
    
    // Uniqueness name validation
    string normalizedName = createDto.Name.ToLowerInvariant();
    if (await db.FactGroups.AnyAsync(u =>
        u.NormalizedName == normalizedName &&
        u.Id != userId))
    {
        return Results.BadRequest(new[] { $"FactGroup with name '{createDto.Name}' already exists." });
    }

    long factGroupId = snowflake.NextID();
        
    FactGroup factGroup = new FactGroup
    {
        Id = factGroupId,
        UserId = userId,
        Name = createDto.Name,
        NormalizedName = normalizedName
    };

    db.FactGroups.Add(factGroup);
    await db.SaveChangesAsync();

    return Results.Created($"/groups/{factGroupId}", factGroup);
})
.RequireAuthorization()
.AddEndpointFilter<ValidationFilter<CreateFactGroupDTO>>();

app.MapPost("/facts", async (HttpContext context, CreateFactDTO createDto, FactDb db, Snowflake snowflake ) =>
{
    string sub = context.User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    long userId = long.Parse(sub);

    FactGroup? factGroup = await db.FactGroups
        .Where(g => g.Id == createDto.FactGroupId && g.UserId == userId)
        .FirstOrDefaultAsync();

    if (factGroup == null) { 
        return Results.BadRequest(new[] {"FactGroup does not exist."});
    }

    long factId = snowflake.NextID();

    UserFact fact = new UserFact
    {
        Id = factId,
        UserId = userId,
        Description = createDto.Description,
        FactGroupId = factGroup.Id,
        Group = factGroup  
    };

    factGroup.Facts.Add(fact);

    db.Facts.Add(fact);
    await db.SaveChangesAsync();

    return TypedResults.Created($"/facts/{fact.Id}", new FactDTO(fact:fact, isOwner:true));
})
.RequireAuthorization()
.AddEndpointFilter<ValidationFilter<CreateFactDTO>>();

app.MapPut("/facts/{id}", async (HttpContext context, long id, UpdateFactDTO updateDto, FactDb db) =>
{
    string sub = context.User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    long userId = long.Parse(sub);

    UserFact? fact = await db.Facts.FirstOrDefaultAsync(u => u.Id == id && u.UserId == userId);
    if (fact == null)  
        return Results.BadRequest(new[] {"Fact does not exist."});

    fact.Description = updateDto.Description;
    fact.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return TypedResults.Ok(new FactDTO(fact:fact, isOwner:true));
})
.RequireAuthorization()
.AddEndpointFilter<ValidationFilter<UpdateFactDTO>>();

app.Run();
