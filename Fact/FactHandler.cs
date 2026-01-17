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

            var factGroupId = long.Parse(createDto.FactGroupId);
            FactGroup? factGroup = await db.FactGroups
                .Where(g => g.Id == factGroupId && g.UserId == userId)
                .FirstOrDefaultAsync();

            if (factGroup == null)
                return FactNotFound();

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

            Response<FactDTO> response = new()
            {
                Status = RequestStatus.Success,
                Message = SuccessMessages.FactCreated,
                Data = new FactDTO(fact, isOwner: true)
            };
            return Results.Created($"/facts/{fact.Id}", response);
        })
        .RequireAuthorization()
        .AddEndpointFilter<ValidationFilter<CreateFactDTO>>();

        app.MapPut("/facts/{id}", async (ClaimsPrincipal userClaim, long id, UpdateFactDTO updateDto, FactDb db) =>
        {
            if (!userClaim.TryGetUserId(out long userId))
                return Results.Unauthorized();

            UserFact? fact = await db.Facts.FirstOrDefaultAsync(u => u.Id == id && u.UserId == userId);
            if (fact == null)
                return FactNotFound();

            fact.Description = updateDto.Description;
            fact.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            Response<FactDTO> response = new()
            {
                Status = RequestStatus.Success,
                Message = SuccessMessages.FactUpdated,
                Data = new FactDTO(fact, isOwner: true)
            };
            return Results.Ok(response);
        })
        .RequireAuthorization()
        .AddEndpointFilter<ValidationFilter<UpdateFactDTO>>();

        app.MapDelete("/facts/{id}", async (ClaimsPrincipal userClaim, long id, FactDb db) =>
        {
            if (!userClaim.TryGetUserId(out long userId))
                return Results.Unauthorized();

            UserFact? fact = await db.Facts.FirstOrDefaultAsync(u => u.Id == id && u.UserId == userId);
            if (fact == null)
                return FactNotFound();

            db.Facts.Remove(fact);
            await db.SaveChangesAsync();

            Response response = new()
            {
                Status = RequestStatus.Success,
                Message = SuccessMessages.FactDeleted,
            };
            return Results.Ok(response);
        })
        .RequireAuthorization();

        app.MapGet("/facts/{id}", async (ClaimsPrincipal userClaim, long id, FactDb db) =>
        {
            if (!userClaim.TryGetUserId(out long userId))
                return Results.Unauthorized();

            UserFact? fact = await db.Facts.FirstOrDefaultAsync(u => u.Id == id && u.UserId == userId);
            if (fact == null)
                return FactNotFound();

            Response<FactDTO> response = new()
            {
                Status = RequestStatus.Success,
                Data = new FactDTO(fact, isOwner: true)
            };
            return Results.Ok(response);
        })
        .RequireAuthorization();

        return app;
    }

    private static IResult FactNotFound()
    {
        return Results.NotFound(new Response<FactDTO>
        {
            Status = RequestStatus.SystemValidationError,
            Message = ErrorMessages.FactNotFound 
        });
    }
}
