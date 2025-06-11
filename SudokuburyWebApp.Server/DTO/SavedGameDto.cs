using SudokuburyWebApp.Server.Models;
using System.ComponentModel.DataAnnotations;

namespace SudokuburyWebApp.Server.DTO
{
    public class SavedGameDto
    {
        public int Id { get; set; }
        public string GameName { get; set; } = string.Empty;
        public DifficultyLevel Difficulty { get; set; }
        public GameStatus GameStatus { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastPlayedAt { get; set; }
        public TimeSpan ElapsedTime { get; set; }
        public int HintsUsed { get; set; }
    }

    public class SavedGameDetailDto : SavedGameDto
    {
        public string InitialPuzzle { get; set; } = string.Empty;
        public string CompletedPuzzle { get; set; } = string.Empty;
        public string CurrentState { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class CreateSavedGameDto
    {
        [Required]
        [MaxLength(100)]
        public string GameName { get; set;} = string.Empty;

        [Required]
        [StringLength(81, MinimumLength = 81)]
        public string InitialPuzzle { get; set;} = string.Empty;

        [Required]
        public string CompletedPuzzle { get; set;} = string.Empty;

        [StringLength(81, MinimumLength = 81)]
        public string CurrentState { get; set; } = string.Empty;

        public string? Notes { get; set;}

        [Required]
        public DifficultyLevel Difficulty { get; set; }
    }

    public class UpdateSavedGameDto
    {
        [StringLength(81, MinimumLength =81)]
        public string? CurrentState {  get; set; }

        public string? Notes { get; set; }
        public TimeSpan? ElapsedTime { get; set; }

        [Range(0, int.MaxValue)]
        public int? HintsUsed { get; set; }

        public GameStatus? GameStatus { get; set; }
    }

    public class GameStatisticsDto
    {
        public int TotalGamesPlayed { get; set; }
        public int TotalGamesCompleted { get; set; }
        public int EasyGamesCompleted { get; set; }
        public int MediumGamesCompleted { get; set; }
        public int HardGamesCompleted { get; set; }
        public int ExpertGamesCompleted { get; set; }
        public TimeSpan BestTimeEasy { get; set; }
        public TimeSpan BestTimeMedium { get; set; }
        public TimeSpan BestTimeHard { get; set; }
        public TimeSpan BestTimeExpert { get; set; }
        public TimeSpan TotalPlayTime { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
