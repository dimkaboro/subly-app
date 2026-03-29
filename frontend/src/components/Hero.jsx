import React from 'react';
import manImage from '../assets/man.png';
import starTopLeft from '../assets/star-top-left.svg';
import starTopRight from '../assets/star-top-right.svg';
import starBottomLeft from '../assets/star-bottom-left.svg';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaInstagram, FaFacebookF } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

function Hero() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section style={styles.section}>
      
      {/* Общий контейнер */}
      <div style={styles.contentWrapper}>
        
        {/* ЛЕВАЯ КОЛОНКА: Фото + Звезды */}
        <div style={styles.imageContainer}>
          <img src={manImage} alt="Man" style={styles.image} />
          
          {/* 👇 ЗВЕЗДЫ */}
          <img 
            src={starTopLeft} 
            style={{...styles.star, ...styles.starTopLeft}} 
            alt="star" 
          />
          <img 
            src={starTopRight} 
            style={{...styles.star, ...styles.starTopRight}} 
            alt="star" 
          />
          <img 
            src={starBottomLeft} 
            style={{...styles.star, ...styles.starBottomLeft}} 
            alt="star" 
          />
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div style={styles.rightContent}>
          
          <h1 style={styles.mainText}>
            {t('hero.line1')} <br />
            {t('hero.line2')} <br />
            {t('hero.line3')} <br />
            <span style={styles.highlight}>{t('hero.line4Highlight')}</span> <br />
            {t('hero.line5')}
          </h1>


          <button 
            style={styles.button} 
            onClick={() => navigate('/register')}
          >
            {t('hero.registerBtn')}
          </button>

          <p style={styles.loginText}>
            {t('hero.haveAccount')}{' '}
            <Link to="/login" style={styles.linkBold}>
              {t('hero.loginLink')}
            </Link>
          </p>

          <div style={styles.footer}>
            <a href="mailto:subly.cz@gmail.com" style={styles.contactItem}>
              <FaEnvelope size={20} />
              <span>subly.cz@gmail.com</span>
            </a>
            <a href="#" style={styles.contactItem}>
              <FaInstagram size={20} />
              <span>@subly.cz</span>
            </a>
            <a href="#" style={styles.contactItem}>
              <FaFacebookF size={20} />
              <span>@subly.cz</span>
            </a>
          </div>
        </div>
      </div>

    </section>
  );
}

const styles = {
    // Стиль для ссылки
    linkBold: {
        fontWeight: '700',
        color: '#333',
        textDecoration: 'none',
        cursor: 'pointer', 
    },

    section: {
        display: 'flex',
        height: 'calc(100vh - 100px)',
        fontFamily: 'Montserrat, sans-serif',
        overflow: 'hidden',
        backgroundColor: '#FFEDAB',
    },
    contentWrapper: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
    },
    
    // --- ЛЕВАЯ ЧАСТЬ (ФОТО) ---
    imageContainer: {
        flex: 1, 
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        height: '100%',
        position: 'relative', 
    },
    image: {
        height: '100%', 
        width: 'auto',
        objectFit: 'cover',
        objectPosition: 'bottom left', 
    },

    // --- СТИЛИ ДЛЯ ЗВЕЗД ---
    star: {
        position: 'absolute', 
        zIndex: 10,           
    },
    starTopLeft: {
        width: '40px',
        top: '20%',
        left: '20%',
        transform: 'rotate(-15deg)',
    },
    starTopRight: {
        width: '50px',
        top: '15%',
        left: '50%',
        transform: 'rotate(10deg)',
    },
    starBottomLeft: {
        width: '45px',
        top: '40%',
        left: '10%',
        transform: 'rotate(-5deg)',
    },

    // --- ПРАВАЯ ЧАСТЬ (КОНТЕНТ) ---
    rightContent: {
        flex: 1.1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',     
        textAlign: 'center',
        padding: '0 80px 0 0',    
        position: 'relative',
    },
    
    mainText: {
        fontSize: '46px',
        fontWeight: '700',
        color: 'black',
        lineHeight: '1.25',
        marginBottom: '40px',
        width: '100%',
        maxWidth: '700px',
    },
    
    highlight: {
        color: 'var(--color-olive)',
    },

    button: {
        backgroundColor: 'var(--color-cherry)',
        color: 'white',
        border: 'none',
        padding: '22px 80px',     
        fontSize: '24px',
        fontWeight: '700',
        borderRadius: '50px',
        cursor: 'pointer',
        marginBottom: '20px',
        boxShadow: '0 5px 20px rgba(117, 7, 12, 0.25)',
    },
    loginText: {
        fontSize: '16px',
        color: '#333',
    },

    footer: {
        position: 'absolute',
        bottom: '40px',
        left: '0',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        gap: '50px',
        color: 'var(--color-olive)',
        paddingRight: '80px',    
    },
    contactItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        textDecoration: 'none',
        color: 'inherit',
        fontSize: '18px',
        fontWeight: '600',
        cursor: 'pointer',
    }
};

export default Hero;