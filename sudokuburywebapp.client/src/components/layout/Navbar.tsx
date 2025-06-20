import { type FC } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/Navbar.css';

const Navbar: FC = () => {
    const { user, logout, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async (): Promise<void> => {
        await logout();
        navigate("/");
        window.location.reload();
    };

    const handleLogin = (): void => {
        navigate('/login');
    }

    const handleBrandClick = (): void => {
        navigate('/');
    }

    const handleSignUp = (): void => {
        navigate('/register');
    }

    if (loading) {
        return <div className="navbar-loading"></div>;
    }

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <button
                    onClick={handleBrandClick}
                    className="navbar-brand"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Sudokubury
                </button>

                <div className="navbar-nav">
                    {isAuthenticated ? (
                        <>
                            <div className="user-info">
                                <span>Logged in as {user?.email}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="logout-button"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleLogin}
                                className="nav-button"
                            >
                                Login
                            </button>
                            <button
                                onClick={handleSignUp}
                                className="nav-button primary"
                            >
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};


export default Navbar;