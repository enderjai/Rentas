import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/auth/Login'
import Dashboard from './pages/Dashboard'
import Locales from './pages/Locales'
import Inquilinos from './pages/Inquilinos'
import Contratos from './pages/Contratos'
import Pagos from './pages/Pagos'
import Reportes from './pages/Reportes'
import Documentos from './pages/Documentos'
import Usuarios from './pages/Usuarios'
import Configuracion from './pages/Configuracion'
import Layout from './components/common/Layout'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }
  
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/locales" element={
            <PrivateRoute>
              <Layout>
                <Locales />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/inquilinos" element={
            <PrivateRoute>
              <Layout>
                <Inquilinos />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/contratos" element={
            <PrivateRoute>
              <Layout>
                <Contratos />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/pagos" element={
            <PrivateRoute>
              <Layout>
                <Pagos />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/reportes" element={
            <PrivateRoute>
              <Layout>
                <Reportes />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/documentos" element={
            <PrivateRoute>
              <Layout>
                <Documentos />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/usuarios" element={
            <PrivateRoute>
              <Layout>
                <Usuarios />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/configuracion" element={
            <PrivateRoute>
              <Layout>
                <Configuracion />
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App