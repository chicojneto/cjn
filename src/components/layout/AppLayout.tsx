import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { MobileNav } from './MobileNav';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useDeviceType } from '@/hooks/useDeviceType';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useDeviceType();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Mobile and tablet layout - no sidebar, use sheet navigation
  if (isMobile || isTablet) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-gradient-mesh">
        <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
        <AppHeader onMobileMenuOpen={() => setMobileNavOpen(true)} />
        <motion.main 
          className="flex-1 p-3 sm:p-4 overflow-auto scrollbar-thin"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </div>
    );
  }

  // Desktop layout - full sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-mesh">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <AppHeader />
          <motion.main 
            className="flex-1 p-4 lg:p-6 overflow-auto scrollbar-thin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
