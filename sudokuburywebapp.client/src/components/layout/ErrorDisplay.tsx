import React, { useEffect, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import '../../styles/ErrorDisplay.css';

const ErrorDisplay: React.FC = () => {
    const { gameState, clearError } = useGame();
    const { error, errorType } = gameState;
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (error && errorType) {
            setIsVisible(true);

            // Clear any existing timeout
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            // Auto-hide after 5 seconds for success messages, 7 seconds for others
            const hideDelay = errorType === 'success' ? 5000 : 7000;
            const newTimeoutId = setTimeout(() => {
                handleDismiss();
            }, hideDelay);

            setTimeoutId(newTimeoutId);
        } else {
            setIsVisible(false);
            if (timeoutId) {
                clearTimeout(timeoutId);
                setTimeoutId(null);
            }
        }

        // Cleanup on unmount
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [error, errorType]);

    const handleDismiss = () => {
        setIsVisible(false);
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
        // Wait for animation to complete before clearing message
        setTimeout(clearError, 300);
    };

    if (!error || !errorType || !isVisible) {
        return null;
    }

    // Get icon and styling based on message type
    const getMessageConfig = (type: string) => {
        switch (type) {
            case 'success':
                return { icon: '✅', className: 'success' };
            case 'warning':
                return { icon: '⚠️', className: 'warning' };
            case 'info':
                return { icon: 'ℹ️', className: 'info' };
            case 'error':
            default:
                return { icon: '⚠️', className: 'error' };
        }
    };

    const config = getMessageConfig(errorType);

    return (
        <div className="error-display-container">
            <div className={`error-display ${config.className}`}>
                <div className="error-content">
                    <div className="error-icon">{config.icon}</div>
                    <div className={`error-message ${config.className}`}>
                        {error}
                    </div>
                    <button
                        className="error-dismiss"
                        onClick={handleDismiss}
                        aria-label="Dismiss message"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorDisplay;