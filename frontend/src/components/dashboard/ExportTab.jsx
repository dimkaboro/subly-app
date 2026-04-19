import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import styles from './dashboardStyles';

function ExportTab({ subscriptions, totalMonthly }) {
  const { t } = useLanguage();

  const handleDownloadCsv = () => {
    const bom = '\uFEFF';
    const header = `${t('dashboard.colName')};${t('dashboard.colPrice')};${t('dashboard.colCurrency')};${t('dashboard.colCycle')};${t('dashboard.colNext')}\n`;
    const rows = subscriptions.map(s =>
      `${s.name};${s.price};${s.currency};${s.cycle === 'Měsíčně' ? t('dashboard.optMonth') : (s.cycle === 'Ročně' ? t('dashboard.optYear') : s.cycle)};${s.nextPayment}`
    ).join('\n');
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subly_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header style={styles.header}>
        <h2 style={styles.pageTitle}>{t('dashboard.exportTitle')}</h2>
        {subscriptions.length > 0 && (
          <button style={styles.addButton} onClick={handleDownloadCsv}>
            {t('dashboard.downloadCsvBtn')}
          </button>
        )}
      </header>

      {subscriptions.length === 0 ? (
        <div style={styles.chartEmptyState}>
          <span style={{ fontSize: '64px' }}>📄</span>
          <h3 style={{ color: '#7A2F2F', fontSize: '22px', fontWeight: '800', margin: '16px 0 8px' }}>
            {t('dashboard.exportEmptyTitle')}
          </h3>
          <p style={{ color: '#A68E7A', fontSize: '15px', fontWeight: '500' }}>
            {t('dashboard.exportEmptyHint')}
          </p>
        </div>
      ) : (
        <div style={styles.exportSection}>
          <div style={styles.exportInfo}>
            <div style={styles.exportInfoIcon}>📊</div>
            <div>
              <h4 style={styles.exportInfoTitle}>{t('dashboard.exportPreviewTitle')}</h4>
              <p style={styles.exportInfoDesc}>
                {subscriptions.length} {t('dashboard.exportPreviewDesc')} {totalMonthly} {t('dashboard.exportMonthly')}
              </p>
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
                    <td style={styles.exportTd}><span style={styles.exportTdName}>{sub.name}</span></td>
                    <td style={styles.exportTd}><span style={styles.exportTdPrice}>{sub.price}</span></td>
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
  );
}

export default ExportTab;
