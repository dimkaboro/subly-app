import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useLanguage } from '../context/LanguageContext';

function Services() {
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const navigate = useNavigate(); 
  const { t } = useLanguage();

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        
        {/* Заголовок страницы */}
        <div style={styles.headerContainer}>
          <h1 style={styles.title}>{t('services.title')}</h1>
          <p style={styles.subtitle}>
            {t('services.subtitle')}
          </p>
        </div>

        {/* Карточки услуг -> Horizontal Feature Blocks */}
        <div style={styles.servicesContainer}>
          
          <div style={styles.serviceBlock}>
            <div style={styles.serviceWatermark}>01</div>
            <div style={styles.serviceIcon}>💳</div>
            <div style={styles.serviceContent}>
              <h3 style={styles.serviceTitle}>{t('services.s1Title')}</h3>
              <p style={styles.serviceText}>
                {t('services.s1Text')}
              </p>
            </div>
          </div>

          <div style={styles.serviceBlock}>
            <div style={styles.serviceWatermark}>02</div>
            <div style={styles.serviceIcon}>📊</div>
            <div style={styles.serviceContent}>
              <h3 style={styles.serviceTitle}>{t('services.s2Title')}</h3>
              <p style={styles.serviceText}>
                {t('services.s2Text')}
              </p>
            </div>
          </div>

          <div style={styles.serviceBlock}>
            <div style={styles.serviceWatermark}>03</div>
            <div style={styles.serviceIcon}>📥</div>
            <div style={styles.serviceContent}>
              <h3 style={styles.serviceTitle}>{t('services.s3Title')}</h3>
              <p style={styles.serviceText}>
                {t('services.s3Text')}
              </p>
            </div>
          </div>

        </div>

        {/* Кнопка */}
        <div 
          style={{
            ...styles.actionButtonContainer,
            ...(isBtnHovered ? styles.actionButtonContainerHover : {})
          }}
          onMouseEnter={() => setIsBtnHovered(true)}
          onMouseLeave={() => setIsBtnHovered(false)}
          onClick={() => navigate('/register')} 
        >
          <button style={styles.actionButton}>
            {t('services.ctaBtn')}
          </button>
        </div>

      </div>
    </section>
  );
}

// --- СТИЛИ ---
const colors = {
  bgBeige: '#FFEDAB',
  deepRed: '#680E0E', 
  oliveGreen: '#526F1F',
  darkText: '#3F4E1D', 
  white: '#FFFFFF',
};

const styles = {
  section: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: colors.bgBeige,
    fontFamily: 'Montserrat, sans-serif',
    overflow: 'hidden',
    padding: '40px 0',
  },
  
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '1400px', 
    padding: '0 50px',
    alignItems: 'center',
  },

  headerContainer: {
    textAlign: 'center',
    maxWidth: '800px',
    marginBottom: '60px',
  },
  title: {
    fontSize: '56px',
    fontWeight: '900',
    color: colors.deepRed,
    marginBottom: '20px',
    letterSpacing: '-1px',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: '22px',
    fontWeight: '500',
    color: colors.darkText,
    lineHeight: '1.6',
  },

  servicesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
    width: '100%',
    maxWidth: '1000px',
    marginBottom: '80px',
  },
  serviceBlock: {
    position: 'relative',
    backgroundColor: colors.white,
    borderRadius: '40px',
    padding: '40px 50px',
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  serviceWatermark: {
    position: 'absolute',
    right: '30px',
    bottom: '-30px',
    fontSize: '200px',
    fontWeight: '900',
    color: 'rgba(104, 14, 14, 0.04)', // faint deepRed
    lineHeight: '1',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  serviceIcon: {
    fontSize: '64px',
    flexShrink: 0,
    backgroundColor: 'rgba(255, 237, 171, 0.5)', // bgBeige slightly transparent
    width: '120px',
    height: '120px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '30px',
    zIndex: 1,
  },
  serviceContent: {
    flex: 1,
    zIndex: 1,
  },
  serviceTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: colors.deepRed,
    marginBottom: '15px',
  },
  serviceText: {
    fontSize: '19px',
    fontWeight: '500',
    color: colors.darkText,
    lineHeight: '1.6',
    maxWidth: '600px',
  },

  actionButtonContainer: {
    backgroundColor: colors.oliveGreen,
    borderRadius: '50px',
    padding: '20px 80px',
    boxShadow: '0 8px 20px rgba(82, 111, 31, 0.3)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  actionButtonContainerHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 12px 25px rgba(82, 111, 31, 0.4)',
  },
  actionButton: {
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.white,
    fontSize: '22px',
    fontWeight: '700',
    cursor: 'pointer',
    pointerEvents: 'none', 
    fontFamily: 'inherit',
  },
};

export default Services;