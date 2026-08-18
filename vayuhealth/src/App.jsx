import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AirQualityMap from './pages/AirQualityMap';
import AIAssistant from './pages/AIAssistant';
import Diseases from './pages/Diseases';
import DiseaseDetail from './pages/DiseaseDetail';
import Surveillance from './pages/Surveillance';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/air-quality-map" element={<ProtectedRoute><AirQualityMap /></ProtectedRoute>} />
            <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
            <Route path="/diseases" element={<ProtectedRoute><Diseases /></ProtectedRoute>} />
            <Route path="/diseases/:idOrName" element={<ProtectedRoute><DiseaseDetail /></ProtectedRoute>} />
            <Route path="/surveillance" element={<ProtectedRoute><Surveillance /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
