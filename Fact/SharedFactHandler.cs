using Microsoft.EntityFrameworkCore;
using SnowflakeGenerator;
using System.Security.Claims;

public static class SharedFactHandler
{
    public static IEndpointRouteBuilder RegisterSharedFactHandler(this IEndpointRouteBuilder app)
    {
        return app;
    }
}
