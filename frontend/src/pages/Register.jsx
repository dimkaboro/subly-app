import React, { useState } from 'react';
import characterVector from '../assets/registration-character.svg'; 
import speechBubbleVector from '../assets/speech-bubble.svg';

function Register() {
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        
        {/* --- ЛЕВАЯ КОЛОНКА --- */}
        <div style={styles.leftColumn}>
          <div style={styles.speechBubbleContainer}>
            <img src={speechBubbleVector} alt="Speech bubble" style={styles.speechBubbleImage} />
            <p style={styles.speechBubbleText}>
              Pomůžu ti udělat pořádek ve tvých předplatných. Jdeme na to?
            </p>
          </div>
          <img src={characterVector} alt="Character" style={styles.characterImage} />
        </div>

        {/* --- ПРАВАЯ КОЛОНКА --- */}
        <div style={styles.rightColumn}>
          
          {/* 🔥 ЗАГОЛОВОК ВМЕСТО ЛОГОТИПА */}
          <h1 style={styles.title}>Registrace</h1>

          <form style={styles.form}>
            <div style={styles.inputContainer}>
              <input type="text" placeholder="Přezdívka" style={styles.input} />
            </div>
            
            <div style={styles.inputContainer}>
              <input type="email" placeholder="E-mail" style={styles.input} />
            </div>

            <div style={styles.inputContainer}>
              <input type="password" placeholder="Heslo" style={styles.input} />
            </div>

            <div style={styles.inputContainer}>
              <input type="password" placeholder="Zopakujte heslo" style={styles.input} />
            </div>
          </form>

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

// --- СТИЛИ ---
const colors = {
  bgBeige: '#F2EBE3',
  deepRed: '#680E0E', 
  oliveGreen: '#526F1F',
  bubbleText: '#3F4E1D',
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
  },
  
  container: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    maxWidth: '1700px', 
    padding: '0 50px',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100vh', 
    position: 'relative',
  },

  leftColumn: {
    flex: 1.5, 
    height: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end', 
  },
  
  speechBubbleContainer: {
    position: 'absolute',
    top: '5%',
    right: '-5%',
    width: '450px', 
    height: '300px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    transform: 'rotate(2deg)', 
  },
  speechBubbleImage: {
    position: 'absolute',
    width: '100%',
    height: 'auto',
    top: 0,
    left: 0,
  },
  speechBubbleText: {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    color: colors.bubbleText,
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: '1.3',
    padding: '0 60px 40px 60px',
  },

  characterImage: {
    width: '550px',
    height: 'auto',
    marginBottom: '-10px', 
    marginLeft: '50px',
  },

  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center',
    paddingRight: '100px', 
  },
  
  // 🔥 СТИЛЬ ЗАГОЛОВКА
  title: {
    fontSize: '40px',            // Крупный, уверенный шрифт
    fontWeight: '900',
    color: colors.deepRed,       // Тот же бордовый, что и у полей
    marginBottom: '35px',
    letterSpacing: '-1px',
    textTransform: 'uppercase',  // Можно убрать, если хочешь строчными
  },
  
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
    width: '100%',
    maxWidth: '550px', 
    marginBottom: '50px',
  },
  
  inputContainer: {
    backgroundColor: colors.deepRed, 
    borderRadius: '50px', 
    padding: '22px 40px', 
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
  },
  input: {
    width: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '22px', 
    fontWeight: '500',
    color: colors.white,
    fontFamily: 'inherit',
    '::placeholder': {
      color: '#E0E0E0', 
      opacity: 0.9,
    },
  },

  nextButtonContainer: {
    backgroundColor: colors.oliveGreen,
    borderRadius: '50px',
    padding: '20px 100px', 
    boxShadow: '0 8px 20px rgba(82, 111, 31, 0.3)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  nextButtonContainerHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 12px 25px rgba(82, 111, 31, 0.4)',
  },
  nextButton: {
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.white,
    fontSize: '24px',
    fontWeight: '700',
    cursor: 'pointer',
    pointerEvents: 'none',
    fontFamily: 'inherit',
  },
};

export default Register;