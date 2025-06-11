using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SudokuburyWebApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSavedGameModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompletedPuzzle",
                table: "SavedGames",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedPuzzle",
                table: "SavedGames");
        }
    }
}
