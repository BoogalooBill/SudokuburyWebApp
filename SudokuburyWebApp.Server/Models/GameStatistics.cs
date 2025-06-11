using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace SudokuburyWebApp.Server.Models
{
    public class GameStatistics
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey("UserId")]
        public virtual IdentityUser User { get; set; } = null!;

        public int TotalGamesPlayed { get; set; } = 0;
        public int TotalGamesCompleted { get; set; } = 0;
        public int EasyGamesCompleted { get; set; } = 0;
        public int MediumGamesCompleted { get; set; } = 0;
        public int HardGamesCompleted { get; set; } = 0;
        public int ExpertGamesCompleted { get; set; } = 0;

        public TimeSpan BestTimeEasy { get; set; } = TimeSpan.MaxValue;
        public TimeSpan BestTimeMedium { get; set; } = TimeSpan.MaxValue;
        public TimeSpan BestTimeHard { get; set; } = TimeSpan.MaxValue;
        public TimeSpan BestTimeExpert { get; set; } = TimeSpan.MaxValue;

        public TimeSpan TotalPlayTime { get; set; } = TimeSpan.Zero;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}