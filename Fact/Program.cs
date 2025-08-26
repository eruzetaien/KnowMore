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

app.MapGet("/groups/{id}", async (HttpContext context, long id, FactDb db) =>
{
    string? sub = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(sub) || !long.TryParse(sub, out var userId))
    {
        return Results.Unauthorized();
    }

    var factGroup = await db.FactGroups
        .Where(g => g.Id == id && g.UserId == userId)
        .FirstOrDefaultAsync();

    return factGroup is not null
        ? Results.Ok(factGroup)
        : Results.NotFound();
})
.RequireAuthorization();

app.MapPost("/groups", async (HttpContext context, CreateFactGroupDTO createDto, FactDb db, Snowflake snowflake ) =>
{
    string sub = context.User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    long userId = long.Parse(sub);

    long factGroupId = snowflake.NextID();

    FactGroup factGroup = new FactGroup
    {
        Id = factGroupId,
        UserId = userId,
        Name = createDto.Name,
        NormalizedName = createDto.Name.ToLowerInvariant()
    };

    db.FactGroups.Add(factGroup);
    await db.SaveChangesAsync();

    return TypedResults.Created($"/groups/{factGroupId}", factGroup);
})
.RequireAuthorization();

app.Run();
