using SudokuburyWebApp.Server.Models;

namespace SudokuburyWebApp.Server.Services
{
    public class SudokuService
    {
        private readonly Random _random;
        private readonly int[] _numberChoices;
        private readonly Dictionary<string, int> _difficulties;
        private readonly List<(int row, int col)> _cells;

        public SudokuService()
        {
            _random = new Random();
            _numberChoices = Enumerable.Range(1, 9).ToArray();
            _difficulties = new Dictionary<string, int>
            {
                {"easy", 30 },
                {"medium", 45 },
                {"hard", 55 },
                {"expert", 62 },
            };
            _cells = new List<(int row, int col)>();
            for (int row = 0; row < 9; row++)
                for (int col = 0; col < 9; col++)
                    _cells.Add((row, col));
        }

        public SudokuPuzzle GeneratePuzzle(string difficulty)
        {
            int[,] completedBoard = GenerateRandomCompletedBoard();
            int[,] puzzleBoard = GenerateRandomBoard(completedBoard, difficulty.ToLower());

            return new SudokuPuzzle
            {
                Puzzle = ConvertGridToString(puzzleBoard),
                Solution = ConvertGridToString(completedBoard),
                Difficulty = difficulty
            };
        }

        private bool ValidChoice(int[,] board, int row, int col, int val)
        {
            for (int i = 0; i < 9; i++)
            {
                if (board[row, i] == val)
                    return false;
            }

            for (int i = 0; i < 9; i++)
            {
                if (board[i, col] == val)
                    return false;
            }

            int blockRow = (row / 3) * 3;
            int blockCol = (col / 3) * 3;
            for (int i = 0; i < 3; i++)
            {
                for (int j = 0; j < 3; j++)
                {
                    if (board[i + blockRow, j + blockCol] == val)
                        return false;
                }
            }

            return true;
        }

        private int CountSolutions(int[,] board, int row = 0, int col = 0, int count = 0, int maxCount = 2)
        {
            if (count >= maxCount)
                return count;

            if (row == 9)
                return count + 1;

            if (col == 9)
                return CountSolutions(board, row + 1, 0, count, maxCount);

            if (board[row, col] != 0)
                return CountSolutions(board, row, col + 1, count, maxCount);

            int solutionsFound = count;

            for (int choice = 1; choice <= 9; choice++)
            {
                if (ValidChoice(board, row, col, choice))
                {
                    board[row, col] = choice;
                    solutionsFound = CountSolutions(board, row, col + 1, solutionsFound, maxCount);

                    if (solutionsFound >= maxCount)
                    {
                        board[row, col] = 0;
                        return solutionsFound;
                    }

                    board[row, col] = 0;
                }
            }

            return solutionsFound;
        }

        private int[,]? SolveBoard(int[,] board)
        {
            int[,] solution = (int[,])board.Clone();

            if (SolveHelper(solution, 0, 0))
                return solution;
            else
                return null;
        }

        private bool SolveHelper(int[,] board, int row = 0, int col = 0)
        {
            //Base cases
            if (row == 9)
                return true;
            if (col == 9)
                return SolveHelper(board, row + 1, 0);
            if (board[row, col] != 0)
                return SolveHelper(board, row, col + 1);

            for (int choice = 1; choice <= 9; choice++)
            {
                if (ValidChoice(board, row, col, choice))
                {
                    board[row, col] = choice;

                    if (SolveHelper(board, row, col + 1))
                        return true;

                    board[row, col] = 0;
                }
            }

            return false;
        }

        private int[,] GenerateRandomCompletedBoard()
        {
            int[,] board = new int[9, 9];

            for (int boxIndex = 0; boxIndex < 3; boxIndex++)
            {
                var sample = _numberChoices.OrderBy(x => _random.Next()).ToArray();
                int sampleIndex = 0;

                int startRow = boxIndex * 3;
                int startCol = boxIndex * 3;

                for (int row = 0; row < 3; row++)
                {
                    for (int col = 0; col < 3; col++)
                    {
                        board[startRow + row, startCol + col] = sample[sampleIndex++];
                    }
                }
            }

            SolveHelper(board, 0, 0);

            return board;
        }

        private int[,] GenerateRandomBoard(int[,] completedBoard, string difficulty)
        {
            int[,] board = (int[,])completedBoard.Clone();

            int removedCells = 0;
            int targetRemovedCells = _difficulties.ContainsKey(difficulty)
                ? _difficulties[difficulty]
                : _difficulties["medium"];

            var cellChoices = _cells.OrderBy(x => _random.Next()).ToList();

            foreach (var (row, col) in cellChoices)
            {
                int backup = board[row, col];
                board[row, col] = 0;

                int[,] toTest = (int[,])board.Clone();

                if (CountSolutions(toTest, 0, 0, 0, 2) == 1)
                {
                    removedCells++;
                    if (removedCells >= targetRemovedCells)
                    {
                        break;
                    }
                }
                else
                {
                    board[row, col] = backup;
                }
            }

            return board;
        }

        private string ConvertGridToString(int[,] grid)
        {
            string result = "";
            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    result += grid[i, j].ToString();
                }
            }

            return result;
        }



    }
}
