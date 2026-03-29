import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';

// Компоненты
import Header from './components/Header';
import Hero from './components/Hero';

// Страницы
import Register from './pages/Register';
import Login from './pages/Login';
import About from './pages/About';
import Services from './pages/Services'; // 👇 Подключили страницу услуг
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <LanguageProvider>
      <Routes>
        {/* ГЛАВНАЯ СТРАНИЦА */}
        <Route path="/" element={
          <>
            <Header />
            <Hero />
          </>
        } />
        
        {/* СТРАНИЦА "O NÁS" */}
        <Route path="/about" element={
          <>
            <Header />
            <About />
          </>
        } />

        {/* СТРАНИЦА "SLUŽBY" */}
        <Route path="/services" element={
          <>
            <Header />
            <Services />
          </>
        } />
        
        {/* СТРАНИЦЫ ВХОДА И РЕГИСТРАЦИИ (без хедера) */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </LanguageProvider>
  );
}

export default App;