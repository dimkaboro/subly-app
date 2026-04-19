import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import styles from './dashboardStyles';

function SettingsTab({
  profile,
  settingsMsg,
  emailForm, setEmailForm, onChangeEmail,
  passwordForm, setPasswordForm, onChangePassword,
  showPasswordRules, setShowPasswordRules,
  hasMinLength, hasUpperCase, hasNumber,
  telegramId, setTelegramId,
  onLinkTelegram, onUnlinkTelegram,
  notifySettings, onNotifyChange, toggleInterval,
}) {
  const { t } = useLanguage();

  return (
    <>
      <header style={styles.header}>
        <h2 style={styles.pageTitle}>{t('dashboard.nastaveniTitle')}</h2>
      </header>

      {/* Toast */}
      {settingsMsg && (
        <div style={{ ...styles.settingsToast, backgroundColor: settingsMsg.type === 'success' ? '#5A6E26' : '#7A2F2F' }}>
          <span style={{ marginRight: '8px' }}>{settingsMsg.type === 'success' ? '✅' : '❌'}</span>
          {settingsMsg.text}
        </div>
      )}

      {/* Профиль */}
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
            <span style={{ ...styles.settingsProfileValue, color: profile?.telegram_chat_id ? '#5A6E26' : '#A68E7A' }}>
              {profile?.telegram_chat_id ? `✅ ${t('dashboard.tgLinked')} (${profile.telegram_chat_id})` : `⚪ ${t('dashboard.tgUnlinked')}`}
            </span>
          </div>
        </div>
      </div>

      {/* Смена email + пароля */}
      <div style={styles.settingsFormsRow}>
        <div style={styles.settingsCard}>
          <div style={styles.settingsCardHeader}>
            <span style={styles.settingsCardIcon}>📧</span>
            <h3 style={styles.settingsCardTitle}>{t('dashboard.changeEmailTitle')}</h3>
          </div>
          <form onSubmit={onChangeEmail} style={styles.settingsForm}>
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}><span style={styles.fieldIcon}>📨</span> {t('dashboard.newEmailLabel')}</label>
              <input type="email" required placeholder="novy@email.cz" style={styles.modalInput} value={emailForm.new_email} onChange={(e) => setEmailForm({ ...emailForm, new_email: e.target.value })} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}><span style={styles.fieldIcon}>🔒</span> {t('dashboard.currentPwdLabel')}</label>
              <input type="password" required placeholder="***" style={styles.modalInput} value={emailForm.password} onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })} />
            </div>
            <button type="submit" style={styles.settingsSubmitBtn}>{t('dashboard.changeEmailBtn')}</button>
          </form>
        </div>

        <div style={styles.settingsCard}>
          <div style={styles.settingsCardHeader}>
            <span style={styles.settingsCardIcon}>🔑</span>
            <h3 style={styles.settingsCardTitle}>{t('dashboard.changePwdTitle')}</h3>
          </div>
          <form onSubmit={onChangePassword} style={styles.settingsForm}>
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}><span style={styles.fieldIcon}>🔒</span> {t('dashboard.currentPwdLabel')}</label>
              <input type="password" required placeholder="***" style={styles.modalInput} value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}><span style={styles.fieldIcon}>🆕</span> {t('dashboard.newPwdLabel')}</label>
              <input type="password" required placeholder="***" style={styles.modalInput} value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} onFocus={() => setShowPasswordRules(true)} onBlur={() => setShowPasswordRules(false)} />
              {showPasswordRules && (
                <div style={styles.passwordRulesContainer}>
                  <ul style={styles.passwordRulesList}>
                    <li style={{ color: hasMinLength ? '#5A6E26' : '#7A2F2F', transition: 'color 0.2s' }}>{t('dashboard.ruleLen')}</li>
                    <li style={{ color: hasUpperCase ? '#5A6E26' : '#7A2F2F', transition: 'color 0.2s' }}>{t('dashboard.ruleUpper')}</li>
                    <li style={{ color: hasNumber ? '#5A6E26' : '#7A2F2F', transition: 'color 0.2s' }}>{t('dashboard.ruleNum')}</li>
                  </ul>
                </div>
              )}
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}><span style={styles.fieldIcon}>🔄</span> {t('dashboard.confirmPwdLabel')}</label>
              <input type="password" required placeholder="***" style={styles.modalInput} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
            </div>
            <button type="submit" style={styles.settingsSubmitBtn}>{t('dashboard.changePwdBtn')}</button>
          </form>
        </div>
      </div>

      {/* Telegram */}
      <div style={styles.settingsCard}>
        <div style={styles.settingsCardHeader}>
          <span style={styles.settingsCardIcon}>🤖</span>
          <h3 style={styles.settingsCardTitle}>{t('dashboard.tgBotTitle')}</h3>
        </div>
        <p style={styles.settingsTelegramDesc}>{t('dashboard.tgBotDesc')}</p>
        <div style={{ background: 'rgba(122, 47, 47, 0.06)', border: '1px solid rgba(122, 47, 47, 0.15)', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#5a3a2a' }}>
            <span style={{ fontWeight: '800', color: '#7A2F2F', minWidth: '20px' }}>1.</span>
            <span>{t('dashboard.tgStep1')} <a href="https://t.me/sblcz_Bot" target="_blank" rel="noreferrer" style={{ color: '#7A2F2F', fontWeight: '700', textDecoration: 'none' }}>@sblcz_Bot</a></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#5a3a2a' }}>
            <span style={{ fontWeight: '800', color: '#7A2F2F', minWidth: '20px' }}>2.</span>
            <span>{t('dashboard.tgStep2')} <code style={{ background: 'rgba(122,47,47,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>/start</code></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#5a3a2a' }}>
            <span style={{ fontWeight: '800', color: '#7A2F2F', minWidth: '20px' }}>3.</span>
            <span>{t('dashboard.tgStep3')}</span>
          </div>
        </div>
        {profile?.telegram_chat_id ? (
          <div style={styles.settingsTelegramLinked}>
            <div style={styles.settingsTelegramStatus}>
              <span style={styles.settingsTelegramDot} />
              <span style={styles.settingsTelegramStatusText}>{t('dashboard.tgLinked')}: <strong>{profile.telegram_chat_id}</strong></span>
            </div>
            <button onClick={onUnlinkTelegram} style={styles.settingsUnlinkBtn}>{t('dashboard.unlinkTgBtn')}</button>
          </div>
        ) : (
          <form onSubmit={onLinkTelegram} style={styles.settingsTelegramForm}>
            <div style={styles.settingsTelegramInputRow}>
              <input type="text" required placeholder={t('dashboard.tgPlaceholder')} style={{ ...styles.modalInput, flex: 1 }} value={telegramId} onChange={(e) => setTelegramId(e.target.value)} />
              <button type="submit" style={styles.settingsSubmitBtn}>{t('dashboard.linkTgBtn')}</button>
            </div>
          </form>
        )}
      </div>

      {/* Настройки уведомлений */}
      <div style={styles.settingsCard}>
        <div style={styles.settingsCardHeader}>
          <span style={styles.settingsCardIcon}>🔔</span>
          <h3 style={styles.settingsCardTitle}>{t('dashboard.notificationSettingsTitle')}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '14px', color: '#7A2F2F', fontWeight: '700', marginBottom: '10px' }}>{t('dashboard.notifyChannels')}</h4>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#5a3a2a', fontWeight: '600' }}>
                <input type="checkbox" checked={notifySettings.notify_email} onChange={(e) => onNotifyChange({ ...notifySettings, notify_email: e.target.checked })} style={{ accentColor: '#7A2F2F', transform: 'scale(1.2)' }} />
                {t('dashboard.notifyEmail')}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#5a3a2a', fontWeight: '600' }}>
                <input type="checkbox" checked={notifySettings.notify_telegram} onChange={(e) => onNotifyChange({ ...notifySettings, notify_telegram: e.target.checked })} style={{ accentColor: '#7A2F2F', transform: 'scale(1.2)' }} />
                {t('dashboard.notifyTelegram')}
              </label>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '14px', color: '#7A2F2F', fontWeight: '700', marginBottom: '10px' }}>{t('dashboard.notifyIntervals')}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
              {['14d', '7d', '3d', '1d', '12h', '3h', '1h'].map(interval => (
                <label key={interval} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#5a3a2a', background: 'rgba(122,47,47,0.04)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(122,47,47,0.1)' }}>
                  <input type="checkbox" checked={notifySettings.notify_intervals.includes(interval)} onChange={() => toggleInterval(interval)} style={{ accentColor: '#7A2F2F', transform: 'scale(1.2)' }} />
                  {t(`dashboard.int${interval}`)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '14px', color: '#7A2F2F', fontWeight: '700', marginBottom: '10px' }}>{t('dashboard.notifyLang')}</h4>
            <select style={{ ...styles.modalSelect, width: '200px' }} value={notifySettings.notify_language} onChange={(e) => onNotifyChange({ ...notifySettings, notify_language: e.target.value })}>
              <option value="cs">Čeština</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
              <option value="ukr">Українська</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}

export default SettingsTab;
