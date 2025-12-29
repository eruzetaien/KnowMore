using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Microsoft.EntityFrameworkCore;

public class UserEventSubscriber : IHostedService
{
    private IConnection? _connection;
    private readonly string EXCHANGE = "base_exchange";
    private readonly string QUEUE = "user";
    private readonly string ROUTING_KEY = "user";
    private readonly IServiceScopeFactory _scopeFactory;

    public UserEventSubscriber(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

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
        await channel.QueueBindAsync(queue: QUEUE, exchange: EXCHANGE, routingKey: ROUTING_KEY, cancellationToken: cancellationToken);

        AsyncEventingBasicConsumer consumer = new(channel);
        consumer.ReceivedAsync += async (model, ea) =>
        {
            try
            {
                var json = Encoding.UTF8.GetString(ea.Body.ToArray());
                var userEvent = JsonSerializer.Deserialize<UserEvent>(json);

                if (userEvent != null)
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<FactDb>();

                    switch (userEvent.action)
                    {
                        case UserAction.Created:
                            db.Users.Add(new AppUser { Id = userEvent.UserId, Username = userEvent.Username });
                            await db.SaveChangesAsync();
                            break;

                        case UserAction.Updated:
                            var user = await db.Users.FindAsync(userEvent.UserId);
                            if (user != null)
                            {
                                user.Username = userEvent.Username;
                                await db.SaveChangesAsync();
                            } 
                            else
                            {
                                db.Users.Add(new AppUser { Id = userEvent.UserId, Username = userEvent.Username });
                                await db.SaveChangesAsync();
                            }
                            break;

                        case UserAction.Deleted:
                            var toDelete = await db.Users.FindAsync(userEvent.UserId);
                            if (toDelete != null)
                            {
                                db.Users.Remove(toDelete);
                                await db.SaveChangesAsync();
                            }
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Subscriber] Error: {ex.Message}");
            }
        };

        await channel.BasicConsumeAsync(QUEUE, autoAck: true, consumer: consumer);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _connection?.Dispose();
        return Task.CompletedTask;
    }
}
