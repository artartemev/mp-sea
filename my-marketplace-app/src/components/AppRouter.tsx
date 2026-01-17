// src/components/AppRouter.tsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { HomePage, LoginPage, CatalogPage, ListingPage, UserProfilePage, DashboardLayout, MyListingsPage, CreateListingPage, SettingsPage, EditListingPage } from './';

// Wrapper for animating pages
const AnimatedPage = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const AppRouter = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Публичные роуты */}
                <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
                <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
                <Route path="/catalog" element={<AnimatedPage><CatalogPage /></AnimatedPage>} />
                <Route path="/item/:id" element={<AnimatedPage><ListingPage /></AnimatedPage>} />
                <Route path="/user/:id" element={<AnimatedPage><UserProfilePage /></AnimatedPage>} />

                {/* Приватные роуты */}
                <Route path="/dashboard/listings" element={<ProtectedRoute><AnimatedPage><DashboardLayout title="Мои объявления"><MyListingsPage /></DashboardLayout></AnimatedPage></ProtectedRoute>} />
                <Route path="/dashboard/listings/new" element={<ProtectedRoute><AnimatedPage><DashboardLayout title="Новое объявление"><CreateListingPage /></DashboardLayout></AnimatedPage></ProtectedRoute>} />
                <Route path="/dashboard/listings/edit/:listingId" element={<ProtectedRoute><AnimatedPage><DashboardLayout title="Редактировать"><EditListingPage /></DashboardLayout></AnimatedPage></ProtectedRoute>} />
                <Route path="/dashboard/settings" element={<ProtectedRoute><AnimatedPage><DashboardLayout title="Настройки"><SettingsPage /></DashboardLayout></AnimatedPage></ProtectedRoute>} />
            </Routes>
        </AnimatePresence>
    );
};
