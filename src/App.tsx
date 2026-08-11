import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Game from './Game';
import LoginScreen from './LoginScreen';
import AdminScreen from './AdminScreen';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const code = sessionStorage.getItem('accessCode');
  if (!code) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/admin" element={<AdminScreen />} />
        <Route 
          path="/app" 
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
