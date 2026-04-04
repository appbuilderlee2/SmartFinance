import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';

// Keep only the true first-screen pages synchronous.
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';

// Lazy-load everything else to shrink initial bundle.
const AddTransaction = lazy(() => import('./pages/AddTransaction'));
const TransactionDetail = lazy(() => import('./pages/TransactionDetail'));
const TransactionView = lazy(() => import('./pages/TransactionView'));
const Records = lazy(() => import('./pages/Records'));
const Settings = lazy(() => import('./pages/Settings'));
const CategoryManager = lazy(() => import('./pages/CategoryManager'));
const BudgetSettings = lazy(() => import('./pages/BudgetSettings'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const Calendar = lazy(() => import('./pages/Calendar'));
const CreditCardManager = lazy(() => import('./pages/CreditCardManager'));
const CreditCardCycles = lazy(() => import('./pages/CreditCardCycles'));
const AddSubscriptionPage = lazy(() => import('./pages/AddSubscription'));

// Reports is heavy (recharts). Lazy-load to reduce initial bundle.
const Reports = lazy(() => import('./pages/Reports'));

// Lazy pages (non-core / hidden behind Easter egg)
const CreditCard2 = lazy(() => import('./pages/CreditCard2'));
const CreditCard2Match = lazy(() => import('./pages/CreditCard2Match'));
const CreditCard2SwipeWhich = lazy(() => import('./pages/CreditCard2SwipeWhich'));
const CreditCard2PickCardRebate = lazy(() => import('./pages/CreditCard2PickCardRebate'));

// Layout
import Layout from './components/Layout';
import { hasOnboarded } from './utils/firstRun';

const Loading: React.FC = () => <div className="p-4 text-gray-400">載入中…</div>;

const App: React.FC = () => {
  const [swUpdate, setSwUpdate] = useState<ServiceWorkerRegistration | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ registration: ServiceWorkerRegistration }>).detail;
      if (detail?.registration) {
        setSwUpdate(detail.registration);
      }
    };
    window.addEventListener('sf-sw-update', handler as EventListener);
    return () => window.removeEventListener('sf-sw-update', handler as EventListener);
  }, []);

  useEffect(() => {
    if (!swUpdate || refreshing) return;
    const onControllerChange = () => {
      if (refreshing) return;
      setRefreshing(true);
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
  }, [swUpdate, refreshing]);

  const handleReload = () => {
    if (!swUpdate) return;
    if (swUpdate.waiting) {
      swUpdate.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return (
    <DataProvider>
      <Router>
        {swUpdate && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] sf-panel px-4 py-3 flex items-center gap-3">
            <span className="text-sm text-gray-200">有新版本可用</span>
            <button
              type="button"
              onClick={handleReload}
              className="text-sm text-primary font-semibold"
            >
              重新載入
            </button>
          </div>
        )}
        <Routes>
          {/* Public but local-only: keep Welcome as landing (1B) */}
          <Route path="/welcome" element={<Welcome />} />

          {/* App routes (no login required) */}
          <Route path="/" element={<Layout><Dashboard /></Layout>} />

          <Route
            path="/records"
            element={
              <Suspense fallback={<Layout><Loading /></Layout>}>
                <Layout><Records /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/calendar"
            element={
              <Suspense fallback={<Layout><Loading /></Layout>}>
                <Layout><Calendar /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/view/:id"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><TransactionView /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/add"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><AddTransaction /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><TransactionDetail /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/categories"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><CategoryManager /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/budget"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><BudgetSettings /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<Layout><Loading /></Layout>}>
                <Layout><Settings /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/settings/notifications"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><NotificationSettings /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/settings/creditcards"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><CreditCardManager /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/settings/creditcard-cycles"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><CreditCardCycles /></Layout>
              </Suspense>
            }
          />

          <Route
            path="/settings/creditcards2"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><CreditCard2 /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/settings/creditcards2/match"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><CreditCard2Match /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/settings/creditcards2/a"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><CreditCard2SwipeWhich /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/settings/creditcards2/b"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><CreditCard2PickCardRebate /></Layout>
              </Suspense>
            }
          />

          <Route
            path="/reports"
            element={
              <Suspense fallback={<Layout><Loading /></Layout>}>
                <Layout><Reports /></Layout>
              </Suspense>
            }
          />

          <Route
            path="/subscriptions"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><Subscriptions /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/add-subscription"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><AddSubscriptionPage /></Layout>
              </Suspense>
            }
          />
          <Route
            path="/subscriptions/:id/edit"
            element={
              <Suspense fallback={<Layout hideNav><Loading /></Layout>}>
                <Layout hideNav><AddSubscriptionPage /></Layout>
              </Suspense>
            }
          />

          {/* Default route: first-time users to Welcome; otherwise go to Dashboard */}
          <Route path="*" element={<Navigate to={hasOnboarded() ? "/" : "/welcome"} />} />
        </Routes>
      </Router>
    </DataProvider>
  );
};

export default App;
