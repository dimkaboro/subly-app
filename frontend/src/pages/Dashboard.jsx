import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

// Компоненты
import Sidebar       from '../components/dashboard/Sidebar';
import OverviewTab   from '../components/dashboard/OverviewTab';
import ChartsTab     from '../components/dashboard/ChartsTab';
import SettingsTab   from '../components/dashboard/SettingsTab';
import ExportTab     from '../components/dashboard/ExportTab';
import { AddSubModal, EditSubModal } from '../components/dashboard/SubModals';
import styles        from '../components/dashboard/dashboardStyles';

const API = 'http://localhost:8000';

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // ── Вкладки ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('prehled');

  // ── Подписки ───────────────────────────────────────────────────────────────
  const [subscriptions, setSubscriptions]   = useState([]);
  const [showAddModal,  setShowAddModal]     = useState(false);
  const [showEditModal, setShowEditModal]    = useState(false);
  const [newSub,        setNewSub]           = useState({ name: '', price: '', currency: 'CZK', cycle: 'Měsíčně', nextPayment: '' });
  const [editSub,       setEditSub]          = useState(null);
  const [modalError,    setModalError]       = useState(null);

  // ── Настройки ──────────────────────────────────────────────────────────────
  const [profile,       setProfile]         = useState(null);
  const [settingsMsg,   setSettingsMsg]     = useState(null);
  const [emailForm,     setEmailForm]       = useState({ new_email: '', password: '' });
  const [passwordForm,  setPasswordForm]    = useState({ current_password: '', new_password: '', confirmPassword: '' });
  const [telegramId,    setTelegramId]      = useState('');
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [notifySettings, setNotifySettings] = useState({ notify_email: true, notify_telegram: true, notify_intervals: [], notify_language: 'cs' });

  // Правила пароля
  const hasMinLength = passwordForm.new_password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(passwordForm.new_password);
  const hasNumber    = /\d/.test(passwordForm.new_password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasNumber;

  // ── Авто-редирект при 401 ──────────────────────────────────────────────────
  const handle401 = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  // ── Загрузка данных ────────────────────────────────────────────────────────
  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const res = await fetch(`${API}/api/subscriptions`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handle401(); return; }
      if (res.ok) setSubscriptions(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const res = await fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handle401(); return; }
      if (res.ok) setProfile(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchNotificationSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const res = await fetch(`${API}/api/me/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setNotifySettings({
          notify_email:     data.notify_email,
          notify_telegram:  data.notify_telegram,
          notify_intervals: data.notify_intervals ? data.notify_intervals.split(',') : [],
          notify_language:  data.notify_language || 'cs',
        });
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchSubscriptions(); }, []);
  useEffect(() => {
    if (activeTab === 'nastaveni') { fetchProfile(); fetchNotificationSettings(); }
  }, [activeTab]);
  useEffect(() => {
    if (settingsMsg) {
      const t = setTimeout(() => setSettingsMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [settingsMsg]);

  // ── CRUD подписки ──────────────────────────────────────────────────────────
  const handleAddSubscription = async (e) => {
    e.preventDefault();
    setModalError(null);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(newSub.nextPayment) < today) { setModalError(t('dashboard.msgPastDate')); return; }
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const res = await fetch(`${API}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newSub, price: Number(newSub.price) }),
      });
      if (res.status === 401) { handle401(); return; }
      if (res.ok) {
        setSubscriptions([...subscriptions, await res.json()]);
        setShowAddModal(false);
        setModalError(null);
        setNewSub({ name: '', price: '', currency: 'CZK', cycle: 'Měsíčně', nextPayment: '' });
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const res = await fetch(`${API}/api/subscriptions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handle401(); return; }
      if (res.ok) setSubscriptions(subscriptions.filter(s => s.id !== id));
    } catch (e) { console.error(e); }
  };

  const openEditModal = (sub) => { setModalError(null); setEditSub({ ...sub, price: String(sub.price) }); setShowEditModal(true); };

  const handleEditSubscription = async (e) => {
    e.preventDefault();
    if (!editSub) return;
    setModalError(null);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(editSub.nextPayment) < today) { setModalError(t('dashboard.msgPastDate')); return; }
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const res = await fetch(`${API}/api/subscriptions/${editSub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editSub.name, price: Number(editSub.price), currency: editSub.currency, cycle: editSub.cycle, nextPayment: editSub.nextPayment }),
      });
      if (res.status === 401) { handle401(); return; }
      if (res.ok) {
        const updated = await res.json();
        setSubscriptions(subscriptions.map(s => s.id === updated.id ? updated : s));
        setShowEditModal(false); setModalError(null); setEditSub(null);
      }
    } catch (e) { console.error(e); }
  };

  // ── Настройки профиля ──────────────────────────────────────────────────────
  const handleChangeEmail = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const res = await fetch(`${API}/api/me/email`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(emailForm) });
      if (res.status === 401) { handle401(); return; }
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        setProfile(prev => ({ ...prev, email: data.email }));
        setEmailForm({ new_email: '', password: '' });
        setSettingsMsg({ type: 'success', text: t('dashboard.msgEmailSuccess') });
      } else { setSettingsMsg({ type: 'error', text: data.detail || 'Error' }); }
    } catch { setSettingsMsg({ type: 'error', text: t('dashboard.msgServerErr') }); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) { setSettingsMsg({ type: 'error', text: t('dashboard.msgWeakPwd') }); return; }
    if (passwordForm.new_password !== passwordForm.confirmPassword) { setSettingsMsg({ type: 'error', text: t('dashboard.msgPwdMismatch') }); return; }
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const res = await fetch(`${API}/api/me/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ current_password: passwordForm.current_password, new_password: passwordForm.new_password }) });
      if (res.status === 401) { handle401(); return; }
      const data = await res.json();
      if (res.ok) { setPasswordForm({ current_password: '', new_password: '', confirmPassword: '' }); setSettingsMsg({ type: 'success', text: t('dashboard.msgPwdSuccess') }); }
      else { setSettingsMsg({ type: 'error', text: data.detail || 'Error' }); }
    } catch { setSettingsMsg({ type: 'error', text: t('dashboard.msgServerErr') }); }
  };

  const handleLinkTelegram = async (e) => {
    e.preventDefault();
    if (!telegramId.trim()) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const res = await fetch(`${API}/api/me/telegram`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ telegram_chat_id: telegramId.trim() }) });
      if (res.status === 401) { handle401(); return; }
      const data = await res.json();
      if (res.ok) { setProfile(prev => ({ ...prev, telegram_chat_id: data.telegram_chat_id })); setTelegramId(''); setSettingsMsg({ type: 'success', text: t('dashboard.msgTgSuccess') }); }
      else { setSettingsMsg({ type: 'error', text: data.detail || 'Error' }); }
    } catch { setSettingsMsg({ type: 'error', text: t('dashboard.msgServerErr') }); }
  };

  const handleUnlinkTelegram = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      const res = await fetch(`${API}/api/me/telegram`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handle401(); return; }
      if (res.ok) { setProfile(prev => ({ ...prev, telegram_chat_id: null })); setSettingsMsg({ type: 'success', text: t('dashboard.msgTgUnlink') }); }
    } catch { setSettingsMsg({ type: 'error', text: t('dashboard.msgServerErr') }); }
  };

  const handleNotifyChange = async (newSettings) => {
    setNotifySettings(newSettings);
    try {
      const token = localStorage.getItem('token');
      if (!token) { handle401(); return; }
      await fetch(`${API}/api/me/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notify_email: newSettings.notify_email, notify_telegram: newSettings.notify_telegram, notify_intervals: newSettings.notify_intervals.join(','), notify_language: newSettings.notify_language || 'cs' }),
      });
      setSettingsMsg({ type: 'success', text: t('dashboard.notifySaved') });
    } catch { setSettingsMsg({ type: 'error', text: t('dashboard.msgServerErr') }); }
  };

  const toggleInterval = (interval) => {
    const current = notifySettings.notify_intervals;
    const updated = current.includes(interval) ? current.filter(i => i !== interval) : [...current, interval];
    handleNotifyChange({ ...notifySettings, notify_intervals: updated });
  };

  // ── Производные данные ─────────────────────────────────────────────────────
  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.price, 0);

  const getNextPaymentInfo = () => {
    if (!subscriptions.length) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let closest = null, closestDate = null;
    for (const sub of subscriptions) {
      if (!sub.nextPayment) continue;
      const date = new Date(sub.nextPayment);
      if (isNaN(date.getTime())) continue;
      if (!closestDate || date < closestDate) { closestDate = date; closest = sub; }
    }
    if (!closest) return null;
    return { name: closest.name, formatted: `${closestDate.getDate()}. ${closestDate.getMonth() + 1}.` };
  };

  const currentUsername = profile?.username || localStorage.getItem('username') || '';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={() => { localStorage.removeItem('token'); localStorage.removeItem('username'); navigate('/login'); }}
        username={currentUsername}
      />

      <main style={styles.mainContent}>
        {activeTab === 'prehled' && (
          <OverviewTab
            subscriptions={subscriptions}
            totalMonthly={totalMonthly}
            nextPaymentInfo={getNextPaymentInfo()}
            onAddClick={() => setShowAddModal(true)}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}

        {activeTab === 'grafy' && (
          <ChartsTab subscriptions={subscriptions} totalMonthly={totalMonthly} />
        )}

        {activeTab === 'nastaveni' && (
          <SettingsTab
            profile={profile}
            settingsMsg={settingsMsg}
            emailForm={emailForm}         setEmailForm={setEmailForm}       onChangeEmail={handleChangeEmail}
            passwordForm={passwordForm}   setPasswordForm={setPasswordForm} onChangePassword={handleChangePassword}
            showPasswordRules={showPasswordRules} setShowPasswordRules={setShowPasswordRules}
            hasMinLength={hasMinLength}   hasUpperCase={hasUpperCase}       hasNumber={hasNumber}
            telegramId={telegramId}       setTelegramId={setTelegramId}
            onLinkTelegram={handleLinkTelegram}   onUnlinkTelegram={handleUnlinkTelegram}
            notifySettings={notifySettings}       onNotifyChange={handleNotifyChange}   toggleInterval={toggleInterval}
          />
        )}

        {activeTab === 'export' && (
          <ExportTab subscriptions={subscriptions} totalMonthly={totalMonthly} />
        )}

        {/* Модальные окна */}
        {showAddModal && (
          <AddSubModal
            sub={newSub}
            onSubChange={setNewSub}
            onClose={() => { setShowAddModal(false); setModalError(null); }}
            onSubmit={handleAddSubscription}
            error={modalError}
          />
        )}

        {showEditModal && editSub && (
          <EditSubModal
            sub={editSub}
            onSubChange={setEditSub}
            onClose={() => { setShowEditModal(false); setModalError(null); }}
            onSubmit={handleEditSubscription}
            error={modalError}
          />
        )}
      </main>
    </div>
  );
}

export default Dashboard;