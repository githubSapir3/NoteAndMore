import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Events from './pages/Events';
import Contacts from './pages/Contacts';
import Shopping from './pages/Shopping';
import Categories from './pages/Categories';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import HealthCheck from './components/HealthCheck';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <HealthCheck />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="events" element={<Events />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="shopping" element={<Shopping />} />
              <Route path="categories" element={<Categories />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
