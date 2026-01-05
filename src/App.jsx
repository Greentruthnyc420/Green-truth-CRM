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
import Login from './pages/Login';
import Menus from './pages/Menus';
import Accounts from './pages/Accounts';
import Leaderboard from './pages/Leaderboard';
import CommissionPayouts from './pages/CommissionPayouts';
import WagesPayouts from './pages/WagesPayouts';
import ActiveAccounts from './pages/ActiveAccounts';
import LeadMap from './pages/LeadMap';
import Schedule from './pages/Schedule';
import BrandOversight from './pages/BrandOversight';
import PrivateRoute from './components/PrivateRoute';
import GatewayLanding from './pages/GatewayLanding';

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
import BrandPrivateRoute from './components/BrandPrivateRoute';

function App() {
  return (
    <Routes>
      {/* Gateway Landing Page */}
      <Route path="/" element={<GatewayLanding />} />

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
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

