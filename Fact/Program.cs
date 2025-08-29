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

app.MapGet("/groups", async (ClaimsPrincipal userClaim, FactDb db) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();


    var factGroups = await db.FactGroups
        .Include(g => g.Facts)
        .Where(g => g.UserId == userId)
        .ToListAsync();

    List<FactGroupDTO> factGroupDtoList = factGroups.Select(g => new FactGroupDTO(g)).ToList();

    return Results.Ok(factGroupDtoList);
})
.RequireAuthorization();

app.MapGet("/groups/{id}", async (ClaimsPrincipal userClaim, long id, FactDb db) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    FactGroup? factGroup = await db.FactGroups
        .Where(g => g.Id == id && g.UserId == userId)
        .Include(g => g.Facts)
        .FirstOrDefaultAsync();

    return factGroup is not null
        ? Results.Ok(new FactGroupDTO(factGroup))
        : Results.NotFound();
})
.RequireAuthorization();

app.MapPost("/groups", async (ClaimsPrincipal userClaim, FactGroupInputBaseDto createDto, FactDb db, Snowflake snowflake) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    // Uniqueness name validation
    string normalizedName = createDto.Name.ToLowerInvariant();
    if (await db.FactGroups.AnyAsync(u =>
        u.NormalizedName == normalizedName &&
        u.UserId != userId))
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

    return Results.Created($"/groups/{factGroupId}", new FactGroupDTO(factGroup));
})
.RequireAuthorization()
.AddEndpointFilter<ValidationFilter<FactGroupInputBaseDto>>();

app.MapPut("/groups/{id}", async (ClaimsPrincipal userClaim, long id, FactGroupInputBaseDto updateDto, FactDb db) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    // Uniqueness name validation
    string normalizedName = updateDto.Name.ToLowerInvariant();
    if (await db.FactGroups.AnyAsync(u =>
        u.NormalizedName == normalizedName &&
        u.UserId != userId &&
        u.Id != id))
    {
        return Results.BadRequest(new[] { $"FactGroup with name '{updateDto.Name}' already exists." });
    }

    FactGroup? factGroup = await db.FactGroups.FirstOrDefaultAsync(u => u.Id == id && u.UserId == userId);
    if (factGroup == null)
        return Results.NotFound("FactGroup does not exist.");

    factGroup.Name = updateDto.Name;
    factGroup.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok(new FactGroupDTO(factGroup));
})
.RequireAuthorization()
.AddEndpointFilter<ValidationFilter<FactGroupInputBaseDto>>();


app.MapDelete("/groups/{id}", async (ClaimsPrincipal userClaim, long id, FactDb db) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    FactGroup? factGroup = await db.FactGroups.FirstOrDefaultAsync(u => u.Id == id && u.UserId == userId);
    if (factGroup == null)
        return Results.NotFound("FactGroup does not exist.");

    db.FactGroups.Remove(factGroup);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.RequireAuthorization();

app.MapPost("/facts", async (ClaimsPrincipal userClaim, CreateFactDTO createDto, FactDb db, Snowflake snowflake ) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

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

app.MapPut("/facts/{id}", async (ClaimsPrincipal userClaim, long id, UpdateFactDTO updateDto, FactDb db) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    UserFact? fact = await db.Facts.FirstOrDefaultAsync(u => u.Id == id && u.UserId == userId);
    if (fact == null)
        return Results.BadRequest(new[] { "Fact does not exist." });

    fact.Description = updateDto.Description;
    fact.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return TypedResults.Ok(new FactDTO(fact: fact, isOwner: true));
})
.RequireAuthorization()
.AddEndpointFilter<ValidationFilter<UpdateFactDTO>>();

app.MapDelete("/facts/{id}", async (ClaimsPrincipal userClaim, long id, FactDb db) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    UserFact? fact = await db.Facts.FirstOrDefaultAsync(u => u.Id == id && u.UserId == userId);
    if (fact == null)
        return Results.NotFound("Fact does not exist.");

    db.Facts.Remove(fact);
    await db.SaveChangesAsync();

    return Results.NoContent(); ;
})
.RequireAuthorization();

app.MapGet("/facts/{id}", async (ClaimsPrincipal userClaim, long id, FactDb db) =>
{
    if (!userClaim.TryGetUserId(out long userId))
        return Results.Unauthorized();

    UserFact? fact = await db.Facts.FirstOrDefaultAsync(u => u.Id == id && u.UserId == userId);
    if (fact == null)
        return Results.NotFound("Fact does not exist.");

    return Results.Ok(new FactDTO(fact));
})
.RequireAuthorization();

app.Run();
