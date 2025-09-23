import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { Toaster } from '@/components/ui/toaster';
import { clerkPublishableKey } from './config';
import { ErrorBoundary } from './components/ErrorBoundary';
import OnboardingFlow from './components/OnboardingFlow';
import TrialBanner from './components/TrialBanner';

// Admin Components
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLandingPage from './pages/admin/AdminLandingPage';

// User/Store Components
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Ingredients from './pages/Ingredients';
import Recipes from './pages/Recipes';
import Products from './pages/Products';
import Sales from './pages/Sales';
import POS from './pages/POS';
import Promotions from './pages/Promotions';
import Targets from './pages/Targets';
import Catalog from './pages/Catalog';
import CatalogOrders from './pages/CatalogOrders';
import Channels from './pages/Channels';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Public Components
import PublicCatalog from './pages/PublicCatalog';
import LandingPage from './pages/LandingPage';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function AppInner() {
  return (
    <ErrorBoundary>
      <Router>
        <OnboardingFlow />
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/catalog" element={<PublicCatalog />} />
        
        {/* Admin routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/users" element={<AdminUsers />} />
                <Route path="/landing-page" element={<AdminLandingPage />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        {/* Store/User routes */}
        <Route path="/store/*" element={
          <ProtectedRoute>
            <Layout>
              <TrialBanner />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/ingredients" element={<Ingredients />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/products" element={<Products />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/targets" element={<Targets />} />
                <Route path="/catalog-admin" element={<Catalog />} />
                <Route path="/catalog-orders" element={<CatalogOrders />} />
                <Route path="/channels" element={<Channels />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
      <Toaster />
    </Router>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
