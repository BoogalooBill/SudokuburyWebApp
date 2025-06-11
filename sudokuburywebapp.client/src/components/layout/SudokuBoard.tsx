import { type FC, useCallback, useEffect } from 'react';
import { useGame, type SudokuCell } from '../../contexts/GameContext';
import '../../styles/SudokuBoard.css';

const SudokuBoard: FC = () => {
    const { gameState, selectCell, updateCell, setCellNotes, toggleNotesMode, clearSelection, clearUserEntries } = useGame();
    const { board, selectedCell, notesMode } = gameState;

    // Handle keyboard input
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!selectedCell) return;

        const { row, col } = selectedCell;
        const cell = board[row][col];

        // Prevent input on fixed cells
        if (cell.isFixed) return;

        switch (event.key) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                event.preventDefault();
                const value = parseInt(event.key);

                if (notesMode) {
                    // Toggle note
                    const currentNotes = [...cell.notes];
                    const noteIndex = currentNotes.indexOf(value);

                    if (noteIndex > -1) {
                        currentNotes.splice(noteIndex, 1);
                    } else {
                        currentNotes.push(value);
                        currentNotes.sort();
                    }

                    setCellNotes(row, col, currentNotes);
                } else {
                    // Set cell value
                    updateCell(row, col, value);
                }
                break;

            case 'Backspace':
            case 'Delete':
            case '0':
                event.preventDefault();
                updateCell(row, col, 0);
                setCellNotes(row, col, []);
                break;

            case 'n':
            case 'N':
                event.preventDefault();
                toggleNotesMode();
                break;

            case 'c':
            case 'C':
                event.preventDefault();
                const confirmClear = window.confirm(
                    'Are you sure you want to clear all entered numbers? This will remove all your progress while keeping the original puzzle intact.'
                );
                if (confirmClear) {
                    clearUserEntries();
                }
                break;

            case 'ArrowUp':
                event.preventDefault();
                if (row > 0) selectCell(row - 1, col);
                break;

            case 'ArrowDown':
                event.preventDefault();
                if (row < 8) selectCell(row + 1, col);
                break;

            case 'ArrowLeft':
                event.preventDefault();
                if (col > 0) selectCell(row, col - 1);
                break;

            case 'ArrowRight':
                event.preventDefault();
                if (col < 8) selectCell(row, col + 1);
                break;

            case 'Escape':
                event.preventDefault();
                clearSelection();
                break;
        }
    }, [selectedCell, board, notesMode, selectCell, updateCell, setCellNotes, toggleNotesMode, clearSelection, clearUserEntries]);

    // Add keyboard event listener
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // Handle cell click
    const handleCellClick = useCallback((row: number, col: number) => {
        selectCell(row, col);
    }, [selectCell]);

    // Render individual cell
    const renderCell = useCallback((cell: SudokuCell, row: number, col: number) => {
        const cellClasses = [
            'sudoku-cell',
            cell.isSelected && 'selected',
            cell.isHighlighted && 'highlighted',
            cell.isFixed && 'fixed',
            cell.isError && 'error',
            // Add border classes for 3x3 box separation
            row % 3 === 0 && 'border-top',
            col % 3 === 0 && 'border-left',
            row % 3 === 2 && 'border-bottom',
            col % 3 === 2 && 'border-right'
        ].filter(Boolean).join(' ');

        return (
            <div
                key={`${row}-${col}`}
                className={cellClasses}
                onClick={() => handleCellClick(row, col)}
                data-row={row}
                data-col={col}
            >
                {cell.value !== 0 ? (
                    <span className="cell-value">{cell.value}</span>
                ) : (
                    cell.notes.length > 0 && (
                        <div className="cell-notes">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(note => (
                                <span
                                    key={note}
                                    className={`note ${cell.notes.includes(note) ? 'active' : ''}`}
                                >
                                    {cell.notes.includes(note) ? note : ''}
                                </span>
                            ))}
                        </div>
                    )
                )}
            </div>
        );
    }, [handleCellClick]);

    return (
        <div className="sudoku-board-container">
            <div className="sudoku-board">
                {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))
                )}
            </div>

            {/* Instructions */}
            <div className="board-instructions">
                <p>
                    <strong>Controls:</strong> Click to select -- 1-9 to enter numbers --
                    Backspace/Delete to clear -- N to toggle notes mode -- C to clear all entries -- Arrow keys to navigate
                </p>
                {notesMode && (
                    <p className="notes-mode-indicator">
                        <strong>Notes Mode:</strong> Numbers will be added as notes
                    </p>
                )}
            </div>
        </div>
    );
};

export default SudokuBoard;