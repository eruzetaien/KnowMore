using Microsoft.EntityFrameworkCore;
using SnowflakeGenerator;
using System.Security.Claims;
using YamlDotNet.Core.Tokens;

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
                .OrderByDescending(g => g.UpdatedAt)
                .ToListAsync();

            var factGroupDtoList = factGroups.Select(g => new FactGroupDTO(g)).ToList();

            Response<List<FactGroupDTO>> response = new ()
            {
                Status = RequestStatus.Success,
                Data = factGroupDtoList
            };

            return Results.Ok(response);
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
            
            if (factGroup == null)
                return FactGroupNotFound();

            Response<FactGroupDTO> response = new()
            {
                Status = RequestStatus.Success,
                Data = new FactGroupDTO(factGroup),
            };
            return Results.Ok(response);
        })
        .RequireAuthorization();

        app.MapPost("/groups", async (ClaimsPrincipal userClaim, FactGroupInputBaseDto createDto, FactDb db, Snowflake snowflake) =>
        {
            if (!userClaim.TryGetUserId(out long userId))
                return Results.Unauthorized();

            Response<FactGroupDTO> response = new();
            string normalizedName = createDto.Name.ToLowerInvariant();
            bool isFactGroupWithSameNameExist = await db.FactGroups
                .Where(x =>  x.NormalizedName == normalizedName && x.UserId != userId)
                .AnyAsync();

            if (isFactGroupWithSameNameExist)
                return FactGroupAlreadyExists(createDto.Name);

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

            response.Status = RequestStatus.Success;
            response.Message = SuccessMessages.FactGroupCreated;
            response.Data =  new FactGroupDTO(factGroup);
            
            return Results.Created($"/groups/{factGroupId}", response);
        })
        .RequireAuthorization()
        .AddEndpointFilter<ValidationFilter<FactGroupInputBaseDto>>();

        app.MapPut("/groups/{id}", async (ClaimsPrincipal userClaim, long id, FactGroupInputBaseDto updateDto, FactDb db) =>
        {
            if (!userClaim.TryGetUserId(out long userId))
                return Results.Unauthorized();

            string normalizedName = updateDto.Name.ToLowerInvariant();
            bool isFactGroupWithSameNameExist = await db.FactGroups
                .Where(x => 
                    x.NormalizedName == normalizedName &&
                    x.UserId != userId &&
                    x.Id != id
                )
                .AnyAsync();

            if (isFactGroupWithSameNameExist)
                return FactGroupAlreadyExists(updateDto.Name);

            FactGroup? factGroup = await db.FactGroups.FirstOrDefaultAsync(u => u.Id == id && u.UserId == userId);
            if (factGroup == null)
                return FactGroupNotFound();

            factGroup.Name = updateDto.Name;
            factGroup.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            Response<FactGroupDTO> response = new()
            {
                Status = RequestStatus.Success,
                Message = SuccessMessages.FactGroupUpdated,
                Data =  new FactGroupDTO(factGroup),
            };
            return Results.Ok(response);
        })
        .RequireAuthorization()
        .AddEndpointFilter<ValidationFilter<FactGroupInputBaseDto>>();

        app.MapDelete("/groups/{id}", async (ClaimsPrincipal userClaim, long id, FactDb db) =>
        {
            if (!userClaim.TryGetUserId(out long userId))
                return Results.Unauthorized();

            FactGroup? factGroup = await db.FactGroups.FirstOrDefaultAsync(u => u.Id == id && u.UserId == userId);
            if (factGroup == null)
                return FactGroupNotFound();

            db.FactGroups.Remove(factGroup);
            await db.SaveChangesAsync();

            Response response = new()
            {
                Status = RequestStatus.Success,
                Message = SuccessMessages.FactGroupDeleted,
            };
            return Results.Ok(response);
        })
        .RequireAuthorization();

        return app;
    }

    private static IResult FactGroupNotFound()
    {
        return Results.NotFound(new Response<FactGroupDTO>
        {
            Status = RequestStatus.SystemValidationError,
            Message = ErrorMessages.FactGroupNotFound 
        });
    }

    private static IResult FactGroupAlreadyExists(string factGroupName)
    {
        return Results.BadRequest(new Response<FactGroupDTO>
        {
            Status = RequestStatus.BusinessValidationError,
            Message = string.Format(ErrorMessageTemplates.FactGroupAlreadyExists, factGroupName), 
        });
    }
}
