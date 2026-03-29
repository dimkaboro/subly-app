import React from 'react';
import { useLanguage } from '../context/LanguageContext';

function LanguageSwitcher({ color = '#FFFFFF' }) {
  const { language, setLanguage } = useLanguage();

  const langs = [
    { code: 'cs', label: 'CS' },
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
    { code: 'ukr', label: 'UKR' }
  ];

  return (
    <div style={{ ...styles.container, color }}>
      {langs.map((lang, index) => (
        <React.Fragment key={lang.code}>
          <span
            style={{
              ...styles.langItem,
              fontWeight: language === lang.code ? '800' : '400',
              opacity: language === lang.code ? 1 : 0.6,
            }}
            onClick={() => setLanguage(lang.code)}
          >
            {lang.label}
          </span>
          {index < langs.length - 1 && <span style={styles.separator}>|</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontFamily: 'Montserrat, sans-serif',
  },
  langItem: {
    cursor: 'pointer',
    transition: 'opacity 0.2s, font-weight 0.2s',
  },
  separator: {
    opacity: 0.4,
  }
};

export default LanguageSwitcher;
