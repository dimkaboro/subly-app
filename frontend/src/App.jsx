import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Компоненты
import Header from './components/Header';
import Hero from './components/Hero';

// Страницы
import Register from './pages/Register';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      {/* ГЛАВНАЯ СТРАНИЦА:
          Показываем И Хедер, И Hero.
          Они обернуты в пустые скобки <></>, так как element принимает только один родительский блок.
      */}
      <Route path="/" element={
        <>
          <Header />
          <Hero />
        </>
      } />
      
      {/* СТРАНИЦЫ ВХОДА И РЕГИСТРАЦИИ:
          Здесь Хедера НЕТ, только сама страница.
      */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;