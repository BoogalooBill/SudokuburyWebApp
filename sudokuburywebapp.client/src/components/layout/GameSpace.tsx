import React from 'react';
import SudokuBoard from './SudokuBoard';
import GameOptions from './GameOptions';
import StatisticsCard from './StatisticsCard';
import '../../styles/GameSpace.css';

const GameSpace: React.FC = () => {
    return (
        <div className="game-space-container">
            <div className="game-space">
                <SudokuBoard />
                <div className="right-panel">
                    <GameOptions />
                    <StatisticsCard />
                </div>
            </div>
        </div>
    );
};

export default GameSpace;