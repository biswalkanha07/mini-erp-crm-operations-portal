import React from 'react';
import './LandingPage.css';
import { ErpLogoIcon } from '../components/common/ErpLogo';
import {
  FiUsers,
  FiDatabase,
  FiShield,
  FiBarChart2,
  FiLock,
  FiCloud,
  FiArrowRight,
  FiPackage,
  FiLayers,
  FiFileText,
  FiCheck
} from 'react-icons/fi';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="erp-landing-wrapper">
      {/* ==================================================================
          1. HEADER
          ================================================================== */}
      <header className="erp-header">
        <div className="erp-container">
          <div className="erp-header-inner">
            {/* Left: ERP&CRM portal Brand */}
            <div 
              className="erp-brand"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title="ERP&CRM portal"
            >
              <ErpLogoIcon size={38} />
              <div className="erp-brand-titles">
                <span className="erp-brand-main">ERP&CRM portal</span>
                <span className="erp-brand-sub">Operations Portal</span>
              </div>
            </div>

            {/* Right: Login & Register Actions */}
            <div className="erp-header-nav">
              <button 
                type="button" 
                className="erp-nav-login"
                onClick={onLogin}
                id="header-login-btn"
              >
                Login
              </button>
              <button 
                type="button" 
                className="erp-nav-register"
                onClick={onRegister}
                id="header-register-btn"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================================
          2. HERO SECTION WITH RICH SVG BACKGROUND EFFECTS & IMAGE MOCKUP
          ================================================================== */}
      <section className="erp-hero">
        {/* Rich SVG & Lighting Background Effects */}
        <div className="erp-hero-bg-effects" aria-hidden="true">
          {/* Vector SVG Background Canvas */}
          <svg 
            className="erp-hero-svg-canvas" 
            viewBox="0 0 1440 800" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="heroSvgWave1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.16" />
                <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.07" />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="heroSvgWave2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.14" />
                <stop offset="60%" stopColor="#c7d2fe" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="heroTechLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.0" />
                <stop offset="30%" stopColor="#2563eb" stopOpacity="0.25" />
                <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>
              <pattern id="heroGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2563eb" strokeWidth="0.8" strokeOpacity="0.07" />
                <circle cx="40" cy="40" r="1.5" fill="#2563eb" fillOpacity="0.14" />
              </pattern>
            </defs>

            {/* 1. Geometric Grid Canvas */}
            <rect width="100%" height="100%" fill="url(#heroGridPattern)" />

            {/* 2. Flowing Architectural Curved Wave Ribbons */}
            <path 
              d="M -80 180 C 260 120, 580 340, 960 210 C 1220 130, 1400 260, 1560 180 L 1560 800 L -80 800 Z" 
              fill="url(#heroSvgWave1)" 
            />
            <path 
              d="M -80 290 C 240 220, 520 440, 920 330 C 1180 260, 1420 380, 1560 300 L 1560 800 L -80 800 Z" 
              fill="url(#heroSvgWave2)" 
            />

            {/* 3. Smooth Dynamic Tech Accent Vector Lines */}
            <path 
              d="M -40 230 Q 380 140, 820 280 T 1500 200" 
              stroke="url(#heroTechLine)" 
              strokeWidth="1.8" 
              strokeDasharray="6 8" 
              fill="none" 
            />
            <path 
              d="M -40 360 Q 480 260, 920 400 T 1500 320" 
              stroke="url(#heroTechLine)" 
              strokeWidth="1.2" 
              strokeDasharray="4 6" 
              fill="none" 
            />

            {/* 4. Coordinate Tech Crosshairs */}
            <g stroke="#3b82f6" strokeWidth="1.2" strokeOpacity="0.45">
              <line x1="120" y1="80" x2="140" y2="80" />
              <line x1="130" y1="70" x2="130" y2="90" />
              <line x1="680" y1="130" x2="700" y2="130" />
              <line x1="690" y1="120" x2="690" y2="140" />
              <line x1="1260" y1="90" x2="1280" y2="90" />
              <line x1="1270" y1="80" x2="1270" y2="100" />
            </g>

            {/* 5. Glowing Ambient Lighting Circles */}
            <circle cx="1140" cy="300" r="300" fill="#2563eb" fillOpacity="0.08" />
            <circle cx="1140" cy="300" r="200" fill="#60a5fa" fillOpacity="0.06" />
            <circle cx="160" cy="240" r="220" fill="#818cf8" fillOpacity="0.06" />
          </svg>

          {/* Ambient Lighting Orbs */}
          <div className="erp-hero-glow-right"></div>
          <div className="erp-hero-glow-left"></div>
        </div>

        <div className="erp-container">
          <div className="erp-hero-grid">
            
            {/* LEFT COLUMN: Copy & CTA */}
            <div className="erp-hero-left">
              <div className="erp-eyebrow">
                OPERATIONS, SIMPLIFIED.
              </div>

              <h1 className="erp-headline">
                Run Your Business.
                <span className="erp-headline-accent">Keep Everything in Control.</span>
              </h1>

              <p className="erp-support-text">
                Manage customers, inventory, stock movements, sales challans and
                daily operations from one secure workspace.
              </p>

              <button 
                type="button" 
                className="erp-cta-btn"
                onClick={onLogin}
                id="hero-primary-cta-btn"
              >
                <span>Login to Operations Portal</span>
                <FiArrowRight size={18} className="erp-cta-arrow" />
              </button>

              {/* Role Indicator */}
              <div className="erp-role-indicator">
                <div className="erp-role-icon-box">
                  <FiUsers size={20} />
                </div>
                <div className="erp-role-text">
                  <span className="erp-role-label">Built for</span>
                  <div className="erp-role-list">
                    <span>Admin</span>
                    <span className="erp-role-divider">|</span>
                    <span>Sales</span>
                    <span className="erp-role-divider">|</span>
                    <span>Warehouse</span>
                    <span className="erp-role-divider">|</span>
                    <span>Accounts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Operations Overview Floating Image Mockup */}
            <div className="erp-hero-right">
              {/* Decorative Dot Matrix - Top Right */}
              <svg className="erp-dots-top-right" width="100" height="70" viewBox="0 0 100 70" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="2.2" fill="#94a3b8" />
                <circle cx="30" cy="10" r="2.2" fill="#94a3b8" />
                <circle cx="50" cy="10" r="2.2" fill="#94a3b8" />
                <circle cx="70" cy="10" r="2.2" fill="#94a3b8" />
                <circle cx="90" cy="10" r="2.2" fill="#94a3b8" />
                
                <circle cx="10" cy="30" r="2.2" fill="#94a3b8" />
                <circle cx="30" cy="30" r="2.2" fill="#94a3b8" />
                <circle cx="50" cy="30" r="2.2" fill="#94a3b8" />
                <circle cx="70" cy="30" r="2.2" fill="#94a3b8" />
                <circle cx="90" cy="30" r="2.2" fill="#94a3b8" />

                <circle cx="10" cy="50" r="2.2" fill="#94a3b8" />
                <circle cx="30" cy="50" r="2.2" fill="#94a3b8" />
                <circle cx="50" cy="50" r="2.2" fill="#94a3b8" />
                <circle cx="70" cy="50" r="2.2" fill="#94a3b8" />
                <circle cx="90" cy="50" r="2.2" fill="#94a3b8" />
              </svg>

              {/* Decorative Dot Matrix - Left */}
              <svg className="erp-dots-left" width="50" height="90" viewBox="0 0 50 90" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="2.2" fill="#94a3b8" />
                <circle cx="30" cy="10" r="2.2" fill="#94a3b8" />
                <circle cx="10" cy="30" r="2.2" fill="#94a3b8" />
                <circle cx="30" cy="30" r="2.2" fill="#94a3b8" />
                <circle cx="10" cy="50" r="2.2" fill="#94a3b8" />
                <circle cx="30" cy="50" r="2.2" fill="#94a3b8" />
                <circle cx="10" cy="70" r="2.2" fill="#94a3b8" />
                <circle cx="30" cy="70" r="2.2" fill="#94a3b8" />
              </svg>

              {/* High-Definition Dashboard Preview Frame with User's Image */}
              <div className="erp-dashboard-image-frame" aria-label="ERP&CRM portal Operations Overview Preview">
                {/* Window Top Controls */}
                <div className="erp-image-frame-header">
                  <div className="erp-window-controls">
                    <span className="erp-window-dot erp-window-dot-red"></span>
                    <span className="erp-window-dot erp-window-dot-amber"></span>
                    <span className="erp-window-dot erp-window-dot-green"></span>
                  </div>
                  <div className="erp-window-title">
                    <span className="erp-window-lock-icon"><FiLock size={10} /></span>
                    erp-crm-portal.app/operations
                  </div>
                  <div className="erp-badge-status">
                    <span className="erp-status-dot-wrap">
                      <span className="erp-status-dot-pulse"></span>
                      <span className="erp-status-dot"></span>
                    </span>
                    <span>All systems operational</span>
                  </div>
                </div>

                {/* Dashboard Image Body */}
                <div className="erp-image-frame-body">
                  <img 
                    src="/hero-dashboard-preview.png" 
                    onError={(e) => {
                      // Fallback to exact path with encoded spaces if needed
                      (e.currentTarget as HTMLImageElement).src = '/ChatGPT Image Sep 3, 2026, 12_28_07 AM.png';
                    }}
                    alt="Operations Overview Dashboard - Real-time summary of business operations" 
                    className="erp-hero-dashboard-img"
                    loading="eager"
                  />
                  <div className="erp-image-glass-glare"></div>
                </div>

                {/* Floating Operational Status Badge */}
                <div className="erp-floating-sync-badge">
                  <span className="erp-floating-sync-dot"></span>
                  <span>100% Operational • Neon DB Active</span>
                </div>
              </div>
            </div>

          </div>

          {/* ================================================================
              BOTTOM HERO VALUE STRIP (4 Items)
              ================================================================ */}
          <div className="erp-value-strip-section">
            <div className="erp-value-strip-grid">
              {/* Item 1: Centralized Operations */}
              <div className="erp-value-item">
                <div className="erp-value-icon erp-value-icon-blue">
                  <FiShield size={20} />
                </div>
                <div className="erp-value-content">
                  <span className="erp-value-title">Centralized Operations</span>
                  <span className="erp-value-sub">All modules in one place</span>
                </div>
              </div>

              {/* Item 2: Real-time Insights */}
              <div className="erp-value-item">
                <div className="erp-value-icon erp-value-icon-green">
                  <FiBarChart2 size={20} />
                </div>
                <div className="erp-value-content">
                  <span className="erp-value-title">Real-time Insights</span>
                  <span className="erp-value-sub">Live data, better decisions</span>
                </div>
              </div>

              {/* Item 3: Secure & Reliable */}
              <div className="erp-value-item">
                <div className="erp-value-icon erp-value-icon-purple">
                  <FiLock size={20} />
                </div>
                <div className="erp-value-content">
                  <span className="erp-value-title">Secure & Reliable</span>
                  <span className="erp-value-sub">Role-based access control</span>
                </div>
              </div>

              {/* Item 4: Cloud Powered */}
              <div className="erp-value-item">
                <div className="erp-value-icon erp-value-icon-amber">
                  <FiCloud size={20} />
                </div>
                <div className="erp-value-content">
                  <span className="erp-value-title">Cloud Powered</span>
                  <span className="erp-value-sub">Access anywhere, anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          3. PLATFORM FEATURES SECTION (SCROLL DOWN)
          ================================================================== */}
      <section className="erp-feature-section" id="features">
        <div className="erp-container">
          <div className="erp-section-header">
            <div className="erp-section-tag">Platform Features</div>
            <h2 className="erp-section-title">Everything Your Operations Team Needs</h2>
            <p className="erp-section-desc">
              Streamline customers, inventory, stock operations, sales challans,
              and business workflows from one centralized operations platform.
            </p>
          </div>

          <div className="erp-feature-grid">
            {/* Feature 1 */}
            <div className="erp-feature-card">
              <div className="erp-feature-icon-wrap">
                <FiUsers size={22} />
              </div>
              <h3 className="erp-feature-title">1. Customer & CRM</h3>
              <p className="erp-feature-desc">
                Manage customers, follow-ups and business relationships with interaction logs, sales history, and contact records.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="erp-feature-card">
              <div className="erp-feature-icon-wrap">
                <FiPackage size={22} />
              </div>
              <h3 className="erp-feature-title">2. Inventory Management</h3>
              <p className="erp-feature-desc">
                Track products, stock levels, minimum stock alerts, and warehouse locations with integrated barcode printing and lookup.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="erp-feature-card">
              <div className="erp-feature-icon-wrap">
                <FiLayers size={22} />
              </div>
              <h3 className="erp-feature-title">3. Stock Operations</h3>
              <p className="erp-feature-desc">
                Maintain transparent stock movement and audit history with strict IN/OUT ledger recording and non-negative stock enforcement.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="erp-feature-card">
              <div className="erp-feature-icon-wrap">
                <FiFileText size={22} />
              </div>
              <h3 className="erp-feature-title">4. Sales Challans</h3>
              <p className="erp-feature-desc">
                Create, manage and confirm multi-product sales challans with atomic stock deduction and immutable historical snapshot pricing.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="erp-feature-card">
              <div className="erp-feature-icon-wrap">
                <FiShield size={22} />
              </div>
              <h3 className="erp-feature-title">5. Role-Based Access</h3>
              <p className="erp-feature-desc">
                Give Admin, Sales, Warehouse and Accounts users the right access with hardened server-side RBAC and route protection.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="erp-feature-card">
              <div className="erp-feature-icon-wrap">
                <FiBarChart2 size={22} />
              </div>
              <h3 className="erp-feature-title">6. Operations Dashboard</h3>
              <p className="erp-feature-desc">
                Monitor important business activity from one place with real-time KPI metrics, stock alerts, and recent transaction records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          4. ROLE-BASED WORKFLOW SECTION
          ================================================================== */}
      <section className="erp-role-section">
        <div className="erp-container">
          <div className="erp-section-header">
            <div className="erp-section-tag">Dedicated Workspaces</div>
            <h2 className="erp-section-title">Built for Every Operations Role</h2>
            <p className="erp-section-desc">
              Tailored views and permissions give each operations specialist exactly what they need to execute efficiently.
            </p>
          </div>

          <div className="erp-role-grid">
            {/* Admin */}
            <div className="erp-role-card erp-role-admin">
              <span className="erp-role-badge">Executive</span>
              <h3 className="erp-role-name">Admin</h3>
              <p className="erp-role-focus">Complete operational control</p>
              <ul className="erp-role-duties">
                <li><FiCheck size={14} /> Full system administration</li>
                <li><FiCheck size={14} /> User management & roles</li>
                <li><FiCheck size={14} /> Organization configurations</li>
                <li><FiCheck size={14} /> Comprehensive analytics</li>
              </ul>
            </div>

            {/* Sales */}
            <div className="erp-role-card erp-role-sales">
              <span className="erp-role-badge">Commercial</span>
              <h3 className="erp-role-name">Sales</h3>
              <p className="erp-role-focus">Customers, follow-ups and sales challans</p>
              <ul className="erp-role-duties">
                <li><FiCheck size={14} /> CRM customer relationship log</li>
                <li><FiCheck size={14} /> Create & confirm challans</li>
                <li><FiCheck size={14} /> Real-time stock visibility</li>
                <li><FiCheck size={14} /> Follow-up task reminders</li>
              </ul>
            </div>

            {/* Warehouse */}
            <div className="erp-role-card erp-role-warehouse">
              <span className="erp-role-badge">Logistics</span>
              <h3 className="erp-role-name">Warehouse</h3>
              <p className="erp-role-focus">Inventory and stock operations</p>
              <ul className="erp-role-duties">
                <li><FiCheck size={14} /> Stock IN/OUT adjustments</li>
                <li><FiCheck size={14} /> Product catalogue & barcodes</li>
                <li><FiCheck size={14} /> Warehouse aisle/shelf tracking</li>
                <li><FiCheck size={14} /> Low-stock alert monitoring</li>
              </ul>
            </div>

            {/* Accounts */}
            <div className="erp-role-card erp-role-accounts">
              <span className="erp-role-badge">Finance</span>
              <h3 className="erp-role-name">Accounts</h3>
              <p className="erp-role-focus">Sales, challans and financial visibility</p>
              <ul className="erp-role-duties">
                <li><FiCheck size={14} /> Sales challan audit records</li>
                <li><FiCheck size={14} /> Inventory value estimations</li>
                <li><FiCheck size={14} /> Invoices & financial sales</li>
                <li><FiCheck size={14} /> Read-only compliance audit</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          5. TRUST / VALUE SECTION
          ================================================================== */}
      <section className="erp-trust-section">
        <div className="erp-container">
          <div className="erp-trust-banner">
            <h2 className="erp-trust-title">One Platform. Complete Operational Visibility.</h2>
            <p className="erp-trust-desc">
              Engineered for wholesale and distribution enterprises requiring high reliability,
              auditable stock ledgers, and secure role-based collaboration.
            </p>

            <div className="erp-trust-points">
              <div className="erp-trust-point">
                <div className="erp-trust-point-icon"><FiDatabase size={22} /></div>
                <div className="erp-trust-point-heading">Centralized Operations</div>
                <p className="erp-trust-point-sub">
                  Consolidate all business data into a single, unified operations database with robust organization isolation.
                </p>
              </div>

              <div className="erp-trust-point">
                <div className="erp-trust-point-icon"><FiBarChart2 size={22} /></div>
                <div className="erp-trust-point-heading">Real-Time Inventory Visibility</div>
                <p className="erp-trust-point-sub">
                  Every challan, adjustment, and checkout updates ledger stock atomically with zero risk of negative balances.
                </p>
              </div>

              <div className="erp-trust-point">
                <div className="erp-trust-point-icon"><FiLock size={22} /></div>
                <div className="erp-trust-point-heading">Secure Role-Based Access</div>
                <p className="erp-trust-point-sub">
                  Strict cryptographic token validation and server-side RBAC safeguards proprietary enterprise data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          6. FINAL CTA SECTION
          ================================================================== */}
      <section className="erp-final-cta-section">
        <div className="erp-container">
          <div className="erp-final-cta-box">
            <h2 className="erp-final-cta-title">Ready to Simplify Your Operations?</h2>
            <p className="erp-final-cta-text">
              Access your operations portal and manage your business from one centralized workspace.
            </p>
            <div className="erp-final-cta-buttons">
              <button 
                type="button" 
                className="erp-cta-btn" 
                onClick={onLogin}
                id="final-login-btn"
              >
                <span>Login</span>
                <FiArrowRight size={17} className="erp-cta-arrow" />
              </button>
              <button 
                type="button" 
                className="erp-nav-register" 
                style={{ padding: '15px 30px', fontSize: '16px', borderRadius: '12px' }}
                onClick={onRegister}
                id="final-register-btn"
              >
                <span>Register</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          7. MINIMAL ENTERPRISE FOOTER
          ================================================================== */}
      <footer className="erp-footer">
        <div className="erp-container">
          <div className="erp-footer-inner">
            <div className="erp-footer-brand-info">
              <div className="erp-footer-brand-top">
                <ErpLogoIcon size={24} />
                <span className="erp-footer-title">ERP&CRM portal</span>
              </div>
              <span className="erp-footer-subtitle">Operations Portal</span>
              <p className="erp-footer-desc">
                Wholesale & Distribution Management System
              </p>
            </div>

            <div className="erp-footer-copyright">
              © 2026 ERP&CRM portal. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
