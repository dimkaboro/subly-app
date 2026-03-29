import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

// Импортируем логотип
import logo from '../assets/logo.svg'; 

function Header() {
  const { t } = useLanguage();

  return (
    <header style={styles.header}>
      
      {/* ЛЕВЫЙ БЛОК: Логотип */}
      <div style={styles.sideBlock}>
        <Link to="/" style={styles.logoLink}>
           <img src={logo} alt="Subly Logo" style={styles.logoImage} />
        </Link>
      </div>

      {/* ЦЕНТР: Меню */}
      <nav style={styles.nav}>
        <Link to="/about" style={styles.link}>{t('header.about')}</Link>
        <Link to="/services" style={styles.link}>{t('header.services')}</Link>
        <Link to="/login" style={styles.link}>{t('header.login')}</Link>
      </nav>

      {/* ПРАВЫЙ БЛОК: Выбор языка */}
      <div style={styles.sideBlockRight}>
        <LanguageSwitcher color="#FFFFFF" />
      </div> 
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
    sideBlock: {
        width: '200px', 
        display: 'flex',
        alignItems: 'center',
    },
    sideBlockRight: {
        width: '200px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    logoLink: {
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        cursor: 'pointer',
    },
    logoImage: {
        height: '50px',   
        width: 'auto',    
        display: 'block', 
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