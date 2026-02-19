import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 

function Services() {
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const navigate = useNavigate(); 

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        
        {/* Заголовок страницы */}
        <div style={styles.headerContainer}>
          <h1 style={styles.title}>Naše služby</h1>
          <p style={styles.subtitle}>
            Podívejte se, jak vám Subly může ušetřit čas a peníze. 
            Vše pro vaši finanční pohodu na jednom místě.
          </p>
        </div>

        {/* Карточки услуг */}
        <div style={styles.cardsContainer}>
          
          <div style={styles.card}>
            <div style={styles.iconWrapper}>💳</div>
            <h3 style={styles.cardTitle}>Správa předplatných</h3>
            <p style={styles.cardText}>
              Mějte všechny své Netflixy, Spotify a další platby pod kontrolou. 
              Upozorníme vás před každým stržením peněz.
            </p>
          </div>

          <div style={styles.card}>
            <div style={styles.iconWrapper}>📊</div>
            <h3 style={styles.cardTitle}>Chytrá analytika</h3>
            <p style={styles.cardText}>
              Přehledné grafy vám ukážou, kam mizí vaše peníze. 
              Zjistěte, za jaké kategorie utrácíte nejvíce.
            </p>
          </div>

          <div style={styles.card}>
            <div style={styles.iconWrapper}>✂️</div>
            <h3 style={styles.cardTitle}>Zrušení jedním klikem</h3>
            <p style={styles.cardText}>
              Platíte za něco, co už nepoužíváte? Zbavte se nechtěných 
              předplatných snadno a rychle přímo z naší aplikace.
            </p>
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
            Začít šetřit
          </button>
        </div>

      </div>
    </section>
  );
}

// --- СТИЛИ ---
const colors = {
  bgBeige: '#F2EBE3',
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

  cardsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '40px',
    width: '100%',
    justifyContent: 'center',
    marginBottom: '70px',
    flexWrap: 'wrap', 
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: '40px',
    padding: '40px 30px',
    flex: '1',
    minWidth: '300px',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    transition: 'transform 0.3s ease',
  },
  iconWrapper: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: colors.deepRed,
    marginBottom: '15px',
  },
  cardText: {
    fontSize: '18px',
    fontWeight: '500',
    color: colors.darkText,
    lineHeight: '1.5',
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