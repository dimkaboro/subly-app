import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import styles from './dashboardStyles';

function SubModal({ mode, sub, onClose, onSubmit, error }) {
  const { t } = useLanguage();
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);
  const [isCancelHovered, setIsCancelHovered] = useState(false);

  const isAdd = mode === 'add';
  const title    = isAdd ? t('dashboard.modalAddTitle')  : t('dashboard.modalEditTitle');
  const subtitle = isAdd ? t('dashboard.modalAddSub')    : t('dashboard.modalEditSub');
  const emoji    = isAdd ? '✨' : '✏️';
  const btnLabel = isAdd ? t('dashboard.btnSaveAdd')     : t('dashboard.btnSaveEdit');

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>

        <div style={styles.modalHeader}>
          <div style={styles.modalIconCircle}>
            <span style={styles.modalIconEmoji}>{emoji}</span>
          </div>
          <h3 style={styles.modalTitle}>{title}</h3>
          <p style={styles.modalSubtitle}>{subtitle}</p>
        </div>

        <div style={styles.modalDivider} />

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(198, 40, 40, 0.08)', color: '#c62828', borderRadius: '8px', margin: '16px 36px 0', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(198, 40, 40, 0.2)' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={styles.modalForm}>

          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>
              <span style={styles.fieldIcon}>🏷️</span> {t('dashboard.modalName')}
            </label>
            <input
              type="text" required style={styles.modalInput}
              value={sub.name}
              onChange={(e) => onSubChange({ ...sub, name: e.target.value })}
            />
          </div>

          <div style={styles.fieldRow}>
            <div style={{ ...styles.fieldGroup, flex: 2 }}>
              <label style={styles.fieldLabel}>
                <span style={styles.fieldIcon}>💰</span> {t('dashboard.modalPrice')}
              </label>
              <input
                type="number" placeholder="0" required style={styles.modalInput}
                value={sub.price}
                onChange={(e) => onSubChange({ ...sub, price: e.target.value })}
              />
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.fieldLabel}>
                <span style={styles.fieldIcon}>💱</span> {t('dashboard.modalCurrency')}
              </label>
              <select style={styles.modalSelect} value={sub.currency} onChange={(e) => onSubChange({ ...sub, currency: e.target.value })}>
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
            <select style={styles.modalSelect} value={sub.cycle} onChange={(e) => onSubChange({ ...sub, cycle: e.target.value })}>
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
              value={sub.nextPayment}
              onChange={(e) => { onSubChange({ ...sub, nextPayment: e.target.value }); }}
            />
          </div>

          <div style={styles.modalActions}>
            <button
              type="button"
              style={{ ...styles.modalBtnCancel, ...(isCancelHovered ? styles.modalBtnCancelHover : {}) }}
              onMouseEnter={() => setIsCancelHovered(true)}
              onMouseLeave={() => setIsCancelHovered(false)}
              onClick={onClose}
            >
              {t('dashboard.btnCancel')}
            </button>
            <button
              type="submit"
              style={{ ...styles.modalBtnSubmit, ...(isSubmitHovered ? styles.modalBtnSubmitHover : {}) }}
              onMouseEnter={() => setIsSubmitHovered(true)}
              onMouseLeave={() => setIsSubmitHovered(false)}
            >
              {btnLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// onSubChange нужен для обновления данных — прокидываем через props
// Экспортируем отдельно для Add и Edit
export function AddSubModal({ sub, onSubChange, onClose, onSubmit, error }) {
  const { t } = useLanguage();
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);
  const [isCancelHovered, setIsCancelHovered] = useState(false);

  return (
    <div style={styles.modalOverlay} onClick={() => onClose()}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalIconCircle}><span style={styles.modalIconEmoji}>✨</span></div>
          <h3 style={styles.modalTitle}>{t('dashboard.modalAddTitle')}</h3>
          <p style={styles.modalSubtitle}>{t('dashboard.modalAddSub')}</p>
        </div>
        <div style={styles.modalDivider} />
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(198, 40, 40, 0.08)', color: '#c62828', borderRadius: '8px', margin: '16px 36px 0', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(198, 40, 40, 0.2)' }}>
            <span>⚠️</span> {error}
          </div>
        )}
        <form onSubmit={onSubmit} style={styles.modalForm}>
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}><span style={styles.fieldIcon}>🏷️</span> {t('dashboard.modalName')}</label>
            <input type="text" required style={styles.modalInput} value={sub.name} onChange={(e) => onSubChange({ ...sub, name: e.target.value })} />
          </div>
          <div style={styles.fieldRow}>
            <div style={{ ...styles.fieldGroup, flex: 2 }}>
              <label style={styles.fieldLabel}><span style={styles.fieldIcon}>💰</span> {t('dashboard.modalPrice')}</label>
              <input type="number" placeholder="0" required style={styles.modalInput} value={sub.price} onChange={(e) => onSubChange({ ...sub, price: e.target.value })} />
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.fieldLabel}><span style={styles.fieldIcon}>💱</span> {t('dashboard.modalCurrency')}</label>
              <select style={styles.modalSelect} value={sub.currency} onChange={(e) => onSubChange({ ...sub, currency: e.target.value })}>
                <option value="CZK">CZK</option><option value="EUR">EUR</option><option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}><span style={styles.fieldIcon}>🔄</span> {t('dashboard.modalCycle')}</label>
            <select style={styles.modalSelect} value={sub.cycle} onChange={(e) => onSubChange({ ...sub, cycle: e.target.value })}>
              <option value="Měsíčně">{t('dashboard.optMonth')}</option>
              <option value="Ročně">{t('dashboard.optYear')}</option>
            </select>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}><span style={styles.fieldIcon}>📅</span> {t('dashboard.modalNext')}</label>
            <input type="date" required style={styles.modalInput} value={sub.nextPayment} onChange={(e) => onSubChange({ ...sub, nextPayment: e.target.value })} />
          </div>
          <div style={styles.modalActions}>
            <button type="button" style={{ ...styles.modalBtnCancel, ...(isCancelHovered ? styles.modalBtnCancelHover : {}) }} onMouseEnter={() => setIsCancelHovered(true)} onMouseLeave={() => setIsCancelHovered(false)} onClick={onClose}>{t('dashboard.btnCancel')}</button>
            <button type="submit" style={{ ...styles.modalBtnSubmit, ...(isSubmitHovered ? styles.modalBtnSubmitHover : {}) }} onMouseEnter={() => setIsSubmitHovered(true)} onMouseLeave={() => setIsSubmitHovered(false)}>{t('dashboard.btnSaveAdd')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditSubModal({ sub, onSubChange, onClose, onSubmit, error }) {
  const { t } = useLanguage();
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);
  const [isCancelHovered, setIsCancelHovered] = useState(false);

  return (
    <div style={styles.modalOverlay} onClick={() => onClose()}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalIconCircle}><span style={styles.modalIconEmoji}>✏️</span></div>
          <h3 style={styles.modalTitle}>{t('dashboard.modalEditTitle')}</h3>
          <p style={styles.modalSubtitle}>{t('dashboard.modalEditSub')}</p>
        </div>
        <div style={styles.modalDivider} />
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(198, 40, 40, 0.08)', color: '#c62828', borderRadius: '8px', margin: '16px 36px 0', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(198, 40, 40, 0.2)' }}>
            <span>⚠️</span> {error}
          </div>
        )}
        <form onSubmit={onSubmit} style={styles.modalForm}>
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}><span style={styles.fieldIcon}>🏷️</span> {t('dashboard.modalName')}</label>
            <input type="text" required style={styles.modalInput} value={sub.name} onChange={(e) => onSubChange({ ...sub, name: e.target.value })} />
          </div>
          <div style={styles.fieldRow}>
            <div style={{ ...styles.fieldGroup, flex: 2 }}>
              <label style={styles.fieldLabel}><span style={styles.fieldIcon}>💰</span> {t('dashboard.modalPrice')}</label>
              <input type="number" placeholder="0" required style={styles.modalInput} value={sub.price} onChange={(e) => onSubChange({ ...sub, price: e.target.value })} />
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.fieldLabel}><span style={styles.fieldIcon}>💱</span> {t('dashboard.modalCurrency')}</label>
              <select style={styles.modalSelect} value={sub.currency} onChange={(e) => onSubChange({ ...sub, currency: e.target.value })}>
                <option value="CZK">CZK</option><option value="EUR">EUR</option><option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}><span style={styles.fieldIcon}>🔄</span> {t('dashboard.modalCycle')}</label>
            <select style={styles.modalSelect} value={sub.cycle} onChange={(e) => onSubChange({ ...sub, cycle: e.target.value })}>
              <option value="Měsíčně">{t('dashboard.optMonth')}</option>
              <option value="Ročně">{t('dashboard.optYear')}</option>
            </select>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}><span style={styles.fieldIcon}>📅</span> {t('dashboard.modalNext')}</label>
            <input type="date" required style={styles.modalInput} value={sub.nextPayment} onChange={(e) => onSubChange({ ...sub, nextPayment: e.target.value })} />
          </div>
          <div style={styles.modalActions}>
            <button type="button" style={{ ...styles.modalBtnCancel, ...(isCancelHovered ? styles.modalBtnCancelHover : {}) }} onMouseEnter={() => setIsCancelHovered(true)} onMouseLeave={() => setIsCancelHovered(false)} onClick={onClose}>{t('dashboard.btnCancel')}</button>
            <button type="submit" style={{ ...styles.modalBtnSubmit, ...(isSubmitHovered ? styles.modalBtnSubmitHover : {}) }} onMouseEnter={() => setIsSubmitHovered(true)} onMouseLeave={() => setIsSubmitHovered(false)}>{t('dashboard.btnSaveEdit')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
