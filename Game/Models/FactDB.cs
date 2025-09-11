using Microsoft.EntityFrameworkCore;

public class FactDb : DbContext
{
    public FactDb(DbContextOptions<FactDb> options)
        : base(options) { }

    public DbSet<UserFact> Facts => Set<UserFact>();
    public DbSet<FactGroup> FactGroups => Set<FactGroup>();
    public DbSet<SharedFact> SharedFacts => Set<SharedFact>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Composite Key
        modelBuilder.Entity<SharedFact>()
            .HasKey(sf => new { sf.FactId, sf.UserId });
    }
}
