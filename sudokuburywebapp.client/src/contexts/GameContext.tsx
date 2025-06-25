import { type FC, createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import axios from 'axios';

const getApiBaseUrl = (): string => {
    if (process.env.NODE_ENV === "production") {
        return '';
    }

    return 'https://localhost:7203';
}

//axios configuration for backend
const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': "application/json"
    }
});


apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Authentication required.");
        } else if (error.response?.status === 500) {
            console.error("Server error: ", error.response.data);
        } else if (error.code == "ECONNABORTED") {
            console.error("Request timeout");
        }
        return Promise.reject(error);
    }
)

// Enums matching backend
export const DifficultyLevel = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
    Expert: 4,
    Imported: 5
} as const;

export const GameStatus = {
    InProgress: 1,
    Completed: 2,
    Paused: 3,
    Abandoned: 4
} as const;

// Sudoku cell structure
export interface SudokuCell {
    value: number; // 0 = empty, 1-9 = filled
    isFixed: boolean; // true if it's part of the initial puzzle
    notes: number[]; // array of possible numbers (1-9)
    isSelected: boolean; // currently selected cell
    isHighlighted: boolean; // highlighted (same row/col/box or same number)
    isError: boolean; // cell has an error
}

// Game state interface matching backend SavedGame model
export interface GameState {
    // Game identification
    id?: number;
    gameName: string;

    // Board state
    board: SudokuCell[][]; // 9x9 grid
    initialPuzzle: string; // String representation of starting puzzle
    currentState: string; // String representation of current state
    completedSolution: string; // String representation of completed solution (from backend)
    notes: string | null; // Additional notes about the game

    // Game settings
    difficulty: 1 | 2 | 3 | 4 | 5;
    gameStatus: 1 | 2 | 3 | 4;

    // Timestamps
    createdAt: Date;
    lastPlayedAt: Date;
    elapsedTime: number; // in seconds

    // Game statistics
    hintsUsed: number;

    // UI state (not persisted to backend)
    selectedCell: { row: number; col: number } | null;
    notesMode: boolean;
    isTimerRunning: boolean;
    isLoading: boolean;
    isSaving: boolean;
    isSaved: boolean;
    error: string | null;
    errorType: "error" | "success" | "info" | "warning" | null;
}

//response type interfaces
export interface SavedGamesTypeGeneral { //retrieved when getting list of saved games
    id: number;
    gameName: string;
    difficulty: number;
    gameStatus: number;
    createdAt: string;
    lastPlayedAt: string;
    elapsedTime: string;
    hintsUsed: number;
}

export interface SavedGamesTypeDetailed { //retrieved when getting one specific saved game
    initialPuzzle: string;
    completedPuzzle: string;
    currentState: string;
    notes: string;
    id: number;
    gameName: string;
    difficulty: number;
    gameStatus: number;
    createdAt: string;
    lastPlayedAt: string;
    elapsedTime: string;
    hintsUsed: number;
}

// Context interface
export interface GameContextType {
    // State
    gameState: GameState;

    // Board management
    updateCell: (row: number, col: number, value: number) => void;
    setCellNotes: (row: number, col: number, notes: number[]) => void;
    selectCell: (row: number, col: number) => void;
    clearSelection: () => void;
    clearUserEntries: () => void;
    clearBoardCompletely: () => void;

    // Game management
    startNewGame: (difficulty: typeof DifficultyLevel[keyof typeof DifficultyLevel], gameName?: string) => Promise<void>;
    saveGame: (gameName?: string, notes?: string) => Promise<void>;
    getSavedGames: () => Promise<void>;
    loadSavedGame: (savedGameId: number) => Promise<SavedGamesTypeDetailed> | Promise<void>;
    deleteSavedGame: (gameId: number, gameName?: string) => Promise<void>;
    checkAuthStatus: () => boolean;
    pauseGame: () => void;
    resumeGame: () => void;
    resetGame: () => void;

    // Game actions
    useHint: () => void;
    toggleNotesMode: () => void;
    checkSolution: () => boolean;

