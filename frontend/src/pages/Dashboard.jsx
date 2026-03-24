import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function Dashboard() {
  const navigate = useNavigate();

  // Состояния для меню
  const [hoveredNav, setHoveredNav] = useState(null);
  const [activeTab, setActiveTab] = useState('prehled'); // Текущая активная вкладка
  
  // Тестовые данные подписок
  const [subscriptions, setSubscriptions] = useState([
    { id: 1, name: 'Netflix', price: 300, currency: 'CZK', cycle: 'Měsíčně', nextPayment: '2023-11-15' },
    { id: 2, name: 'Spotify', price: 169, currency: 'CZK', cycle: 'Měsíčně', nextPayment: '2023-11-18' },
    { id: 3, name: 'iCloud+', price: 25, currency: 'CZK', cycle: 'Měsíčně', nextPayment: '2023-11-20' },
  ]);

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.price, 0);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  // Элементы бокового меню
  const navItems = [
    { id: 'prehled', icon: '📊', label: 'Přehled' },
    { id: 'grafy', icon: '📈', label: 'Grafy' }, // Переименовали в Grafy
    { id: 'nastaveni', icon: '⚙️', label: 'Nastavení' },
    { id: 'export', icon: '📥', label: 'Export do CSV' }
  ];

  return (
    <div style={styles.container}>
      
      {/* ЛЕВАЯ ПАНЕЛЬ (SIDEBAR) */}
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <h1 style={{ color: '#EFE3D7', fontSize: '32px', fontWeight: '800' }}>Subly</h1>
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
                onClick={() => setActiveTab(item.id)} // Переключаем вкладку по клику
              >
                <span style={{ marginRight: '10px' }}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </nav>

        <div style={styles.logoutBtn} onClick={handleLogout}>
          Odhlásit se
        </div>
      </aside>

      {/* ОСНОВНАЯ ЗОНА */}
      <main style={styles.mainContent}>
        
        {/* Вкладка: Přehled (Главная) */}
        {activeTab === 'prehled' && (
          <>
            <header style={styles.header}>
              <h2 style={styles.pageTitle}>Můj přehled</h2>
              <button style={styles.addButton}>+ Přidat předplatné</button>
            </header>

            {/* Сводка (Summary Cards) */}
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>Celkové měsíční výdaje</p>
                <h3 style={styles.summaryValue}>{totalMonthly} CZK</h3>
              </div>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>Nejbližší platba</p>
                <h3 style={styles.summaryValueHighlight}>Netflix (15. 11.)</h3>
              </div>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>Aktivní předplatné</p>
                <h3 style={styles.summaryValue}>{subscriptions.length}</h3>
              </div>
            </div>

            {/* Список подписок (Вернули на всю ширину) */}
            <div style={styles.listSection}>
              <h3 style={styles.sectionTitle}>Aktivní služby</h3>
              <div style={styles.subsList}>
                {subscriptions.map((sub) => (
                  <div key={sub.id} style={styles.subCard}>
                    <div style={styles.subInfo}>
                      <h4 style={styles.subName}>{sub.name}</h4>
                      <p style={styles.subDetails}>{sub.cycle} • Další platba: {sub.nextPayment}</p>
                    </div>
                    <div style={styles.subPriceAction}>
                      <span style={styles.price}>{sub.price} {sub.currency}</span>
                      <div style={styles.actions}>
                        <button style={styles.actionBtn}>✏️</button>
                        <button style={styles.actionBtn}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Вкладка: Grafy */}
        {activeTab === 'grafy' && (
          <>
            <header style={styles.header}>
              <h2 style={styles.pageTitle}>Grafy výdajů</h2>
            </header>
            
            <div style={styles.chartSectionFull}>
              <h3 style={styles.sectionTitle}>Rozložení výdajů podle služeb</h3>
              <div style={styles.chartContainerFull}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subscriptions} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#A68E7A', fontSize: 14}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#A68E7A', fontSize: 14}} />
                    <Tooltip 
                      cursor={{fill: 'rgba(239, 227, 215, 0.4)'}} 
                      contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="price" radius={[10, 10, 0, 0]}>
                      {subscriptions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#7A2F2F" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Заглушки для остальных вкладок */}
        {activeTab === 'nastaveni' && (
          <header style={styles.header}>
            <h2 style={styles.pageTitle}>Nastavení</h2>
          </header>
        )}
        
        {activeTab === 'export' && (
          <header style={styles.header}>
            <h2 style={styles.pageTitle}>Export dat</h2>
          </header>
        )}

      </main>
    </div>
  );
}

// СТИЛИ (Оставили все предыдущие, добавили пару для широкого графика)
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#EFE3D7',
    fontFamily: 'Montserrat, sans-serif',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#5A6E26',
    display: 'flex',
    flexDirection: 'column',
    padding: '30px 20px',
    boxShadow: '4px 0 15px rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  logoArea: {
    marginBottom: '40px',
    textAlign: 'center',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexGrow: 1,
  },
  navItem: {
    color: '#EFE3D7',
    fontSize: '16px',
    fontWeight: '600',
    padding: '15px 20px',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    opacity: 0.8,
  },
  navItemHover: {
    opacity: 1,
    backgroundColor: 'rgba(239, 227, 215, 0.1)',
    transform: 'translateX(5px)',
  },
  navItemActive: {
    color: '#7A2F2F',
    backgroundColor: '#EFE3D7',
    fontSize: '16px',
    fontWeight: '700',
    padding: '15px 20px',
    borderRadius: '15px',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  logoutBtn: {
    color: '#EFE3D7',
    textAlign: 'center',
    padding: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    borderTop: '1px solid rgba(239, 227, 215, 0.2)',
    marginTop: 'auto',
    transition: 'opacity 0.2s',
  },
  mainContent: {
    flexGrow: 1,
    padding: '40px 50px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
  },
  pageTitle: {
    color: '#7A2F2F',
    fontSize: '32px',
    fontWeight: '800',
    margin: 0,
  },
  addButton: {
    backgroundColor: '#7A2F2F',
    color: '#EFE3D7',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(122, 47, 47, 0.3)',
    transition: 'transform 0.2s, background-color 0.2s',
  },
  summaryGrid: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: '25px',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
  },
  summaryLabel: {
    color: '#A68E7A',
    fontSize: '13px',
    fontWeight: '700',
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  summaryValue: {
    color: '#5A6E26',
    fontSize: '32px',
    fontWeight: '800',
    margin: 0,
  },
  summaryValueHighlight: {
    color: '#7A2F2F',
    fontSize: '26px',
    fontWeight: '800',
    margin: 0,
  },
  // Блок для списка на всю ширину
  listSection: {
    backgroundColor: '#FFFFFF',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
  },
  sectionTitle: {
    color: '#7A2F2F',
    fontSize: '20px',
    fontWeight: '800',
    margin: '0 0 20px 0',
  },
  subsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  subCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#F9F6F0',
    border: '1px solid rgba(166, 142, 122, 0.2)',
    borderRadius: '15px',
    transition: 'transform 0.2s',
  },
  subInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  subName: {
    color: '#5A6E26',
    fontSize: '18px',
    fontWeight: '800',
    margin: 0,
  },
  subDetails: {
    color: '#A68E7A',
    fontSize: '14px',
    fontWeight: '500',
    margin: 0,
  },
  subPriceAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  price: {
    color: '#7A2F2F',
    fontSize: '20px',
    fontWeight: '800',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    opacity: 0.6,
    transition: 'opacity 0.2s',
  },
  // Блоки для страницы с графиками
  chartSectionFull: {
    backgroundColor: '#FFFFFF',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
  },
  chartContainerFull: {
    height: '400px', // Делаем график больше, раз он на отдельной вкладке
    width: '100%',
    marginTop: '20px',
  }
};

export default Dashboard;