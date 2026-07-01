// src/components/common/PageLoader.js — Reusable loading states
import React from 'react';

/**
 * Full-page centered spinner
 */
export const PageLoader = ({ message = 'Loading...' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16 }}>
    <div className="spinner-border" style={{ color: 'var(--primary-light)', width: 44, height: 44 }}></div>
    <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{message}</div>
  </div>
);

/**
 * Inline small spinner for buttons / table rows
 */
export const InlineLoader = () => (
  <span className="spinner-border spinner-border-sm" style={{ color: 'var(--primary-light)' }}></span>
);

/**
 * Empty state placeholder
 */
export const EmptyState = ({ icon = 'bi-inbox', title = 'No data found', subtitle, action }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
    <i className={`bi ${icon}`} style={{ fontSize: '3rem', color: 'var(--border)', display: 'block', marginBottom: 16 }}></i>
    <h6 style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>{title}</h6>
    {subtitle && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>{subtitle}</p>}
    {action}
  </div>
);

/**
 * Error / alert banner
 */
export const AlertBanner = ({ type = 'danger', message, onDismiss }) => {
  if (!message) return null;
  const icons = { danger: 'bi-exclamation-circle', success: 'bi-check-circle', warning: 'bi-exclamation-triangle', info: 'bi-info-circle' };
  return (
    <div className={`alert alert-${type} d-flex align-items-center gap-2 py-2 px-3`} style={{ borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>
      <i className={`bi ${icons[type] || icons.danger}`}></i>
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && <button className="btn-close" style={{ fontSize: '0.8rem' }} onClick={onDismiss}></button>}
    </div>
  );
};

/**
 * Stat card component
 */
export const StatCard = ({ icon, value, label, colorClass, sublabel, to }) => {
  const content = (
    <div className={`stat-card ${colorClass}`} style={{ cursor: to ? 'pointer' : 'default' }}>
      <div className="stat-icon"><i className={`bi ${icon}`}></i></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sublabel && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{sublabel}</div>}
    </div>
  );
  if (to) {
    const { Link } = require('react-router-dom');
    return <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link>;
  }
  return content;
};

export default PageLoader;
