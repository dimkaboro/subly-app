import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher'; // Добавили LanguageSwitcher

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Состояния для меню
  const [hoveredNav, setHoveredNav] = useState(null);
  const [activeTab, setActiveTab] = useState('prehled');
  
  // Данные подписок с бэкенда
  const [subscriptions, setSubscriptions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', price: '', currency: 'CZK', cycle: 'Měsíčně', nextPayment: '' });
  
  // Состояния для редактирования подписки
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSub, setEditSub] = useState(null);

  // Hover states для модального окна
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);
  const [isCancelHovered, setIsCancelHovered] = useState(false);
  const [isEditSubmitHovered, setIsEditSubmitHovered] = useState(false);
  const [isEditCancelHovered, setIsEditCancelHovered] = useState(false);

  // Состояния для настроек
  const [profile, setProfile] = useState(null);
  const [settingsMsg, setSettingsMsg] = useState(null); // { type: 'success'|'error', text: '' }
  const [emailForm, setEmailForm] = useState({ new_email: '', password: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirmPassword: '' });
  const [telegramId, setTelegramId] = useState('');
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  // ДИНАМИЧЕСКИЕ ПРАВИЛА ПАРОЛЯ ДЛЯ НАСТРОЕК
  const hasMinLength = passwordForm.new_password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(passwordForm.new_password);
  const hasNumber = /\d/.test(passwordForm.new_password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasNumber;

  // Обработка 401 ошибок — автоматический редирект на логин
  const handle401 = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const response = await fetch('http://localhost:8000/api/subscriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) { handle401(); return; }
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  // Загрузка профиля для настроек
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const response = await fetch('http://localhost:8000/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) { handle401(); return; }
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Подгружаем профиль при переключении на настройки
  useEffect(() => {
    if (activeTab === 'nastaveni') {
      fetchProfile();
    }
  }, [activeTab]);

  // Auto-hide toast
  useEffect(() => {
    if (settingsMsg) {
      const timer = setTimeout(() => setSettingsMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [settingsMsg]);

  // Обработчики настроек
  const handleChangeEmail = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const response = await fetch('http://localhost:8000/api/me/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(emailForm)
      });
      if (response.status === 401) { handle401(); return; }
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        setProfile(prev => ({ ...prev, email: data.email }));
        setEmailForm({ new_email: '', password: '' });
        setSettingsMsg({ type: 'success', text: t('dashboard.msgEmailSuccess') });
      } else {
        setSettingsMsg({ type: 'error', text: data.detail || 'Error' });
      }
    } catch (error) {
      setSettingsMsg({ type: 'error', text: t('dashboard.msgServerErr') });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setSettingsMsg({ type: 'error', text: t('dashboard.msgWeakPwd') });
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirmPassword) {
      setSettingsMsg({ type: 'error', text: t('dashboard.msgPwdMismatch') });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const response = await fetch('http://localhost:8000/api/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ current_password: passwordForm.current_password, new_password: passwordForm.new_password })
      });
      if (response.status === 401) { handle401(); return; }
      const data = await response.json();
      if (response.ok) {
        setPasswordForm({ current_password: '', new_password: '', confirmPassword: '' });
        setSettingsMsg({ type: 'success', text: t('dashboard.msgPwdSuccess') });
      } else {
        setSettingsMsg({ type: 'error', text: data.detail || 'Error' });
      }
    } catch (error) {
      setSettingsMsg({ type: 'error', text: t('dashboard.msgServerErr') });
    }
  };

  const handleLinkTelegram = async (e) => {
    e.preventDefault();
    if (!telegramId.trim()) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const response = await fetch('http://localhost:8000/api/me/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ telegram_chat_id: telegramId.trim() })
      });
      if (response.status === 401) { handle401(); return; }
      const data = await response.json();
      if (response.ok) {
        setProfile(prev => ({ ...prev, telegram_chat_id: data.telegram_chat_id }));
        setTelegramId('');
        setSettingsMsg({ type: 'success', text: t('dashboard.msgTgSuccess') });
      } else {
        setSettingsMsg({ type: 'error', text: data.detail || 'Error' });
      }
    } catch (error) {
      setSettingsMsg({ type: 'error', text: t('dashboard.msgServerErr') });
    }
  };

  const handleUnlinkTelegram = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const response = await fetch('http://localhost:8000/api/me/telegram', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) { handle401(); return; }
      if (response.ok) {
        setProfile(prev => ({ ...prev, telegram_chat_id: null }));
        setSettingsMsg({ type: 'success', text: t('dashboard.msgTgUnlink') });
      }
    } catch (error) {
      setSettingsMsg({ type: 'error', text: t('dashboard.msgServerErr') });
    }
  };

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.price, 0);

  // Вычисляем ближайшую платёжку
  const getNextPaymentInfo = () => {
    if (subscriptions.length === 0) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let closest = null;
    let closestDate = null;
    
    for (const sub of subscriptions) {
      if (!sub.nextPayment) continue;
      const date = new Date(sub.nextPayment);
      if (isNaN(date.getTime())) continue;
      
      if (!closestDate || date < closestDate) {
        closestDate = date;
        closest = sub;
      }
    }
    
    if (!closest || !closestDate) return null;
    
    const day = closestDate.getDate();
    const month = closestDate.getMonth() + 1;
    return { name: closest.name, formatted: `${day}. ${month}.` };
  };

  const nextPaymentInfo = getNextPaymentInfo();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const response = await fetch('http://localhost:8000/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newSub,
          price: Number(newSub.price)
        })
      });
      if (response.status === 401) { handle401(); return; }
      if (response.ok) {
        const createdSub = await response.json();
        setSubscriptions([...subscriptions, createdSub]);
        setShowAddModal(false);
        setNewSub({ name: '', price: '', currency: 'CZK', cycle: 'Měsíčně', nextPayment: '' });
      }
    } catch (error) {
      console.error('Add error:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const response = await fetch(`http://localhost:8000/api/subscriptions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 401) { handle401(); return; }
      if (response.ok) {
        setSubscriptions(subscriptions.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Открыть модалку редактирования
  const openEditModal = (sub) => {
    setEditSub({ ...sub, price: String(sub.price) });
    setShowEditModal(true);
  };

  // Сохранить изменения подписки
  const handleEditSubscription = async (e) => {
    e.preventDefault();
    if (!editSub) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const response = await fetch(`http://localhost:8000/api/subscriptions/${editSub.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editSub.name,
          price: Number(editSub.price),
          currency: editSub.currency,
          cycle: editSub.cycle,
          nextPayment: editSub.nextPayment
        })
      });
      if (response.status === 401) { handle401(); return; }
      if (response.ok) {
        const updated = await response.json();
        setSubscriptions(subscriptions.map(s => s.id === updated.id ? updated : s));
        setShowEditModal(false);
        setEditSub(null);
      }
    } catch (error) {
      console.error('Edit error:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('dashboard.greetingMorning');
    if (hour >= 12 && hour < 18) return t('dashboard.greetingDay');
    return t('dashboard.greetingEvening');
  };
  const currentUsername = profile?.username || localStorage.getItem('username') || '';

  // Элементы бокового меню
  const navItems = [
    { id: 'prehled', icon: '📊', label: t('dashboard.navPrehled') },
    { id: 'grafy', icon: '📈', label: t('dashboard.navGrafy') },
    { id: 'nastaveni', icon: '⚙️', label: t('dashboard.navNastaveni') },
    { id: 'export', icon: '📥', label: t('dashboard.navExport') }
  ];

  return (
    <div style={styles.container}>
      
      {/* ЛЕВАЯ ПАНЕЛЬ (SIDEBAR) */}
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <h1 style={{ color: '#EFE3D7', fontSize: '34px', fontWeight: '800', margin: '0 0 25px 0' }}>Subly</h1>
          
          <div style={styles.separator} />
          
          <div style={styles.greetingBox}>
            <div style={styles.greetingTime}>{getGreeting()}</div>
            <div style={styles.greetingName}>{currentUsername}</div>
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
                onClick={() => setActiveTab(item.id)}
              >
                <span style={{ marginRight: '10px' }}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </nav>

        <div style={styles.logoutBtn} onClick={handleLogout}>
          {t('dashboard.logout')}
        </div>
      </aside>

      {/* ОСНОВНАЯ ЗОНА */}
      <main style={styles.mainContent}>
        
        {/* Вкладка: Přehled (Главная) */}
        {activeTab === 'prehled' && (
          <>
            <header style={styles.header}>
              <h2 style={styles.pageTitle}>{t('dashboard.prehledTitle')}</h2>
              <button style={styles.addButton} onClick={() => setShowAddModal(true)}>{t('dashboard.addBtn')}</button>
            </header>

            {/* Сводка (Summary Cards) */}
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>{t('dashboard.totalMonthly')}</p>
                <h3 style={styles.summaryValue}>{totalMonthly} CZK</h3>
              </div>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>{t('dashboard.closestPayment')}</p>
                {nextPaymentInfo ? (
                  <h3 style={styles.summaryValueHighlight}>
                    {nextPaymentInfo.name} ({nextPaymentInfo.formatted})
                  </h3>
                ) : (
                  <div style={styles.emptyPaymentContainer}>
                    <span style={styles.emptyPaymentIcon}>📅</span>
                    <p style={styles.emptyPaymentText}>{t('dashboard.noPayments')}</p>
                    <p style={styles.emptyPaymentHint}>{t('dashboard.noPaymentsHint')}</p>
                  </div>
                )}
              </div>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>{t('dashboard.activeSubs')}</p>
                <h3 style={styles.summaryValue}>{subscriptions.length}</h3>
              </div>
            </div>

            {/* Список подписок */}
            <div style={styles.listSection}>
              <h3 style={styles.sectionTitle}>{t('dashboard.activeServices')}</h3>
              <div style={styles.subsList}>
                {subscriptions.length === 0 ? (
                  <div style={styles.emptyListContainer}>
                    <span style={styles.emptyListIcon}>🎯</span>
                    <p style={styles.emptyListTitle}>{t('dashboard.emptyListTitle')}</p>
                    <p style={styles.emptyListHint}>{t('dashboard.emptyListHint')}</p>
                  </div>
                ) : (
                  subscriptions.map((sub) => (
                    <div key={sub.id} style={styles.subCard}>
                      <div style={styles.subInfo}>
                        <h4 style={styles.subName}>{sub.name}</h4>
                        <p style={styles.subDetails}>{sub.cycle === 'Měsíčně' ? t('dashboard.optMonth') : (sub.cycle === 'Ročně' ? t('dashboard.optYear') : sub.cycle)} • {t('dashboard.nextPaymentLabel')} {sub.nextPayment}</p>
                      </div>
                      <div style={styles.subPriceAction}>
                        <span style={styles.price}>{sub.price} {sub.currency}</span>
                        <div style={styles.actions}>
                          <button style={styles.actionBtn} onClick={() => openEditModal(sub)}>✏️</button>
                          <button style={styles.actionBtn} onClick={() => handleDelete(sub.id)}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Вкладка: Grafy */}
        {activeTab === 'grafy' && (
          <>
            <header style={styles.header}>
              <h2 style={styles.pageTitle}>{t('dashboard.grafyTitle')}</h2>
            </header>

            {subscriptions.length === 0 ? (
              <div style={styles.chartEmptyState}>
                <span style={{ fontSize: '64px' }}>📊</span>
                <h3 style={{ color: '#7A2F2F', fontSize: '22px', fontWeight: '800', margin: '16px 0 8px' }}>{t('dashboard.chartEmptyTitle')}</h3>
                <p style={{ color: '#A68E7A', fontSize: '15px', fontWeight: '500' }}>{t('dashboard.chartEmptyHint')}</p>
              </div>
            ) : (
              <>
                {/* Statistiky nahoře */}
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryCard}>
                    <p style={styles.summaryLabel}>{t('dashboard.totalMonthlyLabel')}</p>
                    <h3 style={styles.summaryValue}>{totalMonthly} CZK</h3>
                  </div>
                  <div style={styles.summaryCard}>
                    <p style={styles.summaryLabel}>{t('dashboard.mostExpService')}</p>
                    <h3 style={styles.summaryValueHighlight}>
                      {subscriptions.reduce((max, s) => s.price > max.price ? s : max, subscriptions[0]).name}
                    </h3>
                  </div>
                  <div style={styles.summaryCard}>
                    <p style={styles.summaryLabel}>{t('dashboard.avgPrice')}</p>
                    <h3 style={styles.summaryValue}>{Math.round(totalMonthly / subscriptions.length)} CZK</h3>
                  </div>
                </div>

                {/* Два графика рядом */}
                <div style={styles.chartsRow}>
                  {/* Donut Chart */}
                  <div style={styles.chartCard}>
                    <h3 style={styles.sectionTitle}>{t('dashboard.chart1Title')}</h3>
                    <p style={styles.chartSubtitle}>{t('dashboard.chart1Sub')}</p>
                    <div style={styles.chartContainerSquare}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={subscriptions}
                            dataKey="price"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={120}
                            paddingAngle={3}
                            stroke="none"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {subscriptions.map((entry, index) => (
                              <Cell key={`pie-${index}`} fill={['#7A2F2F', '#5A6E26', '#C4883C', '#3D6B7E', '#8B5C8B', '#D4785C', '#2E8B57', '#CD853F'][index % 8]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value} CZK`, 'Cena']}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontFamily: 'Montserrat, sans-serif', fontWeight: '600' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legenda pod grafem */}
                    <div style={styles.legendContainer}>
                      {subscriptions.map((sub, index) => (
                        <div key={sub.id} style={styles.legendItem}>
                          <span style={{ ...styles.legendDot, backgroundColor: ['#7A2F2F', '#5A6E26', '#C4883C', '#3D6B7E', '#8B5C8B', '#D4785C', '#2E8B57', '#CD853F'][index % 8] }} />
                          <span style={styles.legendLabel}>{sub.name}</span>
                          <span style={styles.legendValue}>{sub.price} {sub.currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div style={styles.chartCard}>
                    <h3 style={styles.sectionTitle}>{t('dashboard.chart2Title')}</h3>
                    <p style={styles.chartSubtitle}>{t('dashboard.chart2Sub')}</p>
                    <div style={styles.chartContainerSquare}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subscriptions} margin={{ top: 20, right: 20, left: -10, bottom: 5 }} barCategoryGap="25%">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(166,142,122,0.15)" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A68E7A', fontSize: 13, fontWeight: 600 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A68E7A', fontSize: 13, fontWeight: 600 }} unit=" CZK" />
                          <Tooltip
                            cursor={{ fill: 'rgba(239, 227, 215, 0.3)', radius: 8 }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontFamily: 'Montserrat, sans-serif', fontWeight: '600' }}
                            formatter={(value) => [`${value} CZK`, 'Cena']}
                          />
                          <Bar dataKey="price" radius={[10, 10, 0, 0]} maxBarSize={60}>
                            {subscriptions.map((entry, index) => (
                              <Cell key={`bar-${index}`} fill={['#7A2F2F', '#5A6E26', '#C4883C', '#3D6B7E', '#8B5C8B', '#D4785C', '#2E8B57', '#CD853F'][index % 8]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Podrobnosti pod grafem */}
                    <div style={styles.barDetailsContainer}>
                      {subscriptions
                        .slice()
                        .sort((a, b) => b.price - a.price)
                        .map((sub, index) => (
                          <div key={sub.id} style={styles.barDetailRow}>
                            <span style={styles.barDetailRank}>#{index + 1}</span>
                            <span style={styles.barDetailName}>{sub.name}</span>
                            <div style={styles.barDetailBarBg}>
                              <div style={{ ...styles.barDetailBarFill, width: `${(sub.price / subscriptions.reduce((max, s) => Math.max(max, s.price), 0)) * 100}%` }} />
                            </div>
                            <span style={styles.barDetailPrice}>{sub.price} {sub.currency}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Вкладка: Nastavení */}
        {activeTab === 'nastaveni' && (
          <>
            <header style={styles.header}>
              <h2 style={styles.pageTitle}>{t('dashboard.nastaveniTitle')}</h2>
            </header>

            {/* Toast уведомление */}
            {settingsMsg && (
              <div style={{
                ...styles.settingsToast,
                backgroundColor: settingsMsg.type === 'success' ? '#5A6E26' : '#7A2F2F',
              }}>
                <span style={{ marginRight: '8px' }}>{settingsMsg.type === 'success' ? '✅' : '❌'}</span>
                {settingsMsg.text}
              </div>
            )}

            {/* Секция 1: Профиль */}
            <div style={styles.settingsCard}>
              <div style={styles.settingsCardHeader}>
                <span style={styles.settingsCardIcon}>👤</span>
                <h3 style={styles.settingsCardTitle}>{t('dashboard.profileTitle')}</h3>
              </div>
              <div style={styles.settingsProfileGrid}>
                <div style={styles.settingsProfileItem}>
                  <span style={styles.settingsProfileLabel}>{t('dashboard.profileUser')}</span>
                  <span style={styles.settingsProfileValue}>{profile?.username || '—'}</span>
                </div>
                <div style={styles.settingsProfileItem}>
                  <span style={styles.settingsProfileLabel}>{t('dashboard.profileEmail')}</span>
                  <span style={styles.settingsProfileValue}>{profile?.email || '—'}</span>
                </div>
                <div style={styles.settingsProfileItem}>
                  <span style={styles.settingsProfileLabel}>{t('dashboard.profileTg')}</span>
                  <span style={{
                    ...styles.settingsProfileValue,
                    color: profile?.telegram_chat_id ? '#5A6E26' : '#A68E7A',
                  }}>
                    {profile?.telegram_chat_id ? `✅ ${t('dashboard.tgLinked')} (${profile.telegram_chat_id})` : `⚪ ${t('dashboard.tgUnlinked')}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Секция 2: Две формы рядом */}
            <div style={styles.settingsFormsRow}>
              {/* Смена email */}
              <div style={styles.settingsCard}>
                <div style={styles.settingsCardHeader}>
                  <span style={styles.settingsCardIcon}>📧</span>
                  <h3 style={styles.settingsCardTitle}>{t('dashboard.changeEmailTitle')}</h3>
                </div>
                <form onSubmit={handleChangeEmail} style={styles.settingsForm}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>
                      <span style={styles.fieldIcon}>📨</span> {t('dashboard.newEmailLabel')}
                    </label>
                    <input
                      type="email" required placeholder="novy@email.cz" style={styles.modalInput}
                      value={emailForm.new_email}
                      onChange={(e) => setEmailForm({ ...emailForm, new_email: e.target.value })}
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>
                      <span style={styles.fieldIcon}>🔒</span> {t('dashboard.currentPwdLabel')}
                    </label>
                    <input
                      type="password" required placeholder="***" style={styles.modalInput}
                      value={emailForm.password}
                      onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                    />
                  </div>
                  <button type="submit" style={styles.settingsSubmitBtn}>{t('dashboard.changeEmailBtn')}</button>
                </form>
              </div>

              {/* Смена пароля */}
              <div style={styles.settingsCard}>
                <div style={styles.settingsCardHeader}>
                  <span style={styles.settingsCardIcon}>🔑</span>
                  <h3 style={styles.settingsCardTitle}>{t('dashboard.changePwdTitle')}</h3>
                </div>
                <form onSubmit={handleChangePassword} style={styles.settingsForm}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>
                      <span style={styles.fieldIcon}>🔒</span> {t('dashboard.currentPwdLabel')}
                    </label>
                    <input
                      type="password" required placeholder="***" style={styles.modalInput}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>
                      <span style={styles.fieldIcon}>🆕</span> {t('dashboard.newPwdLabel')}
                    </label>
                    <input
                      type="password" required placeholder="***" style={styles.modalInput}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      onFocus={() => setShowPasswordRules(true)}
                      onBlur={() => setShowPasswordRules(false)}
                    />
                    {showPasswordRules && (
                      <div style={styles.passwordRulesContainer}>
                        <ul style={styles.passwordRulesList}>
                          <li style={{ color: hasMinLength ? '#5A6E26' : '#7A2F2F', transition: 'color 0.2s' }}>
                            {t('dashboard.ruleLen')}
                          </li>
                          <li style={{ color: hasUpperCase ? '#5A6E26' : '#7A2F2F', transition: 'color 0.2s' }}>
                            {t('dashboard.ruleUpper')}
                          </li>
                          <li style={{ color: hasNumber ? '#5A6E26' : '#7A2F2F', transition: 'color 0.2s' }}>
                            {t('dashboard.ruleNum')}
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>
                      <span style={styles.fieldIcon}>🔄</span> {t('dashboard.confirmPwdLabel')}
                    </label>
                    <input
                      type="password" required placeholder="***" style={styles.modalInput}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                  <button type="submit" style={styles.settingsSubmitBtn}>{t('dashboard.changePwdBtn')}</button>
                </form>
              </div>
            </div>

            {/* Секция 3: Telegram */}
            <div style={styles.settingsCard}>
              <div style={styles.settingsCardHeader}>
                <span style={styles.settingsCardIcon}>🤖</span>
                <h3 style={styles.settingsCardTitle}>{t('dashboard.tgBotTitle')}</h3>
              </div>
              <p style={styles.settingsTelegramDesc}>
                {t('dashboard.tgBotDesc')}
              </p>

              {profile?.telegram_chat_id ? (
                <div style={styles.settingsTelegramLinked}>
                  <div style={styles.settingsTelegramStatus}>
                    <span style={styles.settingsTelegramDot} />
                    <span style={styles.settingsTelegramStatusText}>{t('dashboard.tgLinked')}: <strong>{profile.telegram_chat_id}</strong></span>
                  </div>
                  <button onClick={handleUnlinkTelegram} style={styles.settingsUnlinkBtn}>{t('dashboard.unlinkTgBtn')}</button>
                </div>
              ) : (
                <form onSubmit={handleLinkTelegram} style={styles.settingsTelegramForm}>
                  <div style={styles.settingsTelegramInputRow}>
                    <input
                      type="text" required placeholder="ID"
                      style={{ ...styles.modalInput, flex: 1 }}
                      value={telegramId}
                      onChange={(e) => setTelegramId(e.target.value)}
                    />
                    <button type="submit" style={styles.settingsSubmitBtn}>{t('dashboard.linkTgBtn')}</button>
                  </div>
                  <p style={styles.settingsTelegramHint}>
                    {t('dashboard.tgHint')}
                  </p>
                </form>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'export' && (
          <>
            <header style={styles.header}>
              <h2 style={styles.pageTitle}>{t('dashboard.exportTitle')}</h2>
              {subscriptions.length > 0 && (
                <button
                  style={styles.addButton}
                  onClick={() => {
                    const bom = '\uFEFF';
                    const header = `${t('dashboard.colName')};${t('dashboard.colPrice')};${t('dashboard.colCurrency')};${t('dashboard.colCycle')};${t('dashboard.colNext')}\n`;
                    const rows = subscriptions.map(s => `${s.name};${s.price};${s.currency};${s.cycle === 'Měsíčně' ? t('dashboard.optMonth') : (s.cycle === 'Ročně' ? t('dashboard.optYear') : s.cycle)};${s.nextPayment}`).join('\n');
                    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `subly_export_${new Date().toISOString().slice(0,10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  {t('dashboard.downloadCsvBtn')}
                </button>
              )}
            </header>

            {subscriptions.length === 0 ? (
              <div style={styles.chartEmptyState}>
                <span style={{ fontSize: '64px' }}>📄</span>
                <h3 style={{ color: '#7A2F2F', fontSize: '22px', fontWeight: '800', margin: '16px 0 8px' }}>{t('dashboard.exportEmptyTitle')}</h3>
                <p style={{ color: '#A68E7A', fontSize: '15px', fontWeight: '500' }}>{t('dashboard.exportEmptyHint')}</p>
              </div>
            ) : (
              <div style={styles.exportSection}>
                <div style={styles.exportInfo}>
                  <div style={styles.exportInfoIcon}>📊</div>
                  <div>
                    <h4 style={styles.exportInfoTitle}>{t('dashboard.exportPreviewTitle')}</h4>
                    <p style={styles.exportInfoDesc}>{subscriptions.length} {t('dashboard.exportPreviewDesc')} {totalMonthly} {t('dashboard.exportMonthly')}</p>
                  </div>
                </div>

                <div style={styles.exportTableWrapper}>
                  <table style={styles.exportTable}>
                    <thead>
                      <tr>
                        <th style={styles.exportTh}>{t('dashboard.colName')}</th>
                        <th style={styles.exportTh}>{t('dashboard.colPrice')}</th>
                        <th style={styles.exportTh}>{t('dashboard.colCurrency')}</th>
                        <th style={styles.exportTh}>{t('dashboard.colCycle')}</th>
                        <th style={styles.exportTh}>{t('dashboard.colNext')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((sub) => (
                        <tr key={sub.id}>
                          <td style={styles.exportTd}>
                            <span style={styles.exportTdName}>{sub.name}</span>
                          </td>
                          <td style={styles.exportTd}>
                            <span style={styles.exportTdPrice}>{sub.price}</span>
                          </td>
                          <td style={styles.exportTd}>{sub.currency}</td>
                          <td style={styles.exportTd}>{sub.cycle === 'Měsíčně' ? t('dashboard.optMonth') : (sub.cycle === 'Ročně' ? t('dashboard.optYear') : sub.cycle)}</td>
                          <td style={styles.exportTd}>{sub.nextPayment}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={{ ...styles.exportTd, fontWeight: '800', color: '#7A2F2F' }}>{t('dashboard.colTotal')}</td>
                        <td style={{ ...styles.exportTd, fontWeight: '800', color: '#7A2F2F' }}>{totalMonthly}</td>
                        <td style={styles.exportTd}>CZK</td>
                        <td style={styles.exportTd}>—</td>
                        <td style={styles.exportTd}>—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* МОДАЛЬНОЕ ОКНО — Премиум дизайн */}
        {showAddModal && (
          <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              
              {/* Заголовок модального окна */}
              <div style={styles.modalHeader}>
                <div style={styles.modalIconCircle}>
                  <span style={styles.modalIconEmoji}>✨</span>
                </div>
                <h3 style={styles.modalTitle}>{t('dashboard.modalAddTitle')}</h3>
                <p style={styles.modalSubtitle}>{t('dashboard.modalAddSub')}</p>
              </div>

              {/* Разделитель */}
              <div style={styles.modalDivider} />

              <form onSubmit={handleAddSubscription} style={styles.modalForm}>
                
                {/* Название службы */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>
                    <span style={styles.fieldIcon}>🏷️</span> {t('dashboard.modalName')}
                  </label>
                  <input 
                    type="text" placeholder="" required style={styles.modalInput}
                    value={newSub.name} onChange={(e) => setNewSub({...newSub, name: e.target.value})} 
                  />
                </div>

                {/* Цена + Валюта в одной строке */}
                <div style={styles.fieldRow}>
                  <div style={{...styles.fieldGroup, flex: 2}}>
                    <label style={styles.fieldLabel}>
                      <span style={styles.fieldIcon}>💰</span> {t('dashboard.modalPrice')}
                    </label>
                    <input 
                      type="number" placeholder="0" required style={styles.modalInput}
                      value={newSub.price} onChange={(e) => setNewSub({...newSub, price: e.target.value})} 
                    />
                  </div>
                  <div style={{...styles.fieldGroup, flex: 1}}>
                    <label style={styles.fieldLabel}>
                      <span style={styles.fieldIcon}>💱</span> {t('dashboard.modalCurrency')}
                    </label>
                    <select style={styles.modalSelect} value={newSub.currency} onChange={(e) => setNewSub({...newSub, currency: e.target.value})}>
                      <option value="CZK">CZK</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                {/* Цикл */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>
                    <span style={styles.fieldIcon}>🔄</span> {t('dashboard.modalCycle')}
                  </label>
                  <select style={styles.modalSelect} value={newSub.cycle} onChange={(e) => setNewSub({...newSub, cycle: e.target.value})}>
                    <option value="Měsíčně">{t('dashboard.optMonth')}</option>
                    <option value="Ročně">{t('dashboard.optYear')}</option>
                  </select>
                </div>

                {/* Дата следующего платежа */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>
                    <span style={styles.fieldIcon}>📅</span> {t('dashboard.modalNext')}
                  </label>
                  <input 
                    type="date" required style={styles.modalInput}
                    value={newSub.nextPayment} onChange={(e) => setNewSub({...newSub, nextPayment: e.target.value})} 
                  />
                </div>

                {/* Кнопки */}
                <div style={styles.modalActions}>
                  <button 
                    type="button" 
                    style={{
                      ...styles.modalBtnCancel,
                      ...(isCancelHovered ? styles.modalBtnCancelHover : {})
                    }}
                    onMouseEnter={() => setIsCancelHovered(true)}
                    onMouseLeave={() => setIsCancelHovered(false)}
                    onClick={() => setShowAddModal(false)}
                  >
                    {t('dashboard.btnCancel')}
                  </button>
                  <button 
                    type="submit" 
                    style={{
                      ...styles.modalBtnSubmit,
                      ...(isSubmitHovered ? styles.modalBtnSubmitHover : {})
                    }}
                    onMouseEnter={() => setIsSubmitHovered(true)}
                    onMouseLeave={() => setIsSubmitHovered(false)}
                  >
                    {t('dashboard.btnSaveAdd')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ */}
        {showEditModal && editSub && (
          <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              
              <div style={styles.modalHeader}>
                <div style={styles.modalIconCircle}>
                  <span style={styles.modalIconEmoji}>✏️</span>
                </div>
                <h3 style={styles.modalTitle}>{t('dashboard.modalEditTitle')}</h3>
                <p style={styles.modalSubtitle}>{t('dashboard.modalEditSub')}</p>
              </div>

              <div style={styles.modalDivider} />

              <form onSubmit={handleEditSubscription} style={styles.modalForm}>
                
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>
                    <span style={styles.fieldIcon}>🏷️</span> {t('dashboard.modalName')}
                  </label>
                  <input 
                    type="text" placeholder="" required style={styles.modalInput}
                    value={editSub.name} onChange={(e) => setEditSub({...editSub, name: e.target.value})} 
                  />
                </div>

                <div style={styles.fieldRow}>
                  <div style={{...styles.fieldGroup, flex: 2}}>
                    <label style={styles.fieldLabel}>
                      <span style={styles.fieldIcon}>💰</span> {t('dashboard.modalPrice')}
                    </label>
                    <input 
                      type="number" placeholder="0" required style={styles.modalInput}
                      value={editSub.price} onChange={(e) => setEditSub({...editSub, price: e.target.value})} 
                    />
                  </div>
                  <div style={{...styles.fieldGroup, flex: 1}}>
                    <label style={styles.fieldLabel}>
                      <span style={styles.fieldIcon}>💱</span> {t('dashboard.modalCurrency')}
                    </label>
                    <select style={styles.modalSelect} value={editSub.currency} onChange={(e) => setEditSub({...editSub, currency: e.target.value})}>
                      <option value="CZK">CZK</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>
                    <span style={styles.fieldIcon}>🔄</span> {t('dashboard.modalCycle')}
                  </label>
                  <select style={styles.modalSelect} value={editSub.cycle} onChange={(e) => setEditSub({...editSub, cycle: e.target.value})}>
                    <option value="Měsíčně">{t('dashboard.optMonth')}</option>
                    <option value="Ročně">{t('dashboard.optYear')}</option>
                  </select>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>
                    <span style={styles.fieldIcon}>📅</span> {t('dashboard.modalNext')}
                  </label>
                  <input 
                    type="date" required style={styles.modalInput}
                    value={editSub.nextPayment} onChange={(e) => setEditSub({...editSub, nextPayment: e.target.value})} 
                  />
                </div>

                <div style={styles.modalActions}>
                  <button 
                    type="button" 
                    style={{
                      ...styles.modalBtnCancel,
                      ...(isEditCancelHovered ? styles.modalBtnCancelHover : {})
                    }}
                    onMouseEnter={() => setIsEditCancelHovered(true)}
                    onMouseLeave={() => setIsEditCancelHovered(false)}
                    onClick={() => setShowEditModal(false)}
                  >
                    {t('dashboard.btnCancel')}
                  </button>
                  <button 
                    type="submit" 
                    style={{
                      ...styles.modalBtnSubmit,
                      ...(isEditSubmitHovered ? styles.modalBtnSubmitHover : {})
                    }}
                    onMouseEnter={() => setIsEditSubmitHovered(true)}
                    onMouseLeave={() => setIsEditSubmitHovered(false)}
                  >
                    {t('dashboard.btnSaveEdit')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// СТИЛИ
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
    marginBottom: '35px',
    textAlign: 'center',
  },
  separator: {
    height: '1px',
    backgroundColor: 'rgba(239, 227, 215, 0.2)',
    width: '100%',
    marginBottom: '20px',
  },
  greetingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  greetingTime: {
    color: '#EFE3D7',
    fontSize: '13px',
    fontWeight: '500',
    opacity: 0.8,
  },
  greetingName: {
    color: '#EFE3D7',
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '0.5px',
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

  // Пустая карточка Nejbližší platba
  emptyPaymentContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
  },
  emptyPaymentIcon: {
    fontSize: '28px',
    marginBottom: '4px',
  },
  emptyPaymentText: {
    color: '#A68E7A',
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  emptyPaymentHint: {
    color: '#C4B3A3',
    fontSize: '13px',
    fontWeight: '500',
    margin: 0,
    fontStyle: 'italic',
  },

  // Пустой список подписок
  emptyListContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px 20px',
    gap: '8px',
  },
  emptyListIcon: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  emptyListTitle: {
    color: '#7A2F2F',
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
    textAlign: 'center',
  },
  emptyListHint: {
    color: '#A68E7A',
    fontSize: '14px',
    fontWeight: '500',
    margin: 0,
    textAlign: 'center',
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
  // ============ СТИЛИ ДЛЯ СТРАНИЦЫ ГРАФИКОВ ============
  chartsRow: {
    display: 'flex',
    gap: '24px',
    marginBottom: '30px',
  },
  chartCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: '28px',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
  },
  chartSubtitle: {
    color: '#A68E7A',
    fontSize: '13px',
    fontWeight: '500',
    margin: '0 0 20px 0',
  },
  chartContainerSquare: {
    height: '320px',
    width: '100%',
  },
  chartEmptyState: {
    backgroundColor: '#FFFFFF',
    padding: '80px 40px',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  legendContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '20px',
    padding: '16px 0 0',
    borderTop: '1px solid rgba(166,142,122,0.15)',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: '#F9F6F0',
    borderRadius: '10px',
    fontSize: '13px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  legendLabel: {
    color: '#5A6E26',
    fontWeight: '700',
  },
  legendValue: {
    color: '#A68E7A',
    fontWeight: '600',
  },
  barDetailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '20px',
    padding: '16px 0 0',
    borderTop: '1px solid rgba(166,142,122,0.15)',
  },
  barDetailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  barDetailRank: {
    color: '#A68E7A',
    fontSize: '12px',
    fontWeight: '800',
    minWidth: '24px',
  },
  barDetailName: {
    color: '#5A6E26',
    fontSize: '14px',
    fontWeight: '700',
    minWidth: '100px',
  },
  barDetailBarBg: {
    flex: 1,
    height: '8px',
    backgroundColor: '#F0EAE2',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barDetailBarFill: {
    height: '100%',
    backgroundColor: '#7A2F2F',
    borderRadius: '4px',
    transition: 'width 0.6s ease',
  },
  barDetailPrice: {
    color: '#7A2F2F',
    fontSize: '14px',
    fontWeight: '800',
    minWidth: '80px',
    textAlign: 'right',
  },

  // ============ СТИЛИ ДЛЯ ЭКСПОРТА CSV ============
  exportSection: {
    backgroundColor: '#FFFFFF',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
  },
  exportInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: 'rgba(90, 110, 38, 0.06)',
    borderRadius: '14px',
    marginBottom: '24px',
    border: '1px solid rgba(90, 110, 38, 0.12)',
  },
  exportInfoIcon: {
    fontSize: '32px',
    backgroundColor: '#FFFFFF',
    width: '52px',
    height: '52px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    flexShrink: 0,
  },
  exportInfoTitle: {
    color: '#5A6E26',
    fontSize: '16px',
    fontWeight: '800',
    margin: '0 0 4px 0',
  },
  exportInfoDesc: {
    color: '#A68E7A',
    fontSize: '14px',
    fontWeight: '500',
    margin: 0,
  },
  exportTableWrapper: {
    overflowX: 'auto',
    borderRadius: '14px',
    border: '1px solid rgba(166, 142, 122, 0.15)',
  },
  exportTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'Montserrat, sans-serif',
  },
  exportTh: {
    backgroundColor: '#F9F6F0',
    color: '#7A2F2F',
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '14px 20px',
    textAlign: 'left',
    borderBottom: '2px solid rgba(166, 142, 122, 0.15)',
  },
  exportTd: {
    padding: '14px 20px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#5A6E26',
    borderBottom: '1px solid rgba(166, 142, 122, 0.08)',
  },
  exportTdName: {
    fontWeight: '700',
    color: '#5A6E26',
  },
  exportTdPrice: {
    fontWeight: '800',
    color: '#7A2F2F',
  },

  // ============ МОДАЛЬНОЕ ОКНО — Новый дизайн ============
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(90, 110, 38, 0.35)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    animation: 'fadeIn 0.2s ease-out',
  },
  modalContent: {
    backgroundColor: '#FFFCF8',
    padding: '0',
    borderRadius: '28px',
    width: '480px',
    maxWidth: '90vw',
    boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(166, 142, 122, 0.1)',
    overflow: 'hidden',
    animation: 'slideUp 0.3s ease-out',
  },
  modalHeader: {
    background: 'linear-gradient(135deg, #5A6E26 0%, #7A8F36 100%)',
    padding: '32px 36px 28px',
    textAlign: 'center',
  },
  modalIconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(239, 227, 215, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    backdropFilter: 'blur(10px)',
  },
  modalIconEmoji: {
    fontSize: '28px',
  },
  modalTitle: {
    color: '#FFFCF8',
    fontSize: '24px',
    fontWeight: '800',
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px',
  },
  modalSubtitle: {
    color: 'rgba(239, 227, 215, 0.8)',
    fontSize: '14px',
    fontWeight: '500',
    margin: 0,
  },
  modalDivider: {
    height: '3px',
    background: 'linear-gradient(90deg, #7A2F2F, #5A6E26, #7A2F2F)',
    opacity: 0.3,
  },
  modalForm: {
    padding: '28px 36px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fieldRow: {
    display: 'flex',
    gap: '16px',
  },
  fieldLabel: {
    color: '#7A2F2F',
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  fieldIcon: {
    fontSize: '14px',
  },
  modalInput: {
    padding: '14px 18px',
    borderRadius: '14px',
    border: '2px solid rgba(166, 142, 122, 0.2)',
    fontSize: '16px',
    fontWeight: '600',
    color: '#5A6E26',
    outline: 'none',
    backgroundColor: '#F9F6F0',
    fontFamily: 'Montserrat, sans-serif',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    width: '100%',
    boxSizing: 'border-box',
  },
  modalSelect: {
    padding: '14px 18px',
    borderRadius: '14px',
    border: '2px solid rgba(166, 142, 122, 0.2)',
    fontSize: '16px',
    fontWeight: '600',
    color: '#5A6E26',
    outline: 'none',
    backgroundColor: '#F9F6F0',
    fontFamily: 'Montserrat, sans-serif',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    width: '100%',
    boxSizing: 'border-box',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23A68E7A' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    paddingRight: '40px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#A68E7A',
    padding: '14px 20px',
    border: '2px solid rgba(166, 142, 122, 0.25)',
    borderRadius: '14px',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Montserrat, sans-serif',
  },
  modalBtnCancelHover: {
    backgroundColor: 'rgba(166, 142, 122, 0.08)',
    borderColor: 'rgba(166, 142, 122, 0.4)',
  },
  modalBtnSubmit: {
    flex: 2,
    backgroundColor: '#7A2F2F',
    color: '#FFFCF8',
    padding: '14px 28px',
    border: 'none',
    borderRadius: '14px',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Montserrat, sans-serif',
    boxShadow: '0 4px 15px rgba(122, 47, 47, 0.25)',
    letterSpacing: '0.3px',
  },
  modalBtnSubmitHover: {
    backgroundColor: '#8B3636',
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 20px rgba(122, 47, 47, 0.35)',
  },

  // ============ СТИЛИ ДЛЯ НАСТРОЕК ============
  settingsToast: {
    padding: '14px 24px',
    borderRadius: '14px',
    color: '#FFFCF8',
    fontWeight: '700',
    fontSize: '15px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    animation: 'slideUp 0.3s ease-out',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    padding: '28px',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    marginBottom: '24px',
  },
  settingsCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(166,142,122,0.15)',
  },
  settingsCardIcon: {
    fontSize: '28px',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F6F0',
    borderRadius: '14px',
    flexShrink: 0,
  },
  settingsCardTitle: {
    color: '#7A2F2F',
    fontSize: '20px',
    fontWeight: '800',
    margin: 0,
  },
  settingsProfileGrid: {
    display: 'flex',
    gap: '20px',
  },
  settingsProfileItem: {
    flex: 1,
    padding: '16px 20px',
    backgroundColor: '#F9F6F0',
    borderRadius: '14px',
    border: '1px solid rgba(166,142,122,0.1)',
  },
  settingsProfileLabel: {
    display: 'block',
    color: '#A68E7A',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '6px',
  },
  settingsProfileValue: {
    display: 'block',
    color: '#5A6E26',
    fontSize: '16px',
    fontWeight: '700',
  },
  settingsFormsRow: {
    display: 'flex',
    gap: '24px',
  },
  settingsForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  settingsSubmitBtn: {
    backgroundColor: '#7A2F2F',
    color: '#FFFCF8',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'Montserrat, sans-serif',
    boxShadow: '0 4px 15px rgba(122, 47, 47, 0.25)',
    transition: 'all 0.2s ease',
    marginTop: '4px',
  },
  settingsTelegramDesc: {
    color: '#A68E7A',
    fontSize: '15px',
    fontWeight: '500',
    margin: '0 0 20px 0',
    lineHeight: '1.5',
  },
  settingsTelegramLinked: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: 'rgba(90, 110, 38, 0.06)',
    borderRadius: '14px',
    border: '1px solid rgba(90, 110, 38, 0.12)',
  },
  settingsTelegramStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  settingsTelegramDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#5A6E26',
    boxShadow: '0 0 8px rgba(90, 110, 38, 0.4)',
  },
  settingsTelegramStatusText: {
    color: '#5A6E26',
    fontSize: '15px',
    fontWeight: '600',
  },
  settingsUnlinkBtn: {
    backgroundColor: 'transparent',
    color: '#7A2F2F',
    border: '2px solid rgba(122, 47, 47, 0.25)',
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'Montserrat, sans-serif',
    transition: 'all 0.2s ease',
  },
  settingsTelegramForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  settingsTelegramInputRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  settingsTelegramHint: {
    color: '#A68E7A',
    fontSize: '13px',
    fontWeight: '500',
    margin: 0,
    fontStyle: 'italic',
  },
  passwordRulesContainer: {
    width: '100%',
    padding: '8px 10px 0',
    color: '#7A2F2F',
    fontSize: '13px',
    textAlign: 'left',
    opacity: 0.9,
    fontWeight: '600',
  },
  passwordRulesList: {
    margin: 0,
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
};

export default Dashboard;