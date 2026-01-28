import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Mercados from "./pages/Mercados";
import Noticias from "./pages/Noticias";
import Calendario from "./pages/Calendario";
import CheckList from "./pages/CheckList";
import Estrategias from "./pages/Estrategias";
import LongShort from "./pages/LongShort";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          } />
          <Route path="/mercados" element={
            <AppLayout>
              <Mercados />
            </AppLayout>
          } />
          <Route path="/noticias" element={
            <AppLayout>
              <Noticias />
            </AppLayout>
          } />
          <Route path="/calendario" element={
            <AppLayout>
              <Calendario />
            </AppLayout>
          } />
          <Route path="/checklist" element={
            <AppLayout>
              <CheckList />
            </AppLayout>
          } />
          <Route path="/estrategias" element={
            <AppLayout>
              <Estrategias />
            </AppLayout>
          } />
          <Route path="/longshort" element={
            <AppLayout>
              <LongShort />
            </AppLayout>
          } />
          <Route path="/configuracoes" element={
            <AppLayout>
              <Configuracoes />
            </AppLayout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
