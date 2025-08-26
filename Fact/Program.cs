using DotNetEnv;

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

app.MapGet("/", () => "Hello World!").RequireAuthorization();

app.Run();
