import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Alunos from "./pages/Alunos";
import Treinos from "./pages/Treinos";
import Galeria from "./pages/Galeria";
import GestaoPTs from "./pages/GestaoPTs";
import VisualizarTreino from "./pages/VisualizarTreino";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import AccessRequests from "./pages/AccessRequests";
import Perfil from "./pages/Perfil";
import AvaliacaoFisica from "./pages/AvaliacaoFisica";
import Templates from "./pages/Templates";
import Manutencao from "./pages/Manutencao";
import maintenanceService from "./services/maintenanceService";
import { Analytics } from '@vercel/analytics/react';

// Wrapper que verifica manutenção e protege todas as rotas exceto ADMIN
function AppContent() {
  const { role } = useAuth();
  const [manutencao, setManutencao] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    maintenanceService.getStatus().then(status => {
      setManutencao(status);
    }).catch(() => {
      setManutencao(false);
    }).finally(() => {
      setVerificando(false);
    });
  }, []);

  // Enquanto verifica, mostra nada (evita flash)
  if (verificando) return null;

  // Se está em manutenção e não é ADMIN, mostra página de manutenção
  if (manutencao && role !== 'ADMIN') {
    return <Manutencao />;
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/meutreino/:studentId" element={<VisualizarTreino />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "PT", "GUEST"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProtectedRoute allowedRoles={["ADMIN", "PT"]}><Dashboard /></ProtectedRoute>} />
        <Route path="personal-trainers" element={<ProtectedRoute allowedRoles={["ADMIN"]}><GestaoPTs /></ProtectedRoute>} />
        <Route path="pedidos-acesso" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AccessRequests /></ProtectedRoute>} />
        <Route path="alunos" element={<ProtectedRoute allowedRoles={["ADMIN", "PT"]}><Alunos /></ProtectedRoute>} />
        <Route path="treinos" element={<ProtectedRoute allowedRoles={["ADMIN", "PT"]}><Treinos /></ProtectedRoute>} />
        <Route path="galeria" element={<ProtectedRoute allowedRoles={["ADMIN", "PT", "GUEST"]}><Galeria /></ProtectedRoute>} />
        <Route path="perfil" element={<ProtectedRoute allowedRoles={["ADMIN", "PT", "GUEST"]}><Perfil /></ProtectedRoute>} />
        <Route path="avaliacao" element={<ProtectedRoute allowedRoles={["PT"]}><AvaliacaoFisica /></ProtectedRoute>} />
        <Route path="templates" element={<ProtectedRoute allowedRoles={["PT"]}><Templates /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <Analytics />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;