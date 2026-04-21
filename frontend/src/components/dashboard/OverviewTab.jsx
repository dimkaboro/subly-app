import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import styles from './dashboardStyles';

function OverviewTab({ subscriptions, totalMonthly, nextPaymentInfo, onAddClick, onEdit, onDelete }) {
  const { t } = useLanguage();

  return (
    <>
      <header style={styles.header}>
        <h2 style={styles.pageTitle}>{t('dashboard.prehledTitle')}</h2>
        <button style={styles.addButton} onClick={onAddClick}>{t('dashboard.addBtn')}</button>
      </header>

      {/* Сводка */}
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
                  <p style={styles.subDetails}>
                    {sub.cycle === 'Měsíčně' ? t('dashboard.optMonth') : (sub.cycle === 'Ročně' ? t('dashboard.optYear') : sub.cycle)}
                    {' • '}{t('dashboard.nextPaymentLabel')} {sub.nextPayment}
                  </p>
                </div>
                <div style={styles.subPriceAction}>
                  <span style={styles.price}>{sub.price} {sub.currency}</span>
                  <div style={styles.actions}>
                    <button style={styles.actionBtn} onClick={() => onEdit(sub)}>✏️</button>
                    <button style={styles.actionBtn} onClick={() => onDelete(sub.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default OverviewTab;
