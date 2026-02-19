import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Компоненты
import Header from './components/Header';
import Hero from './components/Hero';

// Страницы
import Register from './pages/Register';
import Login from './pages/Login';
import About from './pages/About';
import Services from './pages/Services'; // 👇 Подключили страницу услуг

function App() {
  return (
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

      {/* СТРАНИЦА "SLUŽBY" 👇 Добавили маршрут */}
      <Route path="/services" element={
        <>
          <Header />
          <Services />
        </>
      } />
      
      {/* СТРАНИЦЫ ВХОДА И РЕГИСТРАЦИИ (без хедера) */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;