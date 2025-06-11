namespace SudokuburyWebApp.Server.Models
{
    public class SudokuPuzzle
    {
        public string Puzzle { get; set; } = string.Empty;
        public string Solution { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
    }
}
