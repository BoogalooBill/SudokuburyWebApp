using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SudokuburyWebApp.Server.Models;

namespace SudokuburyWebApp.Server.Data
{
    public class ApplicationDbContext : IdentityDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        protected ApplicationDbContext()
        {
        }

        // Add DbSets for the new entities
        public DbSet<SavedGame> SavedGames { get; set; }
        public DbSet<GameStatistics> GameStatistics { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure SavedGame entity
            modelBuilder.Entity<SavedGame>(entity =>
            {
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => new { e.UserId, e.GameStatus });
                entity.HasIndex(e => e.LastPlayedAt);

                entity.Property(e => e.InitialPuzzle)
                    .IsRequired()
                    .HasMaxLength(81)
                    .IsFixedLength();

                entity.Property(e => e.CurrentState)
                    .IsRequired()
                    .HasMaxLength(81)
                    .IsFixedLength();

                entity.Property(e => e.Notes)
                    .HasMaxLength(4000); // JSON can be large

                entity.Property(e => e.ElapsedTime)
                    .HasConversion(
                        v => v.Ticks,
                        v => new TimeSpan(v));

                // Relationship with User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure GameStatistics entity
            modelBuilder.Entity<GameStatistics>(entity =>
            {
                entity.HasIndex(e => e.UserId)
                    .IsUnique(); // One statistics record per user

                entity.Property(e => e.BestTimeEasy)
                    .HasConversion(
                        v => v.Ticks,
                        v => new TimeSpan(v));

                entity.Property(e => e.BestTimeMedium)
                    .HasConversion(
                        v => v.Ticks,
                        v => new TimeSpan(v));

                entity.Property(e => e.BestTimeHard)
                    .HasConversion(
                        v => v.Ticks,
                        v => new TimeSpan(v));

                entity.Property(e => e.BestTimeExpert)
                    .HasConversion(
                        v => v.Ticks,
                        v => new TimeSpan(v));

                entity.Property(e => e.TotalPlayTime)
                    .HasConversion(
                        v => v.Ticks,
                        v => new TimeSpan(v));

                // Relationship with User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}