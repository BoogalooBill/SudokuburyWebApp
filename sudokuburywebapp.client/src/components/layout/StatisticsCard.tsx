import React from 'react';
import { useGame, DifficultyLevel } from '../../contexts/GameContext';
import '../../styles/StatisticsCard.css';

const StatisticsCard: React.FC = () => {
    const { gameState, formatElapsedTime } = useGame();
    const { elapsedTime, hintsUsed, difficulty } = gameState;

    // Get difficulty display info
    const getDifficultyInfo = (diff: DifficultyLevel) => {
        switch (diff) {
            case DifficultyLevel.Easy:
                return { name: 'Easy', color: '#10b981', icon: '*' };
            case DifficultyLevel.Medium:
                return { name: 'Medium', color: '#f59e0b', icon: '**' };
            case DifficultyLevel.Hard:
                return { name: 'Hard', color: '#ef4444', icon: '***' };
            case DifficultyLevel.Expert:
                return { name: 'Expert', color: '#8b5cf6', icon: '****' };
            default:
                return { name: 'Unknown', color: '#6b7280', icon: '?' };
        }
    };

    const difficultyInfo = getDifficultyInfo(difficulty);

    return (
        <div className="statistics-card">
            <div className="stats-header">
                <h3>Game Statistics</h3>
            </div>

            <div className="stats-content">
                {/* Time Stat */}
                <div className="stat-item">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-details">
                        <div className="stat-label">Time</div>
                        <div className="stat-value">{formatElapsedTime()}</div>
                    </div>
                </div>

                {/* Hints Stat */}
                <div className="stat-item">
                    <div className="stat-icon">💡</div>
                    <div className="stat-details">
                        <div className="stat-label">Hints Used</div>
                        <div className="stat-value">{hintsUsed}</div>
                    </div>
                </div>

                {/* Difficulty Stat */}
                <div className="stat-item">
                    <div className="stat-icon">{difficultyInfo.icon}</div>
                    <div className="stat-details">
                        <div className="stat-label">Difficulty</div>
                        <div
                            className="stat-value difficulty-value"
                            style={{ color: difficultyInfo.color }}
                        >
                            {difficultyInfo.name}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsCard;