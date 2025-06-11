using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace SudokuburyWebApp.Server.Models
{
    public class SavedGame
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey("UserId")]
        public virtual IdentityUser User { get; set; } = null!;

        [Required]
        [MaxLength(100)]
        public string GameName { get; set; } = string.Empty;

        [Required]
        public string InitialPuzzle {  get; set; } = string.Empty;

        [Required]
        public string CompletedPuzzle {  get; set; } = string.Empty;

        [Required]
        public string CurrentState { get; set; } = string.Empty;

        public string? Notes { get; set; }

        [Required]
        public DifficultyLevel Difficulty { get; set; }

        [Required]
        public GameStatus GameStatus { get; set; } = GameStatus.InProgress;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastPlayedAt { get; set; } = DateTime.UtcNow;

        public TimeSpan ElapsedTime { get; set; } = TimeSpan.Zero;

        public int HintsUsed { get; set; } = 0;
    }

    public enum DifficultyLevel
    {
        Easy = 1,
        Medium = 2,
        Hard = 3,
        Expert = 4
    }

    public enum GameStatus
    {
        InProgress = 1,
        Completed = 2,
        Paused = 3,
        Abandoned = 4
    }
}
