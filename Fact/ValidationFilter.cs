using System.ComponentModel.DataAnnotations;

public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var dto = context.Arguments.OfType<T>().FirstOrDefault();
        if (dto is null)
        {
            return Results.BadRequest(new Response
            {
                Status = RequestStatus.SystemValidationError,
                Message = "Invalid request body"
            });
        }

        var validationContext = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(dto, validationContext, results, true))
        {
            var errorMessages = string.Join("; ", results.Select(r => r.ErrorMessage));
            var response = new Response
            {
                Status = RequestStatus.BusinessValidationError,
                Message = errorMessages
            };

            return Results.BadRequest(response);
        }

        return await next(context); 
    }
}
