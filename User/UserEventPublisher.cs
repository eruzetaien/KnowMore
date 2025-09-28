using System.Text;
using System.Text.Json;
using RabbitMQ.Client;

public class UserEventPublisher :IHostedService
{
    private IConnection? _connection;
    private readonly string EXCHANGE = "base_exchange";
    private readonly string QUEUE = "user";
    private readonly string ROUTING_KEY = "user";

    private async Task<IConnection> CreateConnection()
    {
        var factory = new ConnectionFactory { HostName = "localhost" };
        return await factory.CreateConnectionAsync();  
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _connection = await CreateConnection();
        IChannel channel = await _connection.CreateChannelAsync();
        await channel.QueueDeclareAsync(queue: QUEUE, durable: true, exclusive: false, autoDelete: false, arguments: null, cancellationToken: cancellationToken);
        await channel.ExchangeDeclareAsync(exchange: EXCHANGE, type: ExchangeType.Direct, cancellationToken: cancellationToken);
        await channel.ExchangeDeclareAsync(exchange: EXCHANGE, type: ExchangeType.Direct, cancellationToken: cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _connection?.Dispose();
        return Task.CompletedTask;
    }

    public async Task PublishUserCreated(UserEvent userEvent)
    {
        if (_connection == null)
            _connection = await CreateConnection();

        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(userEvent));
        IChannel channel = await _connection.CreateChannelAsync();
        await channel.BasicPublishAsync(exchange: EXCHANGE, routingKey:ROUTING_KEY, body: body);
    }
}
