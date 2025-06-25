/* eslint-disable @typescript-eslint/no-explicit-any */
import { type FC, useState, useCallback } from 'react';
import { useGame, DifficultyLevel } from '../../contexts/GameContext';
import { useAuth } from "../../contexts/AuthContext";
import '../../styles/GameOptions.css';


const GameOptions: FC = () => {
    const {
        gameState,
        startNewGame,
        saveGame,
        loadSavedGame,
        getSavedGames,
        deleteSavedGame,
        checkAuthStatus,
        clearUserEntries,
        clearBoardCompletely,
        getBoardAsString,
        loadBoardFromString,
        useHint,
        checkSolution,
        pauseTimer,
        setError
    } = useGame();

    //get authentication if any
    const { isAuthenticated } = useAuth();

    //saved games modal
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveGameName, setSaveGameName] = useState('');
    const [saveNotes, setSaveNotes] = useState('');

    //load games modal
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [savedGamesList, setSavedGamesList] = useState<any[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
    const [isLoadingGames, setIsLoadingGames] = useState(false);
    const [loadGamesError, setLoadGamesError] = useState('');

    if (loadGamesError !== "") {
        console.log(loadGamesError);
    }

    //modals for difficulty, import, and export
    const [showDifficultyModal, setShowDifficultyModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [importText, setImportText] = useState('');

    // Handle New Game button click
    const handleNewGameClick = useCallback(() => {
        setShowDifficultyModal(true);
    }, []);

    // Handle difficulty selection
    const handleDifficultySelect = useCallback((difficulty: typeof DifficultyLevel[keyof typeof DifficultyLevel]) => {
        setShowDifficultyModal(false);
        const difficultyNames: {[index:number]:string} = {
            [DifficultyLevel.Easy]: 'Easy',
            [DifficultyLevel.Medium]: 'Medium',
            [DifficultyLevel.Hard]: 'Hard',
            [DifficultyLevel.Expert]: 'Expert'
        };
        startNewGame(difficulty, `New ${difficultyNames[difficulty]} Game`);
    }, [startNewGame]);

    // Handle Clear button with confirmation
    const handleClearBoard = useCallback(() => {
        if (gameState.gameStatus === 2) {
            setError("This game is already completed. Start a new game or load an unfinished one.", "warning");
            return;
        }
        const confirmClear = window.confirm(
            'Are you sure you want to clear all entered numbers? This will remove all your progress while keeping the original puzzle intact.'
        );
        if (confirmClear) {
            clearUserEntries();
        }
    }, [clearUserEntries]);

    // Handle Save Game 
    const handleSaveGame = useCallback(async () => {
        if (!isAuthenticated) {
            setError("You must login to save a game. If you'd like to save the game without logging in, use the Export Board feature and save to a file.", "error");
            return;
        }

        if (gameState.gameStatus === 2) {
            setError("This game is already completed. Start a new game or load an unfinished one.", "warning");
            return;
        }

        await saveGame(saveGameName || gameState.gameName, saveNotes);

        if (!gameState.error) {
            setShowSaveModal(false);
            setSaveGameName('');
            setSaveNotes('');
        }
    }, [saveGame, saveGameName, saveNotes, gameState.gameName, gameState.error, isAuthenticated, setError]);

    const openSaveModal = useCallback(() => {
        if (!isAuthenticated) {
            setError("You must login to save a game. If you'd like to save the game without logging in, use the Export Board feature and save to a file.", "error");
            return;
        }

        if (gameState.gameStatus === 2) {
            setError("This game is already completed. Start a new game or load an unfinished one.", "warning");
            return;
        }

        setSaveGameName(gameState.gameName);
        setSaveNotes(gameState.notes || '');
        setShowSaveModal(true);
    }, [gameState.gameName, gameState.notes, isAuthenticated, setError]);

    // Handle Load Game 
    const handleLoadGame = useCallback(async () => {
        if (!isAuthenticated) {
            setError("You must login to load a game. If you have a board string, use the Import Board feature to load that game.", "error");
            return;
        };

        if (!checkAuthStatus()) {
            setLoadGamesError("Please log in to view your saved games.");
            return;
        }

        setShowLoadModal(true);
        setIsLoadingGames(true);
        setLoadGamesError("");

        try {
            const games = await getSavedGames();
            setSavedGamesList(games!);
        } catch (error: any) {
            setLoadGamesError(error.message || "Failed to retrieve saved games");
            setSavedGamesList([]);
        } finally {
            setIsLoadingGames(false);
        }

    }, [checkAuthStatus, getSavedGames, isAuthenticated, setError]);

    const handleLoadSelectedGame = useCallback(async () => {
        if (!selectedGameId) return;

        await loadSavedGame(selectedGameId);
        closeModals();
    }, [selectedGameId, loadSavedGame]);

    const closeLoadModal = useCallback(() => {
        setShowLoadModal(false);
        setSelectedGameId(null);
        setSavedGamesList([]);
        setLoadGamesError('');
    }, []);

    const handleDeleteSavedGame = useCallback(async (gameId: number, gameName?: string) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete ${gameName || gameId}?`);
        if (!confirmDelete) {
            return;
        }

        try {
            if (Number(gameId) === Number(gameState.id)) { //clear the board of the current game if the current loaded game is the one the needs to be deleted.
                clearBoardCompletely();
            }
            await deleteSavedGame(gameId, gameName);

            setSelectedGameId(null);
            setSavedGamesList(prev => prev.filter(game => game.id !== gameId));

        } catch (error: any) {
            setLoadGamesError(error.message || "Failed to delete the selected game");
        } finally {
            setIsLoadingGames(false);
        }
    }, [deleteSavedGame, gameState.id]);

    // Handle Export Board
    const handleExportBoard = useCallback(() => {
        const boardString = getBoardAsString();
        setShowExportModal(true);

        // Copy to clipboard
        navigator.clipboard.writeText(boardString).then(() => {
            console.log('Board copied to clipboard');
        }).catch(() => {
            console.log('Failed to copy to clipboard');
        });
    }, [getBoardAsString]);

    // Handle Import Board
    const handleImportBoard = useCallback(() => {
        if (importText.length === 81 && /^[0-9]+$/.test(importText)) {
            loadBoardFromString(importText);
            setShowImportModal(false);
            setImportText('');
        } else {
            setError('Please enter a valid 81-character string containing only digits 0-9.', "error");
        }
    }, [importText, loadBoardFromString, setError]);

    // Handle Hint
    const handleHint = useCallback(() => {
        if (gameState.gameStatus === 2) {
            setError("This game is already completed. Start a new game or load an unfinished one.", "warning");
            return;
        }

        useHint();
    }, [useHint]);

    // Handle Check Solution
    const handleCheckSolution = useCallback(() => {
        if (gameState.gameStatus === 2) {
            setError("This game is already completed. Start a new game or load an unfinished one.", "warning");
            return;
        }

        const currentBoard = getBoardAsString();
        const isBlank = currentBoard === "0".repeat(81);
        const isEmpty = currentBoard.includes('0');

        if (isBlank) {
            setError("Board is blank. Start or load a new game.", "warning");
            return;
        }

        if (isEmpty) {
            const filledCells = currentBoard.split('').filter(cell => cell !== '0').length;
            setError(`Puzzle is not complete. You have filled ${filledCells} out of 81 cells.`, "warning");
            return;
        }

        const isCorrect = checkSolution();
        if (isCorrect) {
            gameState.gameStatus = 2;
            pauseTimer();

            if (isAuthenticated) {
                saveGame();
            }

            setError('Congratulations! You solved the puzzle correctly!', "success");

        } else {
            setError('The solution contains errors. Check for duplicate numbers in rows, columns, or 3x3 boxes.', "warning");
        }


    }, [checkSolution, getBoardAsString, setError, gameState, pauseTimer, isAuthenticated, saveGame]);

    // Close modals
    const closeModals = useCallback(() => {
        setShowDifficultyModal(false);
        setShowImportModal(false);
        setShowExportModal(false);
        setShowSaveModal(false);
        setShowLoadModal(false);
        setImportText('');
        setSaveGameName('');
        setSaveNotes('');
        setSelectedGameId(null);
        setSavedGamesList([]);
        setLoadGamesError("");
    }, []);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const formatDifficulty = useCallback((difficultyNum: number) => {
        const difficulties = { 1: 'Easy', 2: 'Medium', 3: 'Hard', 4: 'Expert' };
        return difficulties[difficultyNum as keyof typeof difficulties] || 'Unknown';
    }, []);

    const isBoardComplete = useCallback(() => {
        if (gameState.gameStatus === 2) {
            return false;
        }

        return gameState.board.every(row =>
            row.every(cell => cell.value !== 0)
        );
    }, [gameState.board]);

    return (
        <div className="game-options">
            <div className="options-header">
                <h3>Game Options</h3>
            </div>

            <div className="options-grid">
                <button
                    className="option-button primary"
                    onClick={handleNewGameClick}
                >
                    New Game
                </button>

                <button
                    className="option-button"
                    onClick={openSaveModal}
                    disabled={gameState.isSaving}
                >
                    {gameState.isSaving ? "Saving..." : gameState.isSaved ? "Game Saved" : "Save Game"}
                </button>

                <button
                    className="option-button"
                    onClick={handleLoadGame}
                >
                    Load Game
                </button>

                <button
                    className="option-button hint-button"
                    onClick={handleHint}
                >
                    Hint
                </button>

                <button
                    className={`option-button secondary ${isBoardComplete() ? 'check-complete' : ''}`}
                    onClick={handleCheckSolution}
                    disabled={gameState.gameStatus === 2}
                    title={isBoardComplete() ? "Board complete! Click to check your solution" : "Check if your current solution is correct"}
                >
                    { gameState.gameStatus === 2 ? "Solved" : "Check Solution" }
                </button>

                <button
                    className="option-button"
                    onClick={() => setShowImportModal(true)}
                >
                    Import Board
                </button>

                <button
                    className="option-button"
                    onClick={handleExportBoard}
                >
                    Export Board
                </button>

                <button
                    className="option-button danger"
                    onClick={handleClearBoard}
                >
                    Clear Board
                </button>
            </div>

            {/* Difficulty Selection Modal */}
            {showDifficultyModal && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h4>Select Difficulty</h4>
                            <button className="close-button" onClick={closeModals}>X</button>
                        </div>
                        <div className="difficulty-options">
                            <button
                                className="difficulty-button easy"
                                onClick={() => handleDifficultySelect(DifficultyLevel.Easy)}
                            >
                                <div className="difficulty-title">Easy</div>
                                <div className="difficulty-description">Perfect for beginners</div>
                            </button>

                            <button
                                className="difficulty-button medium"
                                onClick={() => handleDifficultySelect(DifficultyLevel.Medium)}
                            >
                                <div className="difficulty-title">Medium</div>
                                <div className="difficulty-description">Balanced challenge</div>
                            </button>

                            <button
                                className="difficulty-button hard"
                                onClick={() => handleDifficultySelect(DifficultyLevel.Hard)}
                            >
                                <div className="difficulty-title">Hard</div>
                                <div className="difficulty-description">For experienced players</div>
                            </button>

                            <button
                                className="difficulty-button expert"
                                onClick={() => handleDifficultySelect(DifficultyLevel.Expert)}
                            >
                                <div className="difficulty-title">Expert</div>
                                <div className="difficulty-description">Ultimate challenge</div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Board Modal */}
            {showImportModal && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h4>Import Board</h4>
                            <button className="close-button" onClick={closeModals}>X</button>
                        </div>
                        <div className="modal-body">
                            <p>Enter an 81-character string representing the Sudoku board:</p>
                            <textarea
                                className="import-textarea"
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder="000000000000000000000000000000000000000000000000000000000000000000000000000000000"
                                maxLength={81}
                            />
                            <div className="character-counter">
                                {importText.length}/81 characters
                            </div>
                            <div className="modal-actions">
                                <button className="cancel-button" onClick={closeModals}>
                                    Cancel
                                </button>
                                <button
                                    className="import-button"
                                    onClick={handleImportBoard}
                                    disabled={importText.length !== 81}
                                >
                                    Import
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Board Modal */}
            {showExportModal && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h4>Export Board</h4>
                            <button className="close-button" onClick={closeModals}>X</button>
                        </div>
                        <div className="modal-body">
                            <p>Board string (copied to clipboard):</p>
                            <div className="export-text">
                                {getBoardAsString()}
                            </div>
                            <div className="modal-actions">
                                <button className="close-button-modal" onClick={closeModals}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Game Modal */}
            {showSaveModal && (
                <div className="modal-overlay" onClick={!gameState.isSaving ? () => setShowSaveModal(false) : undefined}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h4>Save Game</h4>
                            {!gameState.isSaving && (
                                <button className="close-button" onClick={() => setShowSaveModal(false)}>x</button>
                            )}
                        </div>

                        <div className="modal-body">
                            {gameState.isSaving ? (
                                <div className="loading-container">
                                    <div className="loading-spinner"></div>
                                    <p>Saving your game...</p>
                                </div>
                            ) : (
                                <div className="save-form">
                                    <div className="save-form-group">
                                        <label htmlFor="gameName">Game Name:</label>
                                        <input
                                            id="gameName"
                                            className="save-input"
                                            type="text"
                                            value={saveGameName}
                                            onChange={(e) => setSaveGameName(e.target.value)}
                                            placeholder="Enter a name for your game"
                                            maxLength={100}
                                        />
                                    </div>

                                    <div className="save-form-group">
                                        <label htmlFor="gameNotes">Notes (optional):</label>
                                        <textarea
                                            id="gameNotes"
                                            className="import-textarea"
                                            value={saveNotes}
                                            onChange={(e) => setSaveNotes(e.target.value)}
                                            placeholder="Add any notes about this game..."
                                            rows={3}
                                            style={{ minHeight: '60px' }}
                                        />
                                    </div>

                                    <div className="modal-actions">
                                        <button
                                            className="cancel-button"
                                            onClick={() => setShowSaveModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="import-button"
                                            onClick={handleSaveGame}
                                            disabled={!saveGameName.trim()}
                                        >
                                            {gameState.id ? 'Update Game' : 'Save Game'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Load Game Modal */}
            {showLoadModal && (
                <div className="modal-overlay" onClick={!gameState.isLoading ? closeLoadModal : undefined}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ minWidth: '500px' }}>
                        <div className="modal-header">
                            <h4>Load Saved Game</h4>
                            {!gameState.isLoading && (
                                <button className="close-button" onClick={closeLoadModal}>X</button>
                            )}
                        </div>

                        <div className="modal-body">
                            {isLoadingGames ? (
                                <div className="loading-container">
                                    <div className="loading-spinner"></div>
                                    <p>Loading your saved games...</p>
                                </div>
                            ) : gameState.isLoading ? (
                                <div className="loading-container">
                                    <div className="loading-spinner"></div>
                                    <p>Loading selected game...</p>
                                </div>
                            ) : savedGamesList.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#a6adc8' }}>
                                    <p>No saved games found.</p>
                                    <p>Start playing and save your first game!</p>
                                </div>
                            ) : (
                                <>
                                    <p style={{ color: '#a6adc8', marginBottom: '16px' }}>
                                        Select a game to load:
                                    </p>

                                    <div className="saved-games-list">
                                        {savedGamesList.map((game) => (
                                            <div
                                                key={game.id}
                                                className={`saved-game-item ${selectedGameId === game.id ? 'selected' : ''}`}
                                                onClick={() => setSelectedGameId(game.id)}
                                            >
                                                <div className="game-info">
                                                    <div className="game-name">{game.gameName}</div>
                                                    <div className="game-details">
                                                        <span className="difficulty">{formatDifficulty(game.difficulty)}</span>
                                                        <span className="separator">---</span>
                                                        <span className="date">{formatDate(game.lastPlayedAt)}</span>
                                                    </div>
                                                    {game.notes && (
                                                        <div className="game-notes">{game.notes}</div>
                                                    )}
                                                </div>
                                                <div className="game-status">
                                                    {game.gameStatus === 2 ? 'Completed' : 'In Progress'}
                                                </div>
                                                <button
                                                    className='close-button'
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteSavedGame(game.id);
                                                    }}
                                                    title="Delete this saved game"
                                                >
                                                    DEL
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="modal-actions">
                                        <button
                                            className="cancel-button"
                                            onClick={closeLoadModal}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="import-button"
                                            onClick={handleLoadSelectedGame}
                                            disabled={!selectedGameId}
                                        >
                                            Load Game
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameOptions;