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

const queryClient = new QueryClient();

function AppInner() {
  return (
    <Router>
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
        </Routes>
      </Layout>
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
