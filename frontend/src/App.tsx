import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContextProvider';
import { ToastProvider } from './contexts/ToastProvider';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CompleteProfilePage } from './pages/CompleteProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { RoomPage } from './pages/RoomPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Requires Firebase auth, profile completion handled internally */}
      <Route path="/complete-profile" element={<CompleteProfilePage />} />

      {/* Protected — requires full auth + Firestore profile */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/room/:id" element={<ProtectedRoute><RoomPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
