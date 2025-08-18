import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
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
import PublicCatalog from './pages/PublicCatalog';
import Channels from './pages/Channels';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

function AppInner() {
  return (
    <Router>
      <Routes>
        {/* Public catalog route */}
        <Route path="/catalog" element={<PublicCatalog />} />
        
        {/* Admin routes */}
        <Route path="/*" element={
          <Layout>
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
        } />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
