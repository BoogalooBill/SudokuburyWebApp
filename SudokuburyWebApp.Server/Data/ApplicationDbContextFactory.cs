using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SudokuburyWebApp.Server.Data
{
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

            // Use the same connection string as in appsettings.json
            optionsBuilder.UseNpgsql("Host=localhost;Database=SudokuGameAppDb;Username=postgres;Password=MyStrongPassword123#");

            return new ApplicationDbContext(optionsBuilder.Options);
        }
    }
}