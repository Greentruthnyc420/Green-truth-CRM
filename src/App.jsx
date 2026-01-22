import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Core components that load immediately
import Layout from './components/Layout';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import GatewayLanding from './pages/GatewayLanding';
import PrivateRoute from './components/PrivateRoute';
import { NotificationProvider } from './contexts/NotificationContext';

// Loading fallback component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#0f172a',
    color: '#10b981'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
      <div>Loading...</div>
    </div>
  </div>
);

// Lazy loaded pages - Sales Portal
const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const LogShift = lazy(() => import('./pages/LogShift'));
const NewLead = lazy(() => import('./pages/NewLead'));
const LogSale = lazy(() => import('./pages/LogSale'));
const MyDispensaries = lazy(() => import('./pages/MyDispensaries'));
const Menus = lazy(() => import('./pages/Menus'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const CommissionPayouts = lazy(() => import('./pages/CommissionPayouts'));
const WagesPayouts = lazy(() => import('./pages/WagesPayouts'));
const ActiveAccounts = lazy(() => import('./pages/ActiveAccounts'));
const LeadMap = lazy(() => import('./pages/LeadMap'));
const Schedule = lazy(() => import('./pages/Schedule'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const BrandOversight = lazy(() => import('./pages/BrandOversight'));

// Lazy loaded pages - Admin Portal
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminPrivateRoute = lazy(() => import('./components/AdminPrivateRoute'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const NewAdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminFinancials = lazy(() => import('./components/admin/views/AdminFinancials'));
const AdminTerritory = lazy(() => import('./components/admin/views/AdminTerritory'));
const AdminTeam = lazy(() => import('./components/admin/views/AdminTeam'));
const AdminGrowth = lazy(() => import('./components/admin/views/AdminGrowth'));
const LegacyAdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminWorkflow = lazy(() => import('./components/admin/views/AdminWorkflow'));
const AdminInvoiceGenerator = lazy(() => import('./components/admin/views/AdminInvoiceGenerator'));
const AmbassadorOverview = lazy(() => import('./components/admin/AmbassadorOverview'));
const AdminBrands = lazy(() => import('./components/admin/views/AdminBrands'));
const AdminCollections = lazy(() => import('./components/admin/views/AdminCollections'));
const DispensaryDetail = lazy(() => import('./pages/admin/DispensaryDetail'));
const AdminRoleManagement = lazy(() => import('./components/admin/views/AdminRoleManagement'));
const AdminActivationRequests = lazy(() => import('./components/admin/views/AdminActivationRequests'));

// Lazy loaded pages - Brand Portal
const BrandLogin = lazy(() => import('./pages/brand/BrandLogin'));
const BrandLayout = lazy(() => import('./components/BrandLayout'));
const BrandDashboard = lazy(() => import('./pages/brand/BrandDashboard'));
const BrandOrders = lazy(() => import('./pages/brand/BrandOrders'));
const BrandInvoicesDispensary = lazy(() => import('./pages/brand/BrandInvoicesDispensary'));
const BrandInvoicesGreenTruth = lazy(() => import('./pages/brand/BrandInvoicesGreenTruth'));
const BrandMenuEditor = lazy(() => import('./pages/brand/BrandMenuEditor'));
const BrandSchedule = lazy(() => import('./pages/brand/BrandSchedule'));
const BrandMap = lazy(() => import('./pages/brand/BrandMap'));
const BrandNewLead = lazy(() => import('./pages/brand/BrandNewLead'));
const BrandFulfillment = lazy(() => import('./pages/brand/BrandFulfillment'));
const BrandPipeline = lazy(() => import('./pages/brand/BrandPipeline'));
const BrandPrivateRoute = lazy(() => import('./components/BrandPrivateRoute'));
const BrandDeals = lazy(() => import('./pages/brand/BrandDeals'));
const BrandProducts = lazy(() => import('./pages/brand/BrandProducts'));
const IntegrationsSettings = lazy(() => import('./pages/settings/IntegrationsSettings'));

// Lazy loaded pages - Dispensary Portal
const DispensaryVerification = lazy(() => import('./pages/dispensary/DispensaryVerification'));
const DispensaryLogin = lazy(() => import('./pages/dispensary/DispensaryLogin'));
const DispensaryRegistration = lazy(() => import('./pages/dispensary/DispensaryRegistration'));
const DispensaryLayout = lazy(() => import('./components/DispensaryLayout'));
const DispensaryDashboard = lazy(() => import('./pages/dispensary/DispensaryDashboard'));
const DispensaryPrivateRoute = lazy(() => import('./components/DispensaryPrivateRoute'));
const DispensaryMarketplace = lazy(() => import('./pages/dispensary/DispensaryMarketplace'));
const DispensarySchedule = lazy(() => import('./pages/dispensary/DispensarySchedule'));
const DispensaryInvoices = lazy(() => import('./pages/dispensary/DispensaryInvoices'));
const DispensaryOrders = lazy(() => import('./pages/dispensary/DispensaryOrders'));
const DispensarySettings = lazy(() => import('./pages/dispensary/DispensarySettings'));

// Lazy loaded pages - Driver Portal
const DriverLogin = lazy(() => import('./pages/driver/DriverLogin'));
const DriverDashboard = lazy(() => import('./pages/driver/DriverDashboard'));

// Lazy loaded pages - Onboarding
const ContractorOnboarding = lazy(() => import('./pages/ContractorOnboarding'));
const OnboardingRoute = lazy(() => import('./components/OnboardingRoute'));
const CompensationPortal = lazy(() => import('./pages/CompensationPortal'));

function App() {
  return (
    <NotificationProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* New Animated Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Gateway Landing Page */}
          <Route path="/gateway" element={<GatewayLanding />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Admin Portal (New) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route element={<AdminPrivateRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<NewAdminDashboard />} />
              <Route path="dashboard" element={<NewAdminDashboard />} />
              <Route path="workflow" element={<AdminWorkflow />} />
              <Route path="activations" element={<AdminActivationRequests />} />
              <Route path="financials" element={<AdminFinancials />} />
              <Route path="invoices" element={<AdminInvoiceGenerator />} />
              <Route path="territory" element={<AdminTerritory />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="team/:userId" element={<AmbassadorOverview />} />
              <Route path="pipeline" element={<AdminGrowth />} />
              <Route path="growth" element={<LegacyAdminDashboard />} />
              <Route path="brands" element={<AdminBrands />} />
              <Route path="brands/:brandId" element={<AdminBrands />} />
              <Route path="collections" element={<AdminCollections />} />
              <Route path="dispensary/:id" element={<DispensaryDetail />} />
              <Route path="roles" element={<AdminRoleManagement />} />
            </Route>
          </Route>

          {/* Sales Ambassador Portal */}
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<ContractorOnboarding />} />
          <Route path="/compensation-guide" element={<CompensationPortal />} />

          <Route element={<PrivateRoute />}>
            <Route element={<OnboardingRoute />}>
              <Route path="/app" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="map" element={<LeadMap />} />
                <Route path="my-dispensaries" element={<MyDispensaries />} />
                <Route path="history" element={<History />} />
                <Route path="log-shift" element={<LogShift />} />
                <Route path="log-sale" element={<LogSale />} />
                <Route path="new-lead" element={<NewLead />} />
                <Route path="menus" element={<Menus />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="payouts/commissions" element={<CommissionPayouts />} />
                <Route path="payouts/wages" element={<WagesPayouts />} />
                <Route path="accounts/active" element={<ActiveAccounts />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="settings" element={<ProfileSettings />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="brand-oversight" element={<BrandOversight />} />
                <Route path="*" element={<Dashboard />} />
              </Route>
            </Route>
          </Route>

          {/* Brand Owner Portal */}
          <Route path="/brand/login" element={<BrandLogin />} />

          <Route element={<BrandPrivateRoute />}>
            <Route path="/brand" element={<BrandLayout />}>
              <Route index element={<BrandDashboard />} />
              <Route path="orders" element={<BrandOrders />} />
              <Route path="invoices/dispensary" element={<BrandInvoicesDispensary />} />
              <Route path="invoices/greentruth" element={<BrandInvoicesGreenTruth />} />
              <Route path="schedule" element={<BrandSchedule />} />
              <Route path="menu" element={<BrandMenuEditor />} />
              <Route path="map" element={<BrandMap />} />
              <Route path="new-lead" element={<BrandNewLead />} />
              <Route path="pipeline" element={<BrandPipeline />} />
              <Route path="fulfillment" element={<BrandFulfillment />} />
              <Route path="deals" element={<BrandDeals />} />
              <Route path="products" element={<BrandProducts />} />
              <Route path="integrations" element={<IntegrationsSettings portalType="brand" />} />
            </Route>
          </Route>

          {/* Dispensary Portal */}
          <Route path="/dispensary/verify" element={<DispensaryVerification />} />
          <Route path="/dispensary/login" element={<DispensaryLogin />} />
          <Route path="/dispensary/register" element={<DispensaryRegistration />} />

          <Route element={<DispensaryPrivateRoute />}>
            <Route path="/dispensary" element={<DispensaryLayout />}>
              <Route index element={<DispensaryDashboard />} />
              <Route path="marketplace" element={<DispensaryMarketplace />} />
              <Route path="schedule" element={<DispensarySchedule />} />
              <Route path="orders" element={<DispensaryOrders />} />
              <Route path="invoices" element={<DispensaryInvoices />} />
              <Route path="settings" element={<DispensarySettings />} />
              <Route path="integrations" element={<IntegrationsSettings portalType="dispensary" />} />
            </Route>
          </Route>

          {/* Driver Portal */}
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />

        </Routes>
      </Suspense>
    </NotificationProvider>
  );
}

export default App;
