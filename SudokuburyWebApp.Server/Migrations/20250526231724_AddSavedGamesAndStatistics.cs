using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SudokuburyWebApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddSavedGamesAndStatistics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GameStatistics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TotalGamesPlayed = table.Column<int>(type: "int", nullable: false),
                    TotalGamesCompleted = table.Column<int>(type: "int", nullable: false),
                    EasyGamesCompleted = table.Column<int>(type: "int", nullable: false),
                    MediumGamesCompleted = table.Column<int>(type: "int", nullable: false),
                    HardGamesCompleted = table.Column<int>(type: "int", nullable: false),
                    ExpertGamesCompleted = table.Column<int>(type: "int", nullable: false),
                    BestTimeEasy = table.Column<long>(type: "bigint", nullable: false),
                    BestTimeMedium = table.Column<long>(type: "bigint", nullable: false),
                    BestTimeHard = table.Column<long>(type: "bigint", nullable: false),
                    BestTimeExpert = table.Column<long>(type: "bigint", nullable: false),
                    TotalPlayTime = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameStatistics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GameStatistics_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SavedGames",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    GameName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    InitialPuzzle = table.Column<string>(type: "nchar(81)", fixedLength: true, maxLength: 81, nullable: false),
                    CurrentState = table.Column<string>(type: "nchar(81)", fixedLength: true, maxLength: 81, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    Difficulty = table.Column<int>(type: "int", nullable: false),
                    GameStatus = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastPlayedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ElapsedTime = table.Column<long>(type: "bigint", nullable: false),
                    HintsUsed = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedGames", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SavedGames_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GameStatistics_UserId",
                table: "GameStatistics",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SavedGames_LastPlayedAt",
                table: "SavedGames",
                column: "LastPlayedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SavedGames_UserId",
                table: "SavedGames",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedGames_UserId_GameStatus",
                table: "SavedGames",
                columns: new[] { "UserId", "GameStatus" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GameStatistics");

            migrationBuilder.DropTable(
                name: "SavedGames");
        }
    }
}
