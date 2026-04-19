import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher';
import styles from './dashboardStyles';

function Sidebar({ activeTab, onTabChange, onLogout, username }) {
  const { t } = useLanguage();
  const [hoveredNav, setHoveredNav] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('dashboard.greetingMorning');
    if (hour >= 12 && hour < 18) return t('dashboard.greetingDay');
    return t('dashboard.greetingEvening');
  };

  const navItems = [
    { id: 'prehled',   icon: '📊', label: t('dashboard.navPrehled') },
    { id: 'grafy',     icon: '📈', label: t('dashboard.navGrafy') },
    { id: 'nastaveni', icon: '⚙️', label: t('dashboard.navNastaveni') },
    { id: 'export',    icon: '📥', label: t('dashboard.navExport') },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoArea}>
        <h1 style={{ color: '#EFE3D7', fontSize: '34px', fontWeight: '800', margin: '0 0 25px 0' }}>Subly</h1>
        <div style={styles.separator} />
        <div style={styles.greetingBox}>
          <div style={styles.greetingTime}>{getGreeting()}</div>
          <div style={styles.greetingName}>{username}</div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <LanguageSwitcher color="#EFE3D7" />
        </div>
      </div>

      <nav style={styles.nav}>
        {navItems.map((item, index) => {
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              style={{
                ...(isActive ? styles.navItemActive : styles.navItem),
                ...(!isActive && hoveredNav === index ? styles.navItemHover : {})
              }}
              onMouseEnter={() => setHoveredNav(index)}
              onMouseLeave={() => setHoveredNav(null)}
              onClick={() => onTabChange(item.id)}
            >
              <span style={{ marginRight: '10px' }}>{item.icon}</span>
              {item.label}
            </div>
          );
        })}
      </nav>

      <div style={styles.logoutBtn} onClick={onLogout}>
        {t('dashboard.logout')}
      </div>
    </aside>
  );
}

export default Sidebar;
