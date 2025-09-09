using Microsoft.EntityFrameworkCore;
using SnowflakeGenerator;
using System.Security.Claims;

public static class SharedFactHandler
{
    public static IEndpointRouteBuilder RegisterSharedFactHandler(this IEndpointRouteBuilder app)
    {
        app.MapPost("/shared-facts/{factId}", async (ClaimsPrincipal userClaim, long factId, FactDb db) =>
        {
            if (!userClaim.TryGetUserId(out long userId))
                return Results.Unauthorized();

            bool exists = await db.SharedFacts
                .AnyAsync(sf => sf.FactId == factId && sf.UserId == userId);

            if (exists)
                return Results.Conflict(new[] { "Fact already shared with this user." });

            SharedFact sharedFact = new() { FactId = factId, UserId = userId };
            db.SharedFacts.Add(sharedFact);
            await db.SaveChangesAsync();

            return Results.Created($"/shared-facts/{factId}/{userId}", sharedFact);
        })
        .RequireAuthorization();

        app.MapGet("/internal/shared-facts/{factId}/info", async (HttpContext context, long factId, long targetUserId, FactDb db) =>
        {
            if (!context.Request.Headers.TryGetValue("X-API-KEY", out var key) || key != Environment.GetEnvironmentVariable("API_KEY"))
                return Results.Unauthorized();  

            UserFact? fact = await db.Facts.FindAsync(factId);
            if (fact == null)
                return Results.NotFound("Fact does not exist.");

            bool alreadyShared = await db.SharedFacts
                .AnyAsync(sf => sf.FactId == factId && sf.UserId == targetUserId);

            if (alreadyShared)
            {
                return Results.Ok(new ShareFactInfoDTO
                { 
                    FactId = factId, 
                    TargetUserId = targetUserId, 
                    IsShared = true,
                });
            }

            return Results.Ok(new ShareFactInfoDTO
            { 
                FactId = factId, 
                TargetUserId = targetUserId, 
                IsShared = false,
                Description = fact.Description 
            });
        });


        return app;
    }
}
