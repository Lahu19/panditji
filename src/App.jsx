import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Navbar             from './components/Navbar';
import Home               from './pages/Home';
import TellUs             from './pages/TellUs';
import Browse             from './pages/Browse';
import Search             from './pages/Search';
import AllPandits         from './pages/AllPandits';
import PanditProfile      from './pages/PanditProfile';
import ServiceDetail      from './pages/ServiceDetail';
import BookingConfirm     from './pages/BookingConfirm';
import MyBookings         from './pages/MyBookings';

/* ── Admin ── */
import AdminLayout    from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProviders from './pages/admin/AdminProviders';
import AdminUsers     from './pages/admin/AdminUsers';
import AdminLocations from './pages/admin/AdminLocations';
import AdminRequests  from './pages/admin/AdminRequests';
import AdminBookings  from './pages/admin/AdminBookings';
import AdminReviews   from './pages/admin/AdminReviews';
import AdminAudit     from './pages/admin/AdminAudit';
import AdminServices  from './pages/admin/AdminServices';

/* ── Pandit Portal ── */
import PanditPortalLayout      from './pages/pandit-portal/PanditPortalLayout';
import PanditLogin             from './pages/pandit-portal/PanditLogin';
import PanditBecome            from './pages/pandit-portal/PanditBecome';
import PanditOnboarding        from './pages/pandit-portal/PanditOnboarding';
import PanditDashboard         from './pages/pandit-portal/PanditDashboard';
import PanditPortalProfile     from './pages/pandit-portal/PanditProfile';
import PanditServices          from './pages/pandit-portal/PanditServices';
import PanditServiceAreas      from './pages/pandit-portal/PanditServiceAreas';
import PanditAvailability      from './pages/pandit-portal/PanditAvailability';
import PanditBookingRequests   from './pages/pandit-portal/PanditBookingRequests';
import PanditBookings          from './pages/pandit-portal/PanditBookings';
import PanditEarnings          from './pages/pandit-portal/PanditEarnings';
import PanditReviews           from './pages/pandit-portal/PanditReviews';
import PanditVerification      from './pages/pandit-portal/PanditVerification';
import PanditNotifications     from './pages/pandit-portal/PanditNotifications';

export default function App() {
  const location = useLocation();

  /* Hide customer navbar on full-screen flows, admin, and pandit-portal */
  const hideNav = ['/tell-us', '/book', '/admin', '/pandit-portal'].some(
    p => location.pathname.startsWith(p)
  );

  return (
    <>
      {!hideNav && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* ── Customer routes ── */}
          <Route path="/"              element={<Home />} />
          <Route path="/tell-us"       element={<TellUs />} />
          <Route path="/browse"        element={<Browse />} />
          <Route path="/search"        element={<Search />} />
          <Route path="/pandits"       element={<AllPandits />} />
          <Route path="/pandit/:id"    element={<PanditProfile />} />
          <Route path="/service/:id"   element={<ServiceDetail />} />
          <Route path="/book/:id"      element={<BookingConfirm />} />
          <Route path="/my-bookings"   element={<MyBookings />} />

          {/* ── Pandit Portal — standalone pages (outside layout) ── */}
          <Route path="/pandit-portal/login"  element={<PanditLogin />} />
          <Route path="/pandit-portal/become" element={<PanditBecome />} />

          {/* ── Pandit Portal — authenticated portal (uses PanditPortalLayout) ── */}
          <Route path="/pandit-portal" element={<PanditPortalLayout />}>
            <Route index                 element={<PanditDashboard />} />
            <Route path="onboarding"     element={<PanditOnboarding />} />
            <Route path="profile"        element={<PanditPortalProfile />} />
            <Route path="services"       element={<PanditServices />} />
            <Route path="service-areas"  element={<PanditServiceAreas />} />
            <Route path="availability"   element={<PanditAvailability />} />
            <Route path="requests"       element={<PanditBookingRequests />} />
            <Route path="bookings"       element={<PanditBookings />} />
            <Route path="earnings"       element={<PanditEarnings />} />
            <Route path="reviews"        element={<PanditReviews />} />
            <Route path="verification"   element={<PanditVerification />} />
            <Route path="notifications"  element={<PanditNotifications />} />
          </Route>

          {/* ── Admin routes — nested inside AdminLayout ── */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index            element={<AdminDashboard />} />
            <Route path="providers" element={<AdminProviders />} />
            <Route path="users"     element={<AdminUsers />} />
            <Route path="locations" element={<AdminLocations />} />
            <Route path="requests"  element={<AdminRequests />} />
            <Route path="bookings"  element={<AdminBookings />} />
            <Route path="reviews"   element={<AdminReviews />} />
            <Route path="audit"     element={<AdminAudit />} />
            <Route path="services"  element={<AdminServices />} />
          </Route>

          {/* ── 404 ── */}
          <Route path="*" element={
            <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,fontFamily:'var(--font-display)',color:'var(--text-light)' }}>
              <span style={{ fontSize:'4rem' }}>🕉️</span>
              <span>Page not found</span>
              <a href="/" style={{ color:'var(--saffron)' }}>Go Home</a>
            </div>
          }/>

        </Routes>
      </AnimatePresence>
    </>
  );
}
