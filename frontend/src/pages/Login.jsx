import React, { useState } from 'react'; // 👇 1. Добавили useState
import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';
import loginVector from '../assets/login-vector.svg'; 

function Login() {
  // 👇 2. Создаем "переключатели" для наведения мыши
  const [isLinkHovered, setIsLinkHovered] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  
  // 🟢 ДОБАВЛЕНО: состояние для стрелки
  const [isArrowHovered, setIsArrowHovered] = useState(false);

  return (
    <section style={styles.section}>
      
      {/* 🟢 ДОБАВЛЕНО: Анимированная стрелка "Назад" */}
      <Link 
        to="/" 
        style={styles.backArrowContainer}
        onMouseEnter={() => setIsArrowHovered(true)}
        onMouseLeave={() => setIsArrowHovered(false)}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          style={{
            ...styles.backArrowSvg,
            transform: isArrowHovered ? 'translateX(-5px)' : 'translateX(0)',
          }}
        >
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </Link>
      {/* ------------------------------------------- */}

      <div style={styles.loginContainer}>
        
        <div style={styles.logoHeader}>
          <img src={loginVector} alt="Vector decoration" style={styles.vector} />
          <img src={logo} alt="Subly Logo" style={styles.logo} />
        </div>

        <form style={styles.form}>
          <div style={styles.inputContainer}>
            <input 
              type="text" 
              placeholder="Přezdívka" 
              style={styles.input} 
            />
          </div>

          <div style={styles.inputContainer}>
            <input 
              type="password" 
              placeholder="Heslo" 
              style={styles.input} 
            />
          </div>

          <p style={styles.forgotPassword}>
            Zapomněli jste přezdívku nebo heslo?
          </p>
        </form>

        <div style={styles.bottomButtons}>
          
          {/* ССЫЛКА "Vytvořit účet" */}
          <Link 
            to="/register" 
            // 👇 Объединяем обычный стиль и стиль при наведении
            style={{
              ...styles.createAccountLink,
              ...(isLinkHovered ? styles.createAccountLinkHover : {})
            }}
            // 👇 Отслеживаем мышку
            onMouseEnter={() => setIsLinkHovered(true)}
            onMouseLeave={() => setIsLinkHovered(false)}
          >
            Vytvořit účet
          </Link>

          {/* КНОПКА "Dále" */}
          <div 
            style={{
              ...styles.nextButtonContainer,
              ...(isBtnHovered ? styles.nextButtonContainerHover : {})
            }}
            onMouseEnter={() => setIsBtnHovered(true)}
            onMouseLeave={() => setIsBtnHovered(false)}
          >
            <button style={styles.nextButton}>
              Dále
            </button>
          </div>
        </div>

      </div>

    </section>
  );
}

const styles = {
  section: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#5A6E26',
    fontFamily: 'Montserrat, sans-serif',
  },
  
  // 🟢 ДОБАВЛЕНО: Стили для стрелки
  backArrowContainer: {
    position: 'absolute',
    top: '40px',
    left: '40px',
    cursor: 'pointer',
    padding: '10px',
    zIndex: 10,
    display: 'flex',
  },
  backArrowSvg: {
    width: '40px',
    height: '40px',
    fill: '#EFE3D7', 
    transition: 'transform 0.3s ease',
  },
  // ------------------------------

  loginContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '450px', 
    padding: '20px',
  },
  
  logoHeader: {
    position: 'relative', 
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '50px', 
    width: '100%',
    height: '100px', 
  },
  vector: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)', 
    width: '240px', 
    height: 'auto',
    zIndex: 1,
    opacity: 0.9,
  },
  logo: {
    height: '55px',
    width: 'auto',
    zIndex: 2,
    position: 'relative', 
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    marginBottom: '50px', 
  },
  inputContainer: {
    backgroundColor: '#EFE3D7',
    borderRadius: '20px',
    padding: '15px 25px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  input: {
    width: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '18px',
    fontWeight: '600',
    color: '#7A2F2F',
    fontFamily: 'inherit',
    '::placeholder': {
      color: '#A68E7A', 
      opacity: 1,
    },
  },
  forgotPassword: {
    textAlign: 'center',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    marginTop: '10px',
    opacity: 0.9,
  },

  bottomButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 'auto',
    padding: '0 30px', 
    boxSizing: 'border-box', 
  },
  
  // --- АНИМАЦИЯ ССЫЛКИ ---
  createAccountLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s ease', // 👇 Плавность
  },
  createAccountLinkHover: {
    transform: 'scale(1.05)',    // Чуть увеличиваем
    opacity: 0.8,                // Чуть прозрачнее
  },

  // --- АНИМАЦИЯ КНОПКИ ---
  nextButtonContainer: {
    backgroundColor: '#EFE3D7',
    borderRadius: '30px',
    padding: '12px 45px', 
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
    cursor: 'pointer',
    transition: 'all 0.3s ease', // 👇 Плавность
  },
  nextButtonContainerHover: {
    transform: 'scale(1.05)',    // Увеличиваем кнопку
    boxShadow: '0 6px 15px rgba(0,0,0,0.25)', // Тень становится глубже
  },
  
  nextButton: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#7A2F2F',
    fontSize: '18px',
    fontWeight: '800',
    cursor: 'pointer', // Чтобы курсор менялся и на тексте
    pointerEvents: 'none', // Чтобы клик проходил сквозь текст на контейнер (для плавности)
    fontFamily: 'inherit',
  },
};

export default Login;