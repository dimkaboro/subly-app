import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { useLanguage } from '../context/LanguageContext';

function VerifyEmail() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';

  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Resend timer (60 seconds)
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [isArrowHovered, setIsArrowHovered] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const [isResendHovered, setIsResendHovered] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setErrorMsg(t('verify.errWrongCode'));
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailFromUrl, code: code.trim() })
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.detail === 'wrong_code') setErrorMsg(t('verify.errWrongCode'));
        else if (data.detail === 'code_expired') setErrorMsg(t('verify.errExpired'));
        else setErrorMsg(t('verify.errServer'));
      } else {
        setSuccessMsg(t('verify.success'));
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch {
      setErrorMsg(t('verify.errServer'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setErrorMsg('');
    setCanResend(false);
    setResendCooldown(60);
    try {
      const response = await fetch('http://localhost:8000/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailFromUrl })
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.detail === 'too_many_requests') setErrorMsg(t('verify.errTooMany'));
        else setErrorMsg(t('verify.errServer'));
      }
    } catch {
      setErrorMsg(t('verify.errServer'));
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

        {/* Логотип */}
        <div style={styles.logoHeader}>
          <img src={logo} alt="Subly Logo" style={styles.logo} />
        </div>

        {/* Иконка конверта */}
        <div style={styles.iconWrapper}>
          <svg viewBox="0 0 24 24" style={styles.emailIcon} fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        <h2 style={styles.title}>{t('verify.title')}</h2>
        <p style={styles.subtitle}>{t('verify.subtitle')}</p>

        {emailFromUrl && (
          <p style={styles.emailDisplay}>{emailFromUrl}</p>
        )}

        {/* Сообщения */}
        {errorMsg && (
          <div style={styles.errorBox}>{errorMsg}</div>
        )}
        {successMsg && (
          <div style={styles.successBox}>{successMsg}</div>
        )}

        {!successMsg && (
          <>
            {/* Поле для кода */}
            <form style={styles.form} onSubmit={handleVerify}>
              <div style={styles.inputContainer}>
                <input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('verify.phCode')}
                  style={styles.input}
                  autoFocus
                  required
                />
              </div>

              {/* Кнопка подтвердить */}
              <div
                style={{
                  ...styles.buttonContainer,
                  ...(isBtnHovered ? styles.buttonContainerHover : {}),
                  opacity: isLoading ? 0.7 : 1,
                }}
                onMouseEnter={() => setIsBtnHovered(true)}
                onMouseLeave={() => setIsBtnHovered(false)}
                onClick={handleVerify}
              >
                <button type="submit" style={styles.button} disabled={isLoading}>
                  {isLoading ? '...' : t('verify.btnVerify')}
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
                  {t('verify.resend')}
                </span>
              ) : (
                <span style={styles.resendCountdown}>
                  {t('verify.resendIn').replace('{sec}', resendCooldown)}
                </span>
              )}
            </div>
          </>
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
    maxWidth: '440px',
    padding: '20px',
  },
  logoHeader: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'center',
  },
  logo: {
    height: '55px',
    width: 'auto',
  },
  iconWrapper: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: 'rgba(239, 227, 215, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    border: '1.5px solid rgba(239, 227, 215, 0.4)',
  },
  emailIcon: {
    width: '36px',
    height: '36px',
    color: '#EFE3D7',
  },
  title: {
    color: 'white',
    fontSize: '26px',
    fontWeight: '700',
    marginBottom: '10px',
    textAlign: 'center',
  },
  subtitle: {
    color: '#EFE3D7',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '8px',
    opacity: 0.9,
    lineHeight: '1.5',
  },
  emailDisplay: {
    color: '#EFE3D7',
    fontSize: '15px',
    fontWeight: '700',
    marginBottom: '28px',
    opacity: 1,
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
  successBox: {
    backgroundColor: 'rgba(82, 111, 31, 0.3)',
    border: '1px solid rgba(82, 111, 31, 0.6)',
    color: '#d4e8a0',
    padding: '20px 20px',
    borderRadius: '14px',
    marginBottom: '16px',
    width: '100%',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
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
    fontSize: '22px',
    fontWeight: '700',
    color: '#7A2F2F',
    fontFamily: 'inherit',
    textAlign: 'center',
    letterSpacing: '6px',
    boxSizing: 'border-box',
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
    marginTop: '4px',
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
    marginTop: '22px',
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
};

export default VerifyEmail;
