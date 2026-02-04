import React from 'react';
import { Link } from 'react-router-dom';

// 👇 Импортируем твой логотип
import logo from '../assets/logo.svg'; 

function Header() {
  return (
    <header style={styles.header}>
      
      {/* ЛЕВЫЙ БЛОК: Логотип */}
      <div style={styles.sideBlock}>
        {/* Ссылка на главную через картинку */}
        <Link to="/" style={styles.logoLink}>
           <img src={logo} alt="Subly Logo" style={styles.logoImage} />
        </Link>
      </div>

      {/* ЦЕНТР: Меню */}
      <nav style={styles.nav}>
        <a href="#" style={styles.link}>O nás</a>
        <a href="#" style={styles.link}>Služby</a>
        
        {/* Ссылка на Логин */}
        <Link to="/login" style={styles.link}>Login</Link>
      </nav>

      {/* ПРАВЫЙ БЛОК: Пустота для баланса */}
      <div style={styles.sideBlock}></div> 
    </header>
  );
}

const styles = {
    header: {
        backgroundColor: 'var(--color-cherry)',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 50px',
        color: 'var(--color-white)',
        fontFamily: 'Montserrat, sans-serif', 
    },
    // Боковые блоки для центровки меню
    sideBlock: {
        width: '200px', 
        display: 'flex',
        alignItems: 'center',
        // justifyContent: 'flex-start', // Логотип слева
    },
    
    // 👇 Стили для ссылки-обертки логотипа
    logoLink: {
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        cursor: 'pointer',
    },
    
    // 👇 Стили для самой картинки SVG
    logoImage: {
        height: '50px',   // Высота логотипа (подстрой под себя: 40px, 50px, 60px)
        width: 'auto',    // Ширина подстроится автоматически
        display: 'block', // Убирает лишние отступы снизу
    },

    nav: {
        display: 'flex',
        width: '800px',          
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    link: {
        color: 'var(--color-white)',
        fontSize: '16px',
        fontWeight: '500',
        opacity: 0.9,
        textDecoration: 'none', 
        transition: 'opacity 0.3s',
    }
};

export default Header;