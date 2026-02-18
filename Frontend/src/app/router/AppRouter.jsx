import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../../shared/components/AppLayout';
import LoginPage from '../../features/auth/pages/LoginPage';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import ClientesPage from '../../features/clientes/pages/ClientesPage';
import EquiposPage from '../../features/equipos/pages/EquiposPage';
import OrdenesPage from '../../features/ordenes/pages/OrdenesPage';
import InventarioPage from '../../features/inventario/pages/InventarioPage';
import ReportesPage from '../../features/reportes/pages/ReportesPage';

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="equipos" element={<EquiposPage />} />
        <Route path="ordenes" element={<OrdenesPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="reportes" element={<ReportesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRouter;
