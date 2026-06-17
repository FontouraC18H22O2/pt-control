import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
import Perfil from "./pages/Perfil"; // 🔥 1. IMPORTAR A PÁGINA DE PERFIL

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/meutreino/:planId" element={<VisualizarTreino />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "PT", "GUEST"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "PT"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="personal-trainers"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <GestaoPTs />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="pedidos-acesso"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AccessRequests />
                </ProtectedRoute>
              }
            />

            <Route
              path="alunos"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "PT"]}>
                  <Alunos />
                </ProtectedRoute>
              }
            />
            <Route
              path="treinos"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "PT"]}>
                  <Treinos />
                </ProtectedRoute>
              }
            />
            <Route
              path="galeria"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "PT", "GUEST"]}>
                  <Galeria />
                </ProtectedRoute>
              }
            />

            {/* 🔥 2. ADICIONAR A ROTA DO PERFIL AQUI (Disponível para ADMIN, PT e GUEST) */}
            <Route
              path="perfil"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "PT", "GUEST"]}>
                  <Perfil />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;