import React, { lazy, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
// Lazy load non-critical components for better initial performance
const GDPRNotice = lazy(() => import('@/components/GDPRNotice'));
const GitHubAppreciationPopup = lazy(() => import('@/components/GitHubAppreciationPopup'));
const ScrollToTop = lazy(() => import('@/components/ScrollToTop'));

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = React.memo(({
  children
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-0 my-0" role="main">
        {children}
      </main>
      <Footer />
      <Suspense fallback={null}>
        <GDPRNotice />
        <GitHubAppreciationPopup />
        <ScrollToTop />
      </Suspense>
    </div>
  );
});

Layout.displayName = "Layout";

export default Layout;