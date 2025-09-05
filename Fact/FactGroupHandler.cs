using Microsoft.EntityFrameworkCore;
using SnowflakeGenerator;
using System.Security.Claims;

public static class FactGroupHandler
{
    public static IEndpointRouteBuilder RegisterFactGroupHandler(this IEndpointRouteBuilder app)
    {
        app.MapGet("/groups", async (ClaimsPrincipal userClaim, FactDb db) =>
        {
            if (!userClaim.TryGetUserId(out long userId))
                return Results.Unauthorized();

            var factGroups = await db.FactGroups
                .Include(g => g.Facts)
                .Where(g => g.UserId == userId)
                .ToListAsync();

            var factGroupDtoList = factGroups.Select(g => new FactGroupDTO(g)).ToList();
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

            string normalizedName = createDto.Name.ToLowerInvariant();
            if (await db.FactGroups.AnyAsync(u =>
                u.NormalizedName == normalizedName &&
                u.UserId == userId))
            {
                return Results.BadRequest(new[] { $"FactGroup with name '{createDto.Name}' already exists." });
            }

            long factGroupId = snowflake.NextID();

            FactGroup factGroup = new()
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

        return app;
    }
}
