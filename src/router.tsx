import { createBrowserRouter, Navigate } from "react-router-dom";

// Layouts and Guards
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RequirePermission from "./components/auth/RequirePermission";

// Public Pages
import LandingPage from './pages/landing/LandingPage';
import RevoSendPage from './pages/landing/RevoSendPage';
import RevoFluxoPage from './pages/landing/RevoFluxoPage';

// Auth & Onboarding Pages
import PendingVerificationPage from './pages/auth/PendingVerificationPage';
import AuthConfirmed from './pages/auth/Confirmed';
import UpdatePasswordPage from "./pages/auth/UpdatePassword";

// App Pages
import Dashboard from './pages/Dashboard';
import SalesDashboard from './pages/SalesDashboard';
import ProductsPage from './pages/products/ProductsPage';
import PartnersPage from './pages/partners/PartnersPage';
import CarriersPage from './pages/carriers/CarriersPage';
import ServicesPage from './pages/services/ServicesPage';
import OsPage from './pages/os/OSPage';
import CepSearchPage from './pages/tools/CepSearchPage';
import CnpjSearchPage from './pages/tools/CnpjSearchPage';
import NfeInputPage from './pages/tools/NfeInputPage';
import LogsPage from './pages/dev/LogsPage';
import SupabaseDemoPage from './pages/tools/SupabaseDemoPage';
import ContasPagarPage from './pages/financeiro/ContasPagarPage';
import ContasAReceberPage from './pages/financeiro/ContasAReceberPage';
import CentrosDeCustoPage from './pages/financeiro/CentrosDeCustoPage';
import RolesPage from './pages/settings/roles/RolesPage';
import SalesGoalsPage from './pages/sales/SalesGoalsPage';
import UsersPage from './pages/settings/general/UsersPage';
import TenantCleanupPage from "./pages/admin/TenantCleanupPage";

// Billing Pages
import BillingSuccessPage from './pages/billing/SuccessPage';
import BillingCancelPage from './pages/billing/CancelPage';

export type RoutePermission = { domain: string; action: string };

export const router = createBrowserRouter([
  // Public routes
  { path: "/", element: <LandingPage /> },
  { path: "/revo-send", element: <RevoSendPage /> },
  { path: "/revo-fluxo", element: <RevoFluxoPage /> },

  // Auth & Onboarding routes
  { path: "/auth/pending-verification", element: <PendingVerificationPage /> },
  { path: "/auth/confirmed", element: <AuthConfirmed /> },
  { path: "/auth/update-password", element: <UpdatePasswordPage /> },
  { path: "/onboarding/accept", element: <UpdatePasswordPage /> },
  
  // Admin routes
  { path: "/admin/tenant-cleanup", element: <TenantCleanupPage /> },

  // Protected app routes
  {
    path: "/app",
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "sales-dashboard", element: <SalesDashboard /> },
      { path: "vendas/metas", element: <SalesGoalsPage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "partners", element: <PartnersPage /> },
      { path: "carriers", element: <CarriersPage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "ordens-de-servico", element: <OsPage /> },
      { path: "financeiro/contas-a-pagar", element: <ContasPagarPage /> },
      { path: "financeiro/contas-a-receber", element: <ContasAReceberPage /> },
      { path: "financeiro/centros-de-custo", element: <CentrosDeCustoPage /> },
      { path: "cep-search", element: <CepSearchPage /> },
      { path: "cnpj-search", element: <CnpjSearchPage /> },
      { path: "nfe-input", element: <NfeInputPage /> },
      { path: "desenvolvedor/logs", element: <LogsPage /> },
      { path: "desenvolvedor/supabase-demo", element: <SupabaseDemoPage /> },
      { path: "configuracoes/geral/papeis", element: <RolesPage /> },
      {
        path: "configuracoes/geral/users",
        element: (
          <RequirePermission permission={{ domain: "usuarios", action: "manage" }}>
            <UsersPage />
          </RequirePermission>
        ),
        handle: {
          title: "Usuários",
          permission: { domain: "usuarios", action: "manage" } as RoutePermission,
        },
      },
      { path: "billing/success", element: <BillingSuccessPage /> },
      { path: "billing/cancel", element: <BillingCancelPage /> },
    ]
  },

  // Catch-all
  { path: "*", element: <Navigate to="/" replace /> }
]);

export default router;