    // Timer
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;

    // Utility
    setError: (message: string, messageType: string) => void;
    clearError: () => void;
    formatElapsedTime: () => string;
    getBoardAsString: () => string;
    loadBoardFromString: (boardString: string) => void;
    setCompletedSolution: (solution: string) => void;
}

// Helper function to create empty board
const createEmptyBoard = (): SudokuCell[][] => {
    return Array(9).fill(null).map(() =>
        Array(9).fill(null).map(() => ({
            value: 0,
            isFixed: false,
            notes: [],
            isSelected: false,
            isHighlighted: false,
            isError: false
        }))
    );
};

// Helper function to convert board to string (for persistence)
const boardToString = (board: SudokuCell[][]): string => {
    return board.map(row =>
        row.map(cell => cell.value.toString()).join('')
    ).join('');
};

// Helper function to convert string to board
const stringToBoard = (boardString: string, isInitial: boolean = false): SudokuCell[][] => {
    const board = createEmptyBoard();

    if (boardString.length !== 81) {
        return board;
    }

    for (let i = 0; i < 81; i++) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const value = parseInt(boardString[i], 10) || 0;

        board[row][col] = {
            value,
            isFixed: isInitial && value !== 0,
            notes: [],
            isSelected: false,
            isHighlighted: false,
            isError: false
        };
    }

    return board;
};

// Initial game state
const createInitialGameState = (): GameState => ({
    gameName: 'New Game',
    board: createEmptyBoard(),
    initialPuzzle: '0'.repeat(81),
    currentState: '0'.repeat(81),
    completedSolution: '', // Will be populated when loading from backend
    notes: null,
    difficulty: DifficultyLevel.Medium,
    gameStatus: GameStatus.InProgress,
    createdAt: new Date(),
    lastPlayedAt: new Date(),
    elapsedTime: 0,
    hintsUsed: 0,
    selectedCell: null,
    notesMode: false,
    isTimerRunning: false,
    isLoading: false,
    isSaving: false,
    isSaved: false,
    error: null,
    errorType: null
});

// Context creation
const GameContext = createContext<GameContextType | undefined>(undefined);

// Hook to use the game context
export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};

// Provider component
interface GameProviderProps {
    children: ReactNode;
}

