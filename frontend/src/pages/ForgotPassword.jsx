import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { useLanguage } from '../context/LanguageContext';

function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showRules, setShowRules] = useState(false);

  // Управление шагами: 1 - email, 2 - код + новый пароль, 3 - успех
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Таймер повторной отправки
  const [resendCooldown, setResendCooldown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Анимации
  const [isArrowHovered, setIsArrowHovered] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const [isResendHovered, setIsResendHovered] = useState(false);

  // Валидация пароля
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpperCase && hasNumber;

  // Таймер обратного отсчёта
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Шаг 1: Отправить код на email
  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg(t('forgot.errNoEmail'));
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.detail === 'too_many_requests') {
          setErrorMsg(t('forgot.errTooMany'));
        } else {
          setErrorMsg(t('forgot.errServer'));
        }
      } else {
        // Переходим на шаг 2 и запускаем таймер
        setStep(2);
        setResendCooldown(60);
        setCanResend(false);
      }
    } catch {
      setErrorMsg(t('forgot.errServer'));
    } finally {
      setIsLoading(false);
    }
  };

  // Повторная отправка кода
  const handleResend = async () => {
    if (!canResend) return;
    setErrorMsg('');
    setCanResend(false);
    setResendCooldown(60);
    try {
      const response = await fetch('http://localhost:8000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.detail === 'too_many_requests') setErrorMsg(t('forgot.errTooMany'));
        else setErrorMsg(t('forgot.errServer'));
      }
    } catch {
      setErrorMsg(t('forgot.errServer'));
    }
  };

  // Шаг 2: Сброс пароля
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code || !newPassword) {
      setErrorMsg(t('forgot.errEmpty'));
      return;
    }
    if (!isPasswordValid) {
      setErrorMsg(t('forgot.errWeakPwd'));
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim(), new_password: newPassword })
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.detail === 'wrong_code') setErrorMsg(t('forgot.errWrongCode'));
        else if (data.detail === 'code_expired') setErrorMsg(t('forgot.errExpired'));
        else if (Array.isArray(data.detail)) {
          setErrorMsg(data.detail[0].msg.replace('Value error, ', ''));
        } else {
          setErrorMsg(t('forgot.errServer'));
        }
      } else {
        setStep(3);
      }
    } catch {
      setErrorMsg(t('forgot.errServer'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section style={styles.section}>

      {/* Стрелка назад */}
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
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      </Link>

      <div style={styles.container}>

        <div style={styles.logoHeader}>
          <img src={logo} alt="Subly Logo" style={styles.logo} />
        </div>

        <h2 style={styles.title}>{t('forgot.title')}</h2>

        {/* Сообщение об ошибке */}
        {errorMsg && (
          <div style={styles.errorBox}>{errorMsg}</div>
        )}

        {/* ШАГ 1: Ввод email */}
        {step === 1 && (
          <>
            <p style={styles.subtitle}>{t('forgot.subStep1')}</p>
            <form style={styles.form} onSubmit={handleRequestCode}>
              <div style={styles.inputContainer}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('forgot.phEmail')}
                  style={styles.input}
                  required
                />
              </div>

              <div
                style={{
                  ...styles.buttonContainer,
                  ...(isBtnHovered ? styles.buttonContainerHover : {}),
                  opacity: isLoading ? 0.7 : 1,
                }}
                onMouseEnter={() => setIsBtnHovered(true)}
                onMouseLeave={() => setIsBtnHovered(false)}
                onClick={handleRequestCode}
              >
                <button type="submit" style={styles.button} disabled={isLoading}>
                  {isLoading ? '...' : t('forgot.btnStep1')}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ШАГ 2: Ввод кода из email и нового пароля */}
        {step === 2 && (
          <>
            <p style={styles.subtitle}>{t('forgot.subStep2')}</p>

            <form style={styles.form} onSubmit={handleResetPassword}>

              {/* Поле кода */}
              <div style={styles.inputContainer}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('forgot.phCode')}
                  style={{ ...styles.input, textAlign: 'center', letterSpacing: '4px', fontSize: '20px' }}
                  required
                />
              </div>

              {/* Поле нового пароля */}
              <div style={styles.inputContainer}>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setShowRules(true)}
                  onBlur={() => setShowRules(false)}
                  placeholder={t('forgot.phNewPassword')}
                  style={styles.input}
                  required
                />
              </div>

              {/* Правила пароля */}
              {showRules && (
                <div style={styles.rulesContainer}>
                  <ul style={styles.rulesList}>
                    <li style={{ color: hasMinLength ? '#d4e8a0' : '#ffb3b3', transition: 'color 0.2s' }}>
                      {t('forgot.ruleLen')}
                    </li>
                    <li style={{ color: hasUpperCase ? '#d4e8a0' : '#ffb3b3', transition: 'color 0.2s' }}>
                      {t('forgot.ruleUpper')}
                    </li>
                    <li style={{ color: hasNumber ? '#d4e8a0' : '#ffb3b3', transition: 'color 0.2s' }}>
                      {t('forgot.ruleNum')}
                    </li>
                  </ul>
                </div>
              )}

              <div
                style={{
                  ...styles.buttonContainer,
                  ...(isBtnHovered ? styles.buttonContainerHover : {}),
                  opacity: isLoading ? 0.7 : 1,
                }}
                onMouseEnter={() => setIsBtnHovered(true)}
                onMouseLeave={() => setIsBtnHovered(false)}
                onClick={handleResetPassword}
              >
                <button type="submit" style={styles.button} disabled={isLoading}>
                  {isLoading ? '...' : t('forgot.btnStep2')}
                </button>
              </div>
            </form>

            {/* Повторная отправка */}
            <div style={styles.resendContainer}>
              {canResend ? (
                <span
                  style={{
                    ...styles.resendLink,
                    ...(isResendHovered ? styles.resendLinkHover : {}),
                  }}
                  onMouseEnter={() => setIsResendHovered(true)}
                  onMouseLeave={() => setIsResendHovered(false)}
                  onClick={handleResend}
                >
                  {t('forgot.resend')}
                </span>
              ) : (
                <span style={styles.resendCountdown}>
                  {t('forgot.resendIn').replace('{sec}', resendCooldown)}
                </span>
              )}
            </div>
          </>
        )}

        {/* ШАГ 3: Успех */}
        {step === 3 && (
          <div style={styles.successMessage}>
            <p style={{ marginBottom: '15px' }}>
              {t('forgot.subStep3')}
            </p>
            <Link
              to="/login"
              style={{ color: '#EFE3D7', fontWeight: 'bold', textDecoration: 'underline' }}
            >
              {t('forgot.backToLogin')}
            </Link>
          </div>
        )}

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
    position: 'relative',
  },
  backArrowContainer: {
    position: 'absolute',
    top: '40px',
    left: '40px',
    cursor: 'pointer',
    padding: '10px',
    zIndex: 10,
    display: 'flex',
    textDecoration: 'none',
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
  errorBox: {
    backgroundColor: 'rgba(216, 0, 12, 0.15)',
    border: '1px solid rgba(216, 0, 12, 0.5)',
    color: '#ffb3b3',
    padding: '12px 20px',
    borderRadius: '14px',
    marginBottom: '16px',
    width: '100%',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '14px',
    boxSizing: 'border-box',
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
    boxSizing: 'border-box',
  },
  rulesContainer: {
    width: '100%',
    padding: '4px 10px',
    marginTop: '-10px',
  },
  rulesList: {
    margin: 0,
    paddingLeft: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
    fontWeight: '500',
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
  resendContainer: {
    marginTop: '20px',
    textAlign: 'center',
  },
  resendLink: {
    color: '#EFE3D7',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
    transition: 'opacity 0.2s',
    opacity: 0.9,
  },
  resendLinkHover: {
    opacity: 1,
  },
  resendCountdown: {
    color: '#EFE3D7',
    fontSize: '14px',
    fontWeight: '500',
    opacity: 0.6,
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