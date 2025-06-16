using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SudokuburyWebApp.Server.Models;
using SudokuburyWebApp.Server.Services;

namespace SudokuburyWebApp.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SudokuController : ControllerBase
    {

        private readonly SudokuService _sudokuService;

        public SudokuController(SudokuService sudokuService)
        {
            _sudokuService = sudokuService;
        }

        [HttpPost("generate")]
        public IActionResult GeneratePuzzle([FromBody] SudokuRequest request)
        {
            try
            {
                var validDifficulties = new[] { "easy", "medium", "hard", "expert" };
                if (string.IsNullOrWhiteSpace(request.Difficulty) || !validDifficulties.Contains(request.Difficulty.ToLower()))
                {
                    return BadRequest(new
                    {
                        Error = "Invalid difficulty selection. Valid options are: easy, medium, hard, or expert."
                    });
                }

                var puzzle = _sudokuService.GeneratePuzzle(request.Difficulty);

                return Ok(puzzle);
            }
            catch (Exception e)
            {
                return StatusCode(500, new
                {
                    Error = "An error occurred while generating the puzzle",
                    Details = e.Message,
                    StackTrace = e.StackTrace,
                    InnerException = e.InnerException
                });
            }
        }

        [HttpPost("import")]
        public IActionResult ImportPuzzle([FromBody] SudokuImportRequest request)
        {
            try
            {
                if (!Regex.IsMatch(request.Puzzle, @"[0-9]{81}$") || request.Puzzle == null)
                {
                    return BadRequest(new
                    {
                        Error = "Request puzzle is either not exactly 81 characters, contains characters other than 0-9, or is null."
                    });
                }

                int[,] puzzle = _sudokuService.ConvertStringToBoard(request.Puzzle);
                if (puzzle == null)
                {
                    return BadRequest(new
                    {
                        Error = "Request puzzle is null."
                    });
                }

                var solution = _sudokuService.SolveBoard(puzzle);

                if (solution == null)
                {
                    return BadRequest(new
                    {
                        Error = "Given puzzle has no solution."
                    });
                }

                var generatedPuzzle = _sudokuService.ImportPuzzle(request.Puzzle, solution);
                return Ok(generatedPuzzle);
            }
            catch (Exception e)
            {
                return StatusCode(500, new
                {
                    Error = "An error occurred while importing the puzzle",
                    Details = e.Message,
                    StackTrace = e.StackTrace,
                    InnerException = e.InnerException
                });
            }
        }
    }
}
