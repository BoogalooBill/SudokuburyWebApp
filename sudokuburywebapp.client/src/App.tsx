import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import GameSpace from './components/layout/GameSpace';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <GameProvider>
                <Router>
                    <div className="App">
                        <Navbar />
                        <main>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/" element={<GameSpace />} />
                            </Routes>
                        </main>
                    </div>
                </Router>
            </GameProvider>
        </AuthProvider>
    );
}

export default App;