export const GameProvider: FC<GameProviderProps> = ({ children }) => {
    const [gameState, setGameState] = useState<GameState>(createInitialGameState());

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (gameState.isTimerRunning && gameState.gameStatus === GameStatus.InProgress) {
            interval = setInterval(() => {
                setGameState(prev => ({
                    ...prev,
                    elapsedTime: prev.elapsedTime + 1,
                    lastPlayedAt: new Date()
                }));
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [gameState.isTimerRunning, gameState.gameStatus]);

    // Board management
    const updateCell = useCallback((row: number, col: number, value: number) => {
        setGameState(prev => {
            if (prev.board[row][col].isFixed) return prev;

            const newBoard = prev.board.map((boardRow, r) =>
                boardRow.map((cell, c) => {
                    if (r === row && c === col) {
                        return { ...cell, value, notes: value !== 0 ? [] : cell.notes };
                    }
                    return cell;
                })
            );

            return {
                ...prev,
                board: newBoard,
                currentState: boardToString(newBoard),
                lastPlayedAt: new Date()
            };
        });
    }, []);

    const setCellNotes = useCallback((row: number, col: number, notes: number[]) => {
        setGameState(prev => {
            if (prev.board[row][col].isFixed || prev.board[row][col].value !== 0) return prev;

            const newBoard = prev.board.map((boardRow, r) =>
                boardRow.map((cell, c) => {
                    if (r === row && c === col) {
                        return { ...cell, notes: [...notes] };
                    }
                    return cell;
                })
            );

            return {
                ...prev,
                board: newBoard,
                currentState: boardToString(newBoard),
                lastPlayedAt: new Date()
            };
        });
    }, []);

    const selectCell = useCallback((row: number, col: number) => {
        setGameState(prev => {
            const selectedValue = prev.board[row][col].value;

            const newBoard = prev.board.map((boardRow, r) =>
                boardRow.map((cell, c) => {
                    const isSelected = r === row && c === col;
                    const sameValue = selectedValue !== 0 && cell.value === selectedValue;
                    const sameRow = r === row;
                    const sameCol = c === col;
                    const sameBox = Math.floor(r / 3) === Math.floor(row / 3) &&
                        Math.floor(c / 3) === Math.floor(col / 3);

                    return {
                        ...cell,
                        isSelected,
                        isHighlighted: !isSelected && (sameValue || sameRow || sameCol || sameBox)
                    };
                })
            );

            return {
                ...prev,
                board: newBoard,
                selectedCell: { row, col }
            };
        });
    }, []);

    const clearSelection = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            selectedCell: null,
            board: prev.board.map(row =>
                row.map(cell => ({
                    ...cell,
                    isSelected: false,
                    isHighlighted: false
                }))
            )
        }));
    }, []);

    const clearUserEntries = useCallback(() => {
        setGameState(prev => {
            const newBoard = prev.board.map(row =>
                row.map(cell => ({
                    ...cell,
                    value: cell.isFixed ? cell.value : 0,
                    notes: cell.isFixed ? cell.notes : [],
                    isError: false
                }))
            );

            return {
                ...prev,
                board: newBoard,
                currentState: boardToString(newBoard),
                lastPlayedAt: new Date()
            };
        });
    }, []);

    // Game management
    const getBoardAsString = useCallback((): string => {
        return boardToString(gameState.board);
    }, [gameState.board]);

    const clearBoardCompletely = useCallback(() => {
        setGameState(prev => ({
            gameName: 'New Game',
            board: createEmptyBoard(),
            initialPuzzle: '0'.repeat(81),
            currentState: '0'.repeat(81),
            completedSolution: '', // Will be populated when loading from backend
            notes: null,
            difficulty: prev.difficulty || DifficultyLevel.Medium,
            gameStatus: GameStatus.Abandoned,
            createdAt: new Date(),
            lastPlayedAt: new Date(),
            elapsedTime: 0,
            hintsUsed: 0,
            selectedCell: null,
            notesMode: false,
            isTimerRunning: false,
            isLoading: false,
            isSaving: false,
            isSaved: false,
            error: null,
            errorType: null
        }));
    }, []);

    const startNewGame = useCallback(async (
        difficulty: (typeof DifficultyLevel[keyof typeof DifficultyLevel]),
        gameName: string = 'New Game'
    ) => {
        // Set loading state
        setGameState(prev => ({
            ...prev,
            isLoading: true,
            error: null
        }));

        try {
            const difficultyNames = {
                [DifficultyLevel.Easy]: 'Easy',
                [DifficultyLevel.Medium]: 'Medium',
                [DifficultyLevel.Hard]: 'Hard',
                [DifficultyLevel.Expert]: 'Expert',
                [DifficultyLevel.Imported]: 'Imported'
            };

            console.log(`Requesting new ${difficultyNames[difficulty]} puzzle from backend...`);

            const response = await apiClient.post('/api/sudoku/generate', { difficulty: difficultyNames[difficulty].toLowerCase() });

            // Validate response data
            const data = response.data;
            if (!data.puzzle || !data.solution) {
                throw new Error('Invalid response: missing puzzle data');
            }

            if (data.puzzle.length !== 81 || data.solution.length !== 81) {
                throw new Error('Invalid response: puzzle data must be 81 characters');
            }

            if (!/^[0-9]+$/.test(data.puzzle) || !/^[1-9]+$/.test(data.solution)) {
                throw new Error('Invalid response: puzzle data contains invalid characters');
            }

            const now = new Date();

            // Create new game state with backend data
            setGameState({
                gameName: gameName || `New ${difficultyNames[difficulty]} Game`,
                board: stringToBoard(data.puzzle, true),
                initialPuzzle: data.puzzle,
                currentState: data.puzzle,
                completedSolution: data.solution,
                notes: null,
                difficulty,
                gameStatus: GameStatus.InProgress,
                createdAt: now,
                lastPlayedAt: now,
                elapsedTime: 0,
                hintsUsed: 0,
                selectedCell: null,
                notesMode: false,
                isTimerRunning: true,
                isLoading: false,
                isSaving: false,
                isSaved: false,
                error: null,
                errorType: null
            });

            console.log('New game started successfully');

        } catch (error) {
            console.error('Failed to start new game:', error);

            let errorMessage = 'Failed to load new puzzle';

            if (axios.isAxiosError(error)) {
                if (error.response) {
                    errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
                } else if (error.request) {
                    errorMessage = 'Unable to connect to server. Please check your internet connection.';
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            // Set error state
            setGameState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage
            }));
        }
    }, []);

    const saveGame = useCallback(async (gameName?: string, notes?: string | null) => {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!token) {
            setGameState(prev => ({
                ...prev,
                error: "Please log in to save your game."
            }));
            return;
        }

        setGameState(prev => ({
            ...prev,
            isSaving: true,
            error: null
        }));

        try {

            const hours = Math.floor(gameState.elapsedTime / 3600);
            const minutes = Math.floor((gameState.elapsedTime % 3600) / 60);
            const seconds = gameState.elapsedTime % 60;
            const elapsedTimeSpan = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;


            const gameData = {
                gameName: gameName || gameState.gameName,
                initialPuzzle: gameState.initialPuzzle,
                currentState: getBoardAsString(),
                completedPuzzle: gameState.completedSolution,
                difficulty: gameState.difficulty,
                gameStatus: gameState.gameStatus,
                elapsedTime: elapsedTimeSpan,
                hintsUsed: gameState.hintsUsed,
                notes: notes || gameState.notes || ''
            };

            console.log(gameData);

            let response;

            // If there is an existing saved game, update it
            if (gameState.id) {
                console.log("Updating saved game...");
                response = await apiClient.put(`/api/savedgames/${gameState.id}`, gameData);
            } else {
                console.log("Creating new saved game...");
                response = await apiClient.post("api/savedgames", gameData);
            }

            console.log("Game successfully saved");

            setGameState(prev => ({
                ...prev,
                isSaving: false,
                isSaved: true,
                id: response.data.id || prev.id,
                gameName: gameData.gameName,
                notes: gameData.notes,
                lastPlayedAt: new Date()
            }));
        } catch (error) {
            console.log("Failed to save game");

            let errorMessage = "Failed to save game";

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    errorMessage = "Session expired. Please log in again to save your game.";
                } else if (error.response?.status === 403) {
                    errorMessage = "You don't have permission to save games.";
                } else if (error.response) {
                    errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
                } else if (error.request) {
                    errorMessage = "Unable to connect to server. Please check your internet connection";
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            setGameState(prev => ({
                ...prev,
                isSaving: false,
                error: errorMessage
            }));
        }
    }, [gameState.gameName, gameState.initialPuzzle, gameState.difficulty,
    gameState.gameStatus, gameState.elapsedTime, gameState.hintsUsed,
    gameState.notes, gameState.id, getBoardAsString]);

    const getSavedGames = useCallback(async () => {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!token) {
            throw new Error("Please log in to view your saved games. Create an account if you haven't already.");
        }

        try {
            console.log("Fetching saved games...");
            const response = await apiClient.get("/api/savedgames");
            console.log("Games retrieved.");
            return response.data;
        } catch (error) {
            console.error("Failed to fetch saved games.", error);

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error("Session expired. Please log in again.");
                } else if (error.response?.status === 403) {
                    throw new Error("You do not have permission to view saved games.");
                } else if (error.response) {
                    throw new Error(error.response.data?.message || `Server error ${error.response.status}`);
                } else if (error.request) {
                    throw new Error("Unable to connect to server. Please check your internet connection.");
                }
            }
            throw error;
        }
    }, []);

    const loadSavedGame = useCallback(async (savedGameId: number) => {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!token) {
            setGameState(prev => ({
                ...prev,
                error: "Please log in to load saved games."
            }));
            return;
        }

        setGameState(prev => ({
            ...prev,
            isLoading: true,
            error: null
        }));

        try {
            console.log(`Loading saved game ${savedGameId}...`);
            const response = await apiClient.get(`/api/savedgames/${savedGameId}`);
            const savedGame = response.data;

            const timeSpanToSeconds = (timeSpan: string): number => {
                const parts = timeSpan.split(':');
                const hours = parseInt(parts[0]) || 0;
                const minutes = parseInt(parts[1]) || 0;
                const seconds = parseInt(parts[2]) || 0;
                return hours * 3600 + minutes * 60 + seconds;
            };

            const boardFromString = (boardString: string): SudokuCell[][] => {
                const board: SudokuCell[][] = [];
                for (let row = 0; row < 9; row++) {
                    board[row] = [];
                    for (let col = 0; col < 9; col++) {
                        const index = row * 9 + col;
                        const value = parseInt(boardString[index]) || 0;
                        const initialValue = parseInt(savedGame.initialPuzzle[index]) || 0;

                        board[row][col] = {
                            value: value,
                            isFixed: initialValue !== 0,
                            notes: [],
                            isHighlighted: false,
                            isSelected: false,
                            isError: false,
                        };
                    }
                }
                return board;
            };

            setGameState(prev => ({
                ...prev,
                id: savedGame.id,
                gameName: savedGame.gameName,
                board: boardFromString(savedGame.currentState),
                initialPuzzle: savedGame.initialPuzzle,
                currentState: savedGame.currentState,
                completedSolution: savedGame.completedPuzzle, // Note: backend uses "completedPuzzle"
                notes: savedGame.notes,
                difficulty: savedGame.difficulty,
                gameStatus: savedGame.gameStatus,
                createdAt: new Date(savedGame.createdAt),
                lastPlayedAt: new Date(savedGame.lastPlayedAt),
                elapsedTime: timeSpanToSeconds(savedGame.elapsedTime),
                hintsUsed: savedGame.hintsUsed,
                isLoading: false,
                isSaved: true,
                savedGameId: savedGame.id,
                isSaving: false,
                selectedCell: null,
                notesMode: false,
                isTimerRunning: true // Don't auto-start timer when loading
            }));
        } catch (error) {
            console.error('Failed to load saved game:', error);

            let errorMessage = 'Failed to load saved game';

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    errorMessage = 'Session expired. Please log in again.';
                } else if (error.response?.status === 403) {
                    errorMessage = 'You do not have permission to load this game.';
                } else if (error.response?.status === 404) {
                    errorMessage = 'Saved game not found. It may have been deleted.';
                } else if (error.response) {
                    errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
                } else if (error.request) {
                    errorMessage = 'Unable to connect to server. Please check your internet connection.';
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            setGameState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage
            }));
        }
    }, []);

    const pauseGame = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            gameStatus: GameStatus.Paused,
            isTimerRunning: false
        }));
    }, []);

    const resumeGame = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            gameStatus: GameStatus.InProgress,
            isTimerRunning: true,
            lastPlayedAt: new Date()
        }));
    }, []);

    const resetGame = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            board: stringToBoard(prev.initialPuzzle, true),
            currentState: prev.initialPuzzle,
            elapsedTime: 0,
            hintsUsed: 0,
            gameStatus: GameStatus.InProgress,
            selectedCell: null,
            notesMode: false,
            isTimerRunning: true,
            lastPlayedAt: new Date()
        }));
    }, []);


    const deleteSavedGame = useCallback(async (gameId: number, gameName?:string) => {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!token) {
            setGameState(prev => ({
                ...prev,
                error: "Please log in to view saved games and delete them."
            }));
        }

        try {
            console.log(`Deleting ${gameName || gameId}...`);
            const response = await apiClient.delete(`/api/savedgames/id?id=${gameId}`);
            console.log("Game deleted.");
            return response.data
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error("Session expired. Please log in again.");
                } else if (error.response?.status === 403) {
                    throw new Error("You do not have permission to delete this game.");
                } else if (error.response) {
                    throw new Error(error.response.data?.message || `Server error ${error.response.status}`);
                } else if (error.request) {
                    throw new Error("Unable to connect to server. Please check your internet connection.");
                }
            }
            throw error;
        }
    }, []);
    // Game actions
    const useHint = useCallback(() => {
        setGameState(prev => {
            const blankState = "0".repeat(81)
            if (prev.currentState === blankState) {
                return {
                    ...prev,
                    error: "There is no board, so there are no hints to give",
                    errorType: "warning"
                };
            }

            //check if there is a solution provided
            if (!prev.completedSolution) {
                return {
                    ...prev,
                    error: "No solution accompanied with this puzzle.",
                    errorType: "error"
                };
            }

            //check if the puzzle is already completed
            if (prev.gameStatus == 2) {
                return {
                    ...prev,
                    error: "Game is already completed. No hints to give.",
                    errorType: "success"
                };
            }

            //initialize a new board to replace previous board later
            const newBoard = prev.board.map(row => [...row]);
            let targetRow = -1;
            let targetCol = -1;

            //if the user has selected a cell, give hint in that cell
            if (prev.selectedCell) {
                const { row, col } = prev.selectedCell;
                const cell = newBoard[row][col];

                if (!cell.isFixed && cell.value === 0) {
                    targetRow = row;
                    targetCol = col;
                }
            }

            //if the user hasn't selected a cell, choose a random empty cell to give hint to
            if (targetRow === -1 || targetCol === -1) {
                const emptyCells = [];

                for (let row = 0; row < 9; row++) {
                    for (let col = 0; col < 9; col++) {
                        const cell = newBoard[row][col];
                        if (!cell.isFixed && cell.value === 0) {
                            emptyCells.push({ row, col });
                        }
                    }
                }

                if (emptyCells.length === 0) {
                    return {
                        ...prev,
                        error: "There are no empty cells to give hints!",
                        errorType: "warning"
                    };
                }

                const randomIndex = Math.floor(Math.random() * emptyCells.length);
                const randomCell = emptyCells[randomIndex];
                targetRow = randomCell.row;
                targetCol = randomCell.col;
            }

            const solutionIndex = targetRow * 9 + targetCol;
            const correctValue = parseInt(prev.completedSolution[solutionIndex]);

            if (!correctValue || correctValue < 1 || correctValue > 9) {
                return {
                    ...prev,
                    error: "Invalid solution data. Could not provide hint."
                };
            }

            newBoard[targetRow][targetCol] = {
                ...newBoard[targetRow][targetCol],
                value: correctValue,
                notes: [],
                isHighlighted: true
            };

            //highlight just the hinted cell
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    newBoard[row][col].isHighlighted = false;
                }
            }
            newBoard[targetRow][targetCol].isHighlighted = true;

            //set the new board to the state
            const newState = {
                ...prev,
                board: newBoard,
                hintsUsed: prev.hintsUsed + 1,
                selectedCell: { row: targetRow, col: targetCol },
                error: null,
                isSaved: false
            };

            newState.currentState = boardToString(newBoard);

            if (prev.id) {
                setTimeout(() => {
                    saveGame(prev.gameName, prev.notes).catch(console.error);
                }, 100);
            }

            return newState;

        });

        setTimeout(() => {
            setGameState(prev => ({
                ...prev,
                board: prev.board.map(row => row.map(cell => ({ ...cell, isHighlighted: false })))
            }));
        }, 1500)
        // TODO: Implement hint logic
    }, [saveGame, getBoardAsString]);

    const toggleNotesMode = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            notesMode: !prev.notesMode
        }));
    }, []);

    const checkSolution = useCallback((): boolean => {
        const currentBoardString = getBoardAsString();

        // If we have the completed solution from backend, use it for fast checking
        if (gameState.completedSolution && gameState.completedSolution.length === 81) {
            return currentBoardString === gameState.completedSolution;
        }

        // Fallback: Basic validation (check if board is completely filled)
        const isFilled = currentBoardString.indexOf('0') === -1;
        if (!isFilled) return false;

        return true;
    }, [gameState.completedSolution, getBoardAsString]);

    // Timer
    const startTimer = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            isTimerRunning: true
        }));
    }, []);

    const pauseTimer = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            isTimerRunning: false
        }));
    }, []);

    const resetTimer = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            elapsedTime: 0
        }));
    }, []);

    // Utility
    const checkAuthStatus = useCallback(() => {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        return !!token;
    }, []);

    const formatElapsedTime = useCallback((): string => {
        const { elapsedTime } = gameState;

        if (typeof elapsedTime !== 'number' || isNaN(elapsedTime)) {
            return '00:00';
        }

        const hours = Math.floor(elapsedTime / 3600);
        const minutes = Math.floor((elapsedTime % 3600) / 60);
        const seconds = elapsedTime % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [gameState.elapsedTime]);

    const loadBoardFromString = useCallback(async (boardString: string) => {
        const newBoard = stringToBoard(boardString);
        setGameState(prev => ({
            ...prev,
            board: newBoard,
            currentState: boardString,
            lastPlayedAt: new Date()
        }));

        try {

            //Make API call to backend to get the solution for this board and set it as a new game
            const response = await apiClient.post("/api/sudoku/import", { puzzle: boardString })

            // Validate response data
            const data = response.data;
            if (!data.puzzle || !data.solution) {
                throw new Error('Invalid response: missing puzzle data');
            }

            if (data.puzzle.length !== 81 || data.solution.length !== 81) {
                throw new Error('Invalid response: puzzle data must be 81 characters');
            }

            if (!/^[0-9]+$/.test(data.puzzle) || !/^[1-9]+$/.test(data.solution)) {
                throw new Error('Invalid response: puzzle data contains invalid characters');
            }

            const now = new Date();

            // Create new game state with backend data
            setGameState({
                gameName: `New Imported Game`,
                board: stringToBoard(data.puzzle, true),
                initialPuzzle: data.puzzle,
                currentState: data.puzzle,
                completedSolution: data.solution,
                notes: null,
                difficulty: 5,
                gameStatus: GameStatus.InProgress,
                createdAt: now,
                lastPlayedAt: now,
                elapsedTime: 0,
                hintsUsed: 0,
                selectedCell: null,
                notesMode: false,
                isTimerRunning: true,
                isLoading: false,
                isSaving: false,
                isSaved: false,
                error: null,
                errorType: null
            });

            console.log('New game started successfully');

        } catch (error) {
            console.error('Failed to start new game:', error);

            let errorMessage = 'Failed to load new puzzle';

            if (axios.isAxiosError(error)) {
                if (error.response) {
                    errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
                } else if (error.request) {
                    errorMessage = 'Unable to connect to server. Please check your internet connection.';
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
                console.log(errorMessage);
            }
        }
    }, []);

    const setCompletedSolution = useCallback((solution: string) => {
        setGameState(prev => ({
            ...prev,
            completedSolution: solution
        }));
    }, []);

    const clearError = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            error: null,
            errorType: null
        }));
    }, []);

    const setError = useCallback((message: string, messageType: string) => {
        const messageTypes = ["error", "success", "info", "warning"];
        const validMessageType = messageTypes.includes(messageType) ? messageType as "error" | "success" | "info" | "warning" : null;
        setGameState(prev => ({
            ...prev,
            error: message,
            errorType: validMessageType
        }));
    }, []);

    const contextValue: GameContextType = {
        gameState,
        updateCell,
        setCellNotes,
        selectCell,
        clearSelection,
        clearUserEntries,
        clearBoardCompletely,
        startNewGame,
        getSavedGames,
        loadSavedGame,
        deleteSavedGame,
        checkAuthStatus,
        saveGame,
        pauseGame,
        resumeGame,
        resetGame,
        useHint,
        toggleNotesMode,
        checkSolution,
        startTimer,
        pauseTimer,
        resetTimer,
        formatElapsedTime,
        getBoardAsString,
        loadBoardFromString,
        setCompletedSolution,
        clearError,
        setError
    };

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
};