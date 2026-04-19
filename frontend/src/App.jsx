import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';

// Komponenty
import Header from './components/Header';
import Hero from './components/Hero';

// Stránky
import Register from './pages/Register';
import Login from './pages/Login';
import About from './pages/About';
import Services from './pages/Services';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <LanguageProvider>
      <Routes>
        {/* HLAVNÍ STRÁNKA */}
        <Route path="/" element={
          <>
            <Header />
            <Hero />
          </>
        } />
        
        {/* STRÁNKA "O NÁS" */}
        <Route path="/about" element={
          <>
            <Header />
            <About />
          </>
        } />

        {/* STRÁNKA "SLUŽBY" */}
        <Route path="/services" element={
          <>
            <Header />
            <Services />
          </>
        } />
        
        {/* PŘIHLÁŠENÍ / REGISTRACE (bez hlavičky) */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </LanguageProvider>
  );
}

export default App;