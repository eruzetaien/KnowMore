public enum RequestStatus
{
    Success = 0,
    SystemValidationError = -1,
    BusinessValidationError = -2,
    SystemError = -3,
}

public class Response
{
    public RequestStatus Status {get; set;}
    public string Message {get; set;} = string.Empty;
}

public class Response<T> : Response
{
    public T? Data {get; set;}
}