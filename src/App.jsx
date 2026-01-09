import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import LogShift from './pages/LogShift';
import NewLead from './pages/NewLead';
import LogSale from './pages/LogSale';
import MyDispensaries from './pages/MyDispensaries';
import AdminDashboard from './pages/AdminDashboard';
import BrandOversight from './pages/BrandOversight';
import Login from './pages/Login';
import Menus from './pages/Menus';
import Accounts from './pages/Accounts';
import Leaderboard from './pages/Leaderboard';
import CommissionPayouts from './pages/CommissionPayouts';
import WagesPayouts from './pages/WagesPayouts';
import ActiveAccounts from './pages/ActiveAccounts';
import LeadMap from './pages/LeadMap';
import Schedule from './pages/Schedule';
// BrandOversight removed
import PrivateRoute from './components/PrivateRoute';
import GatewayLanding from './pages/GatewayLanding';
import { NotificationProvider } from './contexts/NotificationContext';

// Admin Portal Imports
import AdminLogin from './pages/admin/AdminLogin';
import AdminPrivateRoute from './components/AdminPrivateRoute';
// AdminLayout will be created in the next step, but need to import it potentially or create it now.
// For now let's comment it out or create a placeholder since I can't import a non-existent file without breaking the build.
// Actually, I will create AdminLayout in the next tool call. I'll use a temporary dummy for now to avoid breaking the build while I create the layout.
// Wait, I should create AdminLayout first.
// I'll proceed with adding imports assuming I will create AdminLayout immediately after or use a placeholder.
// I'll use a placeholder import for now.
import AdminLayout from './components/admin/AdminLayout';
import NewAdminDashboard from './pages/admin/Dashboard'; // Is this still needed? Yes, for the main overview
import AdminFinancials from './components/admin/views/AdminFinancials';
import AdminTerritory from './components/admin/views/AdminTerritory';
import AdminTeam from './components/admin/views/AdminTeam';
import AdminGrowth from './components/admin/views/AdminGrowth';
import LegacyAdminDashboard from './pages/AdminDashboard'; // Restored as Legacy Console
import AdminWorkflow from './components/admin/views/AdminWorkflow';
import AdminInvoiceGenerator from './components/admin/views/AdminInvoiceGenerator';
import AmbassadorOverview from './components/admin/AmbassadorOverview';

// Brand Portal Imports
import BrandLogin from './pages/brand/BrandLogin';
import BrandLayout from './components/BrandLayout';
import BrandDashboard from './pages/brand/BrandDashboard';
import BrandOrders from './pages/brand/BrandOrders';
import BrandInvoicesDispensary from './pages/brand/BrandInvoicesDispensary';
import BrandInvoicesGreenTruth from './pages/brand/BrandInvoicesGreenTruth';
import BrandMenuEditor from './pages/brand/BrandMenuEditor';
import BrandSchedule from './pages/brand/BrandSchedule';
import BrandMap from './pages/brand/BrandMap';
import BrandNewLead from './pages/brand/BrandNewLead';
import BrandPrivateRoute from './components/BrandPrivateRoute';

// Dispensary Portal Imports
import DispensaryVerification from './pages/dispensary/DispensaryVerification';
import DispensaryLogin from './pages/dispensary/DispensaryLogin';
import DispensaryRegistration from './pages/dispensary/DispensaryRegistration';
import DispensaryLayout from './components/DispensaryLayout';
import DispensaryDashboard from './pages/dispensary/DispensaryDashboard';
import DispensaryPrivateRoute from './components/DispensaryPrivateRoute';
import DispensaryMarketplace from './pages/dispensary/DispensaryMarketplace';

function App() {
  return (
    <NotificationProvider>
      <Routes>

        {/* Gateway Landing Page */}
        <Route path="/" element={<GatewayLanding />} />

        {/* Admin Portal (New) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<AdminPrivateRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<NewAdminDashboard />} />
            <Route path="workflow" element={<AdminWorkflow />} />
            <Route path="financials" element={<AdminFinancials />} />
            <Route path="invoices" element={<AdminInvoiceGenerator />} />
            <Route path="territory" element={<AdminTerritory />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="team/:userId" element={<AmbassadorOverview />} />
            <Route path="pipeline" element={<AdminGrowth />} /> {/* Reusing AdminGrowth component for Pipeline view */}
            <Route path="growth" element={<LegacyAdminDashboard />} /> {/* Legacy Console is now the main Growth view */}
          </Route>
        </Route>

        {/* Sales Ambassador Portal */}
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute />}>
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
            {/* Legacy Admin Routes Restored */}
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="brand-oversight" element={<BrandOversight />} />
            {/* Fallback route */}
            <Route path="*" element={<Dashboard />} />
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
          </Route>
        </Route>
      </Routes>
    </NotificationProvider>
  );
}

export default App;

