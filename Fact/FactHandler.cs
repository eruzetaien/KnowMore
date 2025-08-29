using Microsoft.EntityFrameworkCore;
using SnowflakeGenerator;
using System.Security.Claims;

public static class FactHandler
{
    public static IEndpointRouteBuilder RegisterFactHandler(this IEndpointRouteBuilder app)
    {
        app.MapPost("/facts", async (ClaimsPrincipal userClaim, CreateFactDTO createDto, FactDb db, Snowflake snowflake) =>
        {
            if (!userClaim.TryGetUserId(out long userId))
                return Results.Unauthorized();

            FactGroup? factGroup = await db.FactGroups
                .Where(g => g.Id == createDto.FactGroupId && g.UserId == userId)
                .FirstOrDefaultAsync();

            if (factGroup == null)
                return Results.BadRequest(new[] { "FactGroup does not exist." });

            long factId = snowflake.NextID();

            UserFact fact = new()
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

            return Results.Created($"/facts/{fact.Id}", new FactDTO(fact, isOwner: true));
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

            return Results.Ok(new FactDTO(fact, isOwner: true));
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

            return Results.NoContent();
        })
        .RequireAuthorization();

        app.MapGet("/facts/{id}", async (ClaimsPrincipal userClaim, long id, FactDb db) =>
        {
            if (!userClaim.TryGetUserId(out long userId))
                return Results.Unauthorized();

            UserFact? fact = await db.Facts.FirstOrDefaultAsync(u => u.Id == id && u.UserId == userId);
            if (fact == null)
                return Results.NotFound("Fact does not exist.");

            return Results.Ok(new FactDTO(fact, isOwner: true));
        })
        .RequireAuthorization();

        return app;
    }
}
