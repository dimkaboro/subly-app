import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';

function ForgotPassword() {
  const navigate = useNavigate();
  
  // Состояния для данных
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Управление шагами: 1 - ввод email, 2 - ввод кода и нового пароля, 3 - успех
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  // Состояния для анимаций
  const [isArrowHovered, setIsArrowHovered] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  // 1. Отправка запроса на получение кода в ТГ
  const handleRequestCode = (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Zadejte prosím svůj e-mail');
      return;
    }
    setErrorMsg('');
    
    // ⏳ ПОЗЖЕ: тут будет fetch-запрос к бэкенду для отправки кода в ТГ
    console.log('Žádost o kód odeslána pro:', email);
    
    // Имитируем успешный ответ бэкенда и переводим на Шаг 2
    setStep(2);
  };

  // 2. Отправка кода из ТГ и нового пароля
  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!code || !newPassword) {
      setErrorMsg('Vyplňte prosím všechna pole');
      return;
    }
    setErrorMsg('');

    // ⏳ ПОЗЖЕ: тут будет fetch-запрос для проверки кода и сохранения пароля
    console.log('Měníme heslo. Kód:', code, 'Nové heslo:', newPassword);

    // Имитируем успех и показываем Шаг 3 (сообщение об успехе)
    setStep(3);
  };

  return (
    <section style={styles.section}>
      
      {/* Стрелка "Назад" */}
      <Link 
        to="/login" 
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

      <div style={styles.container}>
        
        <div style={styles.logoHeader}>
          <img src={logo} alt="Subly Logo" style={styles.logo} />
        </div>

        <h2 style={styles.title}>Obnova hesla</h2>
        
        {/* Блок для показа ошибок (если они есть) */}
        {errorMsg && (
          <div style={{ color: '#D8000C', marginBottom: '15px', fontWeight: '600', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        {/* ШАГ 1: Ввод E-mail */}
        {step === 1 && (
          <>
            <p style={styles.subtitle}>
              Zadejte svůj e-mail. Kód pro obnovení vám zašleme do našeho Telegram bota.
            </p>

            <form style={styles.form} onSubmit={handleRequestCode}>
              <div style={styles.inputContainer}>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail" 
                  style={styles.input} 
                  required
                />
              </div>

              <div 
                style={{
                  ...styles.buttonContainer,
                  ...(isBtnHovered ? styles.buttonContainerHover : {})
                }}
                onMouseEnter={() => setIsBtnHovered(true)}
                onMouseLeave={() => setIsBtnHovered(false)}
                onClick={handleRequestCode}
              >
                <button type="submit" style={styles.button}>
                  Získat kód
                </button>
              </div>
            </form>
          </>
        )}

        {/* ШАГ 2: Ввод кода из ТГ и нового пароля */}
        {step === 2 && (
          <>
            <p style={styles.subtitle}>
              Zadejte 6místný kód z Telegramu a vytvořte si nové heslo.
            </p>

            <form style={styles.form} onSubmit={handleResetPassword}>
              <div style={styles.inputContainer}>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Kód z Telegramu" 
                  style={styles.input} 
                  required
                />
              </div>

              <div style={styles.inputContainer}>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nové heslo" 
                  style={styles.input} 
                  required
                />
              </div>

              <div 
                style={{
                  ...styles.buttonContainer,
                  ...(isBtnHovered ? styles.buttonContainerHover : {})
                }}
                onMouseEnter={() => setIsBtnHovered(true)}
                onMouseLeave={() => setIsBtnHovered(false)}
                onClick={handleResetPassword}
              >
                <button type="submit" style={styles.button}>
                  Uložit nové heslo
                </button>
              </div>
            </form>
          </>
        )}

        {/* ШАГ 3: Успех */}
        {step === 3 && (
          <div style={styles.successMessage}>
            <p style={{ marginBottom: '15px' }}>
              Vaše heslo bylo úspěšně změněno! Nyní se můžete přihlásit.
            </p>
            <Link 
              to="/login" 
              style={{ color: '#EFE3D7', fontWeight: 'bold', textDecoration: 'underline' }}
            >
              Zpět na přihlášení
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}

// Стили остались точно такие же, как были
const styles = {
  section: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#5A6E26',
    fontFamily: 'Montserrat, sans-serif',
  },
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
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '450px', 
    padding: '20px',
  },
  logoHeader: {
    marginBottom: '30px', 
    display: 'flex',
    justifyContent: 'center',
  },
  logo: {
    height: '55px',
    width: 'auto',
  },
  title: {
    color: 'white',
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '10px',
    textAlign: 'center',
  },
  subtitle: {
    color: '#EFE3D7',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '30px',
    opacity: 0.9,
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
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
  buttonContainer: {
    backgroundColor: '#EFE3D7',
    borderRadius: '30px',
    padding: '15px 45px', 
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    justifyContent: 'center',
    marginTop: '10px',
  },
  buttonContainerHover: {
    transform: 'scale(1.05)', 
    boxShadow: '0 6px 15px rgba(0,0,0,0.25)', 
  },
  button: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#7A2F2F',
    fontSize: '18px',
    fontWeight: '800',
    cursor: 'pointer', 
    pointerEvents: 'none', 
    fontFamily: 'inherit',
  },
  successMessage: {
    backgroundColor: 'rgba(239, 227, 215, 0.1)',
    border: '1px solid #EFE3D7',
    color: '#EFE3D7',
    padding: '30px',
    borderRadius: '20px',
    textAlign: 'center',
    fontSize: '16px',
    lineHeight: '1.5',
    marginTop: '20px',
    width: '100%',
  }
};

export default ForgotPassword;