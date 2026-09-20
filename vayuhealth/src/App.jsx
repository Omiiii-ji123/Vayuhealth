import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';
import { DemoScenarioProvider } from './context/DemoScenarioContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import HealthSetup from './pages/HealthSetup';
import Dashboard from './pages/Dashboard';
import DelhiForecast72H from './pages/DelhiForecast72H';
import AirQualityMap from './pages/AirQualityMap';
import AIAssistant from './pages/AIAssistant';
import Diseases from './pages/Diseases';
import DiseaseDetail from './pages/DiseaseDetail';
import Surveillance from './pages/Surveillance';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <DemoScenarioProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin-login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  {/* Core Operational Routes */}
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/stations" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/delhi-forecast" element={<ProtectedRoute><DelhiForecast72H /></ProtectedRoute>} />
                  <Route path="/air-quality-map" element={<ProtectedRoute><AirQualityMap /></ProtectedRoute>} />
                  <Route path="/surveillance" element={<ProtectedRoute><Surveillance /></ProtectedRoute>} />
                  <Route path="/station-diagnostics" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/profile" element={<Navigate to="/station-diagnostics" replace />} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                  {/* Citizen Health & AI Assistant Routes Bypassed */}
                  <Route path="/health-setup" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/citizen-dashboard" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/diseases" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/diseases/:idOrName" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/ai-assistant" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/7173/surveillance" element={<Navigate to="/surveillance" replace />} />

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </BrowserRouter>
            </DemoScenarioProvider>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}