import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Navbar         from './components/Navbar';
import Home           from './pages/Home';
import TellUs         from './pages/TellUs';
import Browse         from './pages/Browse';
import Search         from './pages/Search';
import AllPandits     from './pages/AllPandits';
import PanditProfile  from './pages/PanditProfile';
import ServiceDetail  from './pages/ServiceDetail';
import BookingConfirm from './pages/BookingConfirm';

export default function App() {
  const location = useLocation();

  // Hide navbar on full-screen flows
  const hideNav = ['/tell-us', '/book'].some(p => location.pathname.startsWith(p));

  return (
    <>
      {!hideNav && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"              element={<Home />} />
          <Route path="/tell-us"       element={<TellUs />} />
          <Route path="/browse"        element={<Browse />} />
          <Route path="/search"        element={<Search />} />
          <Route path="/pandits"       element={<AllPandits />} />
          <Route path="/pandit/:id"    element={<PanditProfile />} />
          <Route path="/service/:id"   element={<ServiceDetail />} />
          <Route path="/book/:id"      element={<BookingConfirm />} />
          <Route path="*"              element={
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
