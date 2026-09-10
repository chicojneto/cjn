import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Manha from "./pages/Manha";
import Mercados from "./pages/Mercados";
import Calendario from "./pages/Calendario";
import CheckList from "./pages/CheckList";
import Estrategias from "./pages/Estrategias";
import Playbook from "./pages/Playbook";
import PreMarket from "./pages/PreMarket";
import LongShort from "./pages/LongShort";
import MapaGlobal from "./pages/MapaGlobal";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import { TimezoneProvider } from "./contexts/TimezoneContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TimezoneProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AppLayout>
              <MapaGlobal />
            </AppLayout>
          } />
          <Route path="/sessoes" element={
            <AppLayout>
              <MapaGlobal />
            </AppLayout>
          } />
          <Route path="/manha" element={
            <AppLayout>
              <Manha />
            </AppLayout>
          } />
          <Route path="/dashboard" element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          } />
          <Route path="/mercados" element={
            <AppLayout>
              <Mercados />
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
          <Route path="/pre-market" element={
            <AppLayout>
              <PreMarket />
            </AppLayout>
          } />
          <Route path="/playbook" element={
            <AppLayout>
              <Playbook />
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
          <Route path="/mapa-global" element={
            <AppLayout>
              <MapaGlobal />
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
    </TimezoneProvider>
  </QueryClientProvider>
);

export default App;
