using Microsoft.EntityFrameworkCore;

class FactDb : DbContext
{
    public FactDb(DbContextOptions<FactDb> options)
        : base(options) { }

    public DbSet<UserFact> Facts => Set<UserFact>();
    public DbSet<FactGroup> FactGroups => Set<FactGroup>();
}
