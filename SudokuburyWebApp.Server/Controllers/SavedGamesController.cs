using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SudokuburyWebApp.Server.Data;
using SudokuburyWebApp.Server.Models;
using SudokuburyWebApp.Server.DTO;
using System.Security.Claims;

namespace SudokuburyWebApp.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SavedGamesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SavedGamesController(ApplicationDbContext context)
        {
            _context = context;
        }

        //Retrieve the saved games for that user
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SavedGameDto>>> GetSavedGames()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var savedGames = await _context.SavedGames
                .Where(sg => sg.UserId == userId)
                .OrderByDescending(sg => sg.LastPlayedAt)
                .Select(sg => new SavedGameDto
                {
                    Id = sg.Id,
                    GameName = sg.GameName,
                    Difficulty = sg.Difficulty, 
                    GameStatus = sg.GameStatus,
                    CreatedAt = sg.CreatedAt,
                    LastPlayedAt = sg.LastPlayedAt,
                    ElapsedTime = sg.ElapsedTime,
                    HintsUsed = sg.HintsUsed
                }).ToListAsync();

            return Ok(savedGames);
        }

        //Retrieve a single saved game for a user
        [HttpGet("{id}")]
        public async Task<ActionResult<SavedGameDetailDto>> GetSavedGame(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var savedGame = await _context.SavedGames
                .Where(sg => sg.Id == id && sg.UserId == userId)
                .FirstOrDefaultAsync();

            if (savedGame == null)
            {
                return NotFound();
            }

            var gameDetail = new SavedGameDetailDto
            {
                Id = savedGame.Id,
                GameName = savedGame.GameName,
                InitialPuzzle = savedGame.InitialPuzzle,
                CompletedPuzzle = savedGame.CompletedPuzzle,
                CurrentState = savedGame.CurrentState,
                Notes = savedGame.Notes,
                Difficulty = savedGame.Difficulty,
                GameStatus = savedGame.GameStatus,
                CreatedAt = savedGame.CreatedAt,
                LastPlayedAt = savedGame.LastPlayedAt,
                ElapsedTime = savedGame.ElapsedTime,
                HintsUsed = savedGame.HintsUsed,
            };

            return Ok(gameDetail);
        }

        //Create a new saved game for a user
        [HttpPost]
        public async Task<ActionResult<SavedGameDto>> CreateSavedGame (CreateSavedGameDto createGameDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var savedGame = new SavedGame
            {
                UserId = userId,
                GameName = createGameDto.GameName,
                InitialPuzzle = createGameDto.InitialPuzzle,
                CompletedPuzzle = createGameDto.CompletedPuzzle,
                CurrentState = createGameDto.CurrentState ?? createGameDto.InitialPuzzle,
                Notes = createGameDto.Notes,
                Difficulty = createGameDto.Difficulty,
                GameStatus = GameStatus.InProgress,
                CreatedAt = DateTime.UtcNow,
                LastPlayedAt = DateTime.UtcNow
            };

            _context.SavedGames.Add(savedGame);
            await _context.SaveChangesAsync();

            var savedGameDto = new SavedGameDto
            {
                Id = savedGame.Id,
                GameName = savedGame.GameName,
                Difficulty = savedGame.Difficulty,
                GameStatus = savedGame.GameStatus,
                CreatedAt = savedGame.CreatedAt,
                LastPlayedAt = savedGame.LastPlayedAt,
                ElapsedTime = savedGame.ElapsedTime,
                HintsUsed = savedGame.HintsUsed,
            };

            return CreatedAtAction(nameof(GetSavedGame), new { id = savedGame.Id }, savedGameDto);
        }

        //Update a saved game for a user
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSavedGame (int id, UpdateSavedGameDto updateGameDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized();

            var savedGame = await _context.SavedGames
                .Where(sg => sg.Id == id && sg.UserId == userId)
                .FirstOrDefaultAsync();

            if (savedGame == null)
                return NotFound();

            // Update fields
            if (!string.IsNullOrEmpty(updateGameDto.CurrentState))
                savedGame.CurrentState = updateGameDto.CurrentState;

            if (updateGameDto.Notes != null)
                savedGame.Notes = updateGameDto.Notes;

            if (updateGameDto.ElapsedTime.HasValue)
                savedGame.ElapsedTime = updateGameDto.ElapsedTime.Value;

            if (updateGameDto.HintsUsed.HasValue)
                savedGame.HintsUsed = updateGameDto.HintsUsed.Value;

            if (updateGameDto.GameStatus.HasValue)
                savedGame.GameStatus = updateGameDto.GameStatus.Value;

            savedGame.LastPlayedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict();
            }

            return NoContent();
        }

        //Delete a saved game for a user
        [HttpDelete("id")]
        public async Task<IActionResult> DeleteSavedGame(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized();

            var savedGame = await _context.SavedGames
                .Where(sg => sg.UserId == userId && sg.Id == id)
                .FirstOrDefaultAsync();

            if (savedGame == null)
            {
                return NotFound();
            }

            _context.SavedGames.Remove(savedGame);
            await _context.SaveChangesAsync();

            return Ok(_context.SavedGames);
        }
    }
}
