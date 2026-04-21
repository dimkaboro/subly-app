import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, CartesianGrid
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext';
import styles from './dashboardStyles';

const CHART_COLORS = ['#7A2F2F', '#5A6E26', '#C4883C', '#3D6B7E', '#8B5C8B', '#D4785C', '#2E8B57', '#CD853F'];

function ChartsTab({ subscriptions, totalMonthly }) {
  const { t } = useLanguage();

  if (subscriptions.length === 0) {
    return (
      <div style={styles.chartEmptyState}>
        <span style={{ fontSize: '64px' }}>📊</span>
        <h3 style={{ color: '#7A2F2F', fontSize: '22px', fontWeight: '800', margin: '16px 0 8px' }}>
          {t('dashboard.chartEmptyTitle')}
        </h3>
        <p style={{ color: '#A68E7A', fontSize: '15px', fontWeight: '500' }}>
          {t('dashboard.chartEmptyHint')}
        </p>
      </div>
    );
  }

  const maxPrice = subscriptions.reduce((max, s) => Math.max(max, s.price), 0);

  return (
    <>
      <header style={styles.header}>
        <h2 style={styles.pageTitle}>{t('dashboard.grafyTitle')}</h2>
      </header>

      {/* Статистика */}
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

      {/* Два графика */}
      <div style={styles.chartsRow}>
        {/* Donut */}
        <div style={styles.chartCard}>
          <h3 style={styles.sectionTitle}>{t('dashboard.chart1Title')}</h3>
          <p style={styles.chartSubtitle}>{t('dashboard.chart1Sub')}</p>
          <div style={styles.chartContainerSquare}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptions} dataKey="price" nameKey="name"
                  cx="50%" cy="50%" innerRadius={70} outerRadius={120}
                  paddingAngle={3} stroke="none"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {subscriptions.map((_, index) => (
                    <Cell key={`pie-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} CZK`, 'Cena']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontFamily: 'Montserrat, sans-serif', fontWeight: '600' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.legendContainer}>
            {subscriptions.map((sub, index) => (
              <div key={sub.id} style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                <span style={styles.legendLabel}>{sub.name}</span>
                <span style={styles.legendValue}>{sub.price} {sub.currency}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar */}
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
                  {subscriptions.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.barDetailsContainer}>
            {subscriptions.slice().sort((a, b) => b.price - a.price).map((sub, index) => (
              <div key={sub.id} style={styles.barDetailRow}>
                <span style={styles.barDetailRank}>#{index + 1}</span>
                <span style={styles.barDetailName}>{sub.name}</span>
                <div style={styles.barDetailBarBg}>
                  <div style={{ ...styles.barDetailBarFill, width: `${(sub.price / maxPrice) * 100}%` }} />
                </div>
                <span style={styles.barDetailPrice}>{sub.price} {sub.currency}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default ChartsTab;
