using System.ComponentModel.DataAnnotations;

public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var dto = context.Arguments.OfType<T>().FirstOrDefault();
        if (dto is null)
        {
            return Results.BadRequest("Invalid request body.");
        }

        var validationContext = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(dto, validationContext, results, true))
        {
            return Results.BadRequest(results.Select(r => r.ErrorMessage));
        }

        return await next(context); 
    }
}
