using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SnowflakeGenerator;
using System.Security.Claims;
using System.Text;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDatabase<TContext>(this IServiceCollection services)
        where TContext : DbContext
    {
        string connectionString =
            $"Host={Environment.GetEnvironmentVariable("DB_HOST")};" +
            $"Port={Environment.GetEnvironmentVariable("DB_PORT")};" +
            $"Database={Environment.GetEnvironmentVariable("DB_NAME")};" +
            $"Username={Environment.GetEnvironmentVariable("DB_USER")};" +
            $"Password={Environment.GetEnvironmentVariable("DB_PASSWORD")}";


        services.AddDbContext<TContext>(options =>
            options.UseNpgsql(connectionString));

        return services;
    }

    public static IServiceCollection AddSnowflake(this IServiceCollection services, uint machineId)
    {
        Settings settings = new()
        {
            MachineID = machineId,
            CustomEpoch = new DateTimeOffset(2025, 8, 23, 0, 0, 0, TimeSpan.Zero)
        };
        services.AddSingleton<Snowflake>(_ => new Snowflake(settings));

        return services;
    }

    public static IServiceCollection AddJwtAuth(this IServiceCollection services, byte[] jwtKeyBytes)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = false, // Dev 
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(jwtKeyBytes)
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        if (context.Request.Cookies.ContainsKey("jwt"))
                        {
                            context.Token = context.Request.Cookies["jwt"];
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization(options =>
        {
            options.DefaultPolicy = new AuthorizationPolicyBuilder(JwtBearerDefaults.AuthenticationScheme)
                                        .RequireAuthenticatedUser()
                                        .Build();
        });
        return services;
    }

    public static IServiceCollection AddCustomCors(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("FrontendPolicy", policy =>
                policy.WithOrigins("http://localhost:5173")
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials());
        });

        return services;
    }



    public static IServiceCollection AddSwagger(
        this IServiceCollection services,
        string documentName,
        string title,
        string version)
    {
        services.AddEndpointsApiExplorer();
        services.AddOpenApiDocument(config =>
        {
            config.DocumentName = documentName;
            config.Title = title;
            config.Version = version;
        });

        return services;
    }
    
    public static IServiceCollection AddGoogleAuth(this IServiceCollection services)
    {
        services.AddAuthentication(options =>
        {
            options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
        })
        .AddCookie()
        .AddGoogle(options =>
        {
            options.ClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID")
                ?? throw new InvalidOperationException("Missing GOOGLE_CLIENT_ID environment variable.");

            options.ClientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET")
                ?? throw new InvalidOperationException("Missing GOOGLE_CLIENT_SECRET environment variable.");

            options.Scope.Clear();
            options.Scope.Add("email");
            options.SaveTokens = true;

            options.Events.OnCreatingTicket = ctx =>
            {
                var identity = (ClaimsIdentity)ctx.Principal!.Identity!;
                identity.AddClaim(new Claim("provider", "Google"));
                return Task.CompletedTask;
            };
        });

        return services;
    }
}
