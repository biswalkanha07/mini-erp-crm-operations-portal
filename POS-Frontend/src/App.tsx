import React from 'react';
import { FiGrid, FiClipboard, FiBriefcase, FiHome, FiPackage, FiTag, FiShoppingCart, FiSettings, FiBarChart2, FiLogOut, FiPieChart, FiUsers, FiTrendingUp, FiFileText, FiLayers } from 'react-icons/fi';

import './App.css';

import POSInterface from './pages/POSInterface';
import LoginSelector from './components/LoginSelector';
import SignupSelector from './components/SignupSelector';
import ResetPassword from './components/ResetPassword';
import NoticeHeader from './components/NoticeHeader';
import LandingPage from './pages/LandingPage';

import OrganizationModule from './modules/organization/OrganizationModule';
import StoreModule from './modules/store/StoreModule';
import StoreSettings from './modules/store/StoreSettings';
import CategoryModule from './modules/inventory/category/CategoryModule';
import CatalogueModule from './modules/inventory/catalogue/CatalogueModule';
import AdminDashboard from './modules/admin/AdminDashboard';
import AdminOrderRequests from './modules/admin/orders/AdminOrderRequests';
import StoreOrders from './modules/store/orders/StoreOrders';
import SalesModule from './modules/sales/SalesModule';
import StoreDashboard from './modules/store/StoreDashboard';
import BarcodeList from './modules/inventory/catalogue/BarcodeList';
import ReportsModule from './modules/store/reports/ReportsModule';
import StoreCataloguePage from './modules/store/StoreCataloguePage';
import CustomerModule from './modules/crm/CustomerModule';
import StockMovementModule from './modules/inventory/stockMovements/StockMovementModule';
import ChallanModule from './modules/salesChallan/ChallanModule';
import UserManagementModule from './modules/admin/UserManagementModule';
import { ErpLogoIcon } from './components/common/ErpLogo';
import { normalizeRole } from './utils/roleUtils';

type Page = 'admin' | 'admin-orders' | 'pos' | 'organization' | 'store' | 'inventory' | 'category' | 'product' | 'sales' | 'store-orders' | 'barcodes' | 'store-settings' | 'store-dashboard' | 'reports' | 'store-catalogue' | 'admin-promocodes' | 'crm-customers' | 'stock-movements' | 'sales-challans' | 'users';

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'organization' | 'store';
  role: string;
  organization?: any;
  store?: any;
}

function App() {
  const [page, setPage] = React.useState<Page>('admin');
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(localStorage.getItem('token'));
  const [resetToken, setResetToken] = React.useState<string | null>(null);
  const [showNoticeHeader, setShowNoticeHeader] = React.useState<boolean>(true);
  const [showSignup, setShowSignup] = React.useState<boolean>(false);
  const [showLogin, setShowLogin] = React.useState<boolean>(false);
  const [signupStoreId, setSignupStoreId] = React.useState<string | null>(null);
  const [signupEmail, setSignupEmail] = React.useState<string | null>(null);
  const [signupToken, setSignupToken] = React.useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState<boolean>(false);

  // Theme hooks must be after all state declarations
  const [theme, setTheme] = React.useState<string>('light');
  React.useEffect(() => {
    const storeData = localStorage.getItem('store');
    if (storeData) {
      try {
        const store = JSON.parse(storeData);
        if (store.theme) setTheme(store.theme);
      } catch {}
    }
  }, [page]);

  // Listen for theme changes from StoreSettings
  React.useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.theme) setTheme(e.detail.theme);
    };
    window.addEventListener('storeThemeUpdated', handler as EventListener);
    return () => window.removeEventListener('storeThemeUpdated', handler as EventListener);
  }, []);

  // Listen for complete store settings update (e.g., profit margin)
  React.useEffect(() => {
    const handler = (e: any) => {
      try {
        if (e?.detail?.store) {
          localStorage.setItem('store', JSON.stringify(e.detail.store));
        }
      } catch {}
    };
    window.addEventListener('storeSettingsUpdated', handler as EventListener);
    return () => window.removeEventListener('storeSettingsUpdated', handler as EventListener);
  }, []);

  const isOrganizationUser = user?.userType === 'organization';
  const isStoreUser = user?.userType === 'store';
  const canonicalRole = normalizeRole(user?.role || localStorage.getItem('userRole'));
  const isAdmin = isOrganizationUser && canonicalRole === 'Admin';
  const isSales = isOrganizationUser && canonicalRole === 'Sales';
  const isWarehouse = isOrganizationUser && canonicalRole === 'Warehouse';
  const isAccounts = isOrganizationUser && canonicalRole === 'Accounts';

  // Set document title
  React.useEffect(() => {
    document.title = 'ERP&CRM portal';
  }, []);

  // Check if user is logged in on app start
  React.useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // Clear any corrupted data first
    if (storedUser === 'undefined' || storedUser === 'null') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userType');
      return;
    }
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userType');
      }
    }
  }, []);

  const handleLogin = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    setShowLogin(false);
    setShowSignup(false);
    try {
      window.history.replaceState({}, document.title, '/');
    } catch {}
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    localStorage.setItem('userId', userData.id);
    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userType', userData.userType);
    // Set default landing page based on user type
    if (userData.userType === 'store') {
      setPage('pos');
    } else {
      // All ERP Organization users (Admin, Sales, Warehouse, Accounts) land on ERP Dashboard
      setPage('admin');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setShowLogin(false);
    setShowSignup(false);
    try {
      window.history.pushState({}, '', '/');
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userType');
  };

  // Check for reset password token, signup, and login parameters in URL
  React.useEffect(() => {
    console.log('Current URL:', window.location.href);
    console.log('Current search params:', window.location.search);
    console.log('Current pathname:', window.location.pathname);
    
    const urlParams = new URLSearchParams(window.location.search);
    const rawToken = urlParams.get('token');
    const storeId = urlParams.get('storeId');
    const signupEmailParam = urlParams.get('email');
    const actionParam = urlParams.get('action');
    // If storeId or email are present and token is present, treat token as signup token.
    const signupTokenParam = urlParams.get('signupToken') || ((storeId || signupEmailParam) ? rawToken : null);
    const resetTokenParam = (storeId || signupEmailParam) ? null : rawToken;
    const currentPath = window.location.pathname.toLowerCase();
    
    // 1) Reset password takes priority
    if (
      currentPath.includes('/reset-password') ||
      (!!resetTokenParam && !storeId && !signupEmailParam && !signupTokenParam)
    ) {
      console.log('Reset password URL detected with token:', resetTokenParam);
      if (resetTokenParam) {
        localStorage.setItem('resetToken', resetTokenParam);
        setResetToken(resetTokenParam);
      }
      window.history.replaceState({}, document.title, '/');
      return;
    }

    // 2) Signup link (explicit /signup or /register or has storeId or has both email+signupToken or action=register)
    if (
      currentPath.includes('/signup') ||
      currentPath.includes('/register') ||
      actionParam === 'register' ||
      actionParam === 'signup' ||
      storeId ||
      signupEmailParam ||
      signupTokenParam
    ) {
      console.log('Signup URL detected with params:', { storeId, signupEmailParam, signupTokenParam });
      setSignupStoreId(storeId);
      setSignupEmail(signupEmailParam);
      setSignupToken(signupTokenParam);
      setShowSignup(true);
      setShowLogin(false);
      // Ensure we are not considered authenticated while in signup flow
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userType');
      return;
    }

    // 3) Direct login URL (/login or /signin or ?action=login)
    if (
      currentPath.includes('/login') ||
      currentPath.includes('/signin') ||
      actionParam === 'login'
    ) {
      setShowLogin(true);
      setShowSignup(false);
      return;
    }
    
    // 4) Fallback: Check for reset token stored previously
    if (resetTokenParam) {
      console.log('Reset token found in URL (fallback):', resetTokenParam);
      // Store the token for the reset password component
      localStorage.setItem('resetToken', resetTokenParam);
      setResetToken(resetTokenParam);
      // Clean up the URL - redirect to root
      window.history.replaceState({}, document.title, '/');
      console.log('Token stored in localStorage');
    } else {
      // Check if token exists in localStorage (for page refresh)
      const storedToken = localStorage.getItem('resetToken');
      if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
        console.log('Reset token found in localStorage:', storedToken);
        setResetToken(storedToken);
      }
      console.log('No token found in URL');
    }
  }, []);

  // Listen for browser back/forward navigation between landing, login, and signup
  React.useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('/signup') || p.includes('/register')) {
        setShowSignup(true);
        setShowLogin(false);
      } else if (p.includes('/login') || p.includes('/signin')) {
        setShowLogin(true);
        setShowSignup(false);
      } else if (p === '/' || p === '') {
        setShowLogin(false);
        setShowSignup(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToLogin = () => {
    setShowLogin(true);
    setShowSignup(false);
    try {
      window.history.pushState({ view: 'login' }, '', '/login');
    } catch {}
  };

  const navigateToRegister = () => {
    setShowSignup(true);
    setShowLogin(false);
    try {
      window.history.pushState({ view: 'signup' }, '', '/signup');
    } catch {}
  };

  // Guard against invalid page selection for current role
  React.useEffect(() => {
    if (isStoreUser) {
      const allowedStorePages: Page[] = [
        'pos',
        'sales',
        'store-orders',
        'store-settings',
        'store-dashboard',
        'reports',
        'store-catalogue'
      ];
      if (!allowedStorePages.includes(page)) {
        setPage('pos');
      }
      return;
    }

    if (isOrganizationUser) {
      if (isAdmin) {
        if (page === 'pos') setPage('admin');
      } else if (isSales) {
        const allowedSalesPages: Page[] = [
          'admin',
          'crm-customers',
          'sales-challans',
          'product',
          'stock-movements',
          'admin-orders',
          'admin-promocodes',
          'sales'
        ];
        if (!allowedSalesPages.includes(page)) setPage('admin');
      } else if (isWarehouse) {
        const allowedWarehousePages: Page[] = [
          'admin',
          'product',
          'category',
          'stock-movements',
          'barcodes',
          'sales-challans',
          'crm-customers',
          'admin-orders'
        ];
        if (!allowedWarehousePages.includes(page)) setPage('admin');
      } else if (isAccounts) {
        const allowedAccountsPages: Page[] = [
          'admin',
          'sales-challans',
          'crm-customers',
          'product',
          'stock-movements',
          'admin-orders',
          'sales'
        ];
        if (!allowedAccountsPages.includes(page)) setPage('admin');
      }
    }
  }, [isStoreUser, isOrganizationUser, isAdmin, isSales, isWarehouse, isAccounts, page]);

  // Show reset password if token is present (prioritize reset over auth state)
  if (resetToken) {
    return (
      <ResetPassword 
        token={resetToken} 
        onSuccess={() => {
          console.log('Reset password success callback called');
          localStorage.removeItem('resetToken');
          setResetToken(null);
          // Log out to ensure we land on the login page after reset
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userType');
          // Optional: navigate to root
          window.history.replaceState({}, document.title, '/');
        }} 
      />
    );
  }

  // Show signup page if signup URL is detected
  if (showSignup) {
    return (
      <SignupSelector 
        onBackToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
          try {
            window.history.pushState({ view: 'login' }, '', '/login');
          } catch {}
          setSignupStoreId(null);
          setSignupEmail(null);
          setSignupToken(null);
          // Always land on login page: clear any existing auth
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userType');
        }}
        storeId={signupStoreId || null}
        email={signupEmail || null}
        token={signupToken || null}
      />
    );
  }

  // Show login if explicitly requested
  if (showLogin) {
    return <LoginSelector onLogin={handleLogin} />;
  }

  // Show landing page if not authenticated
  if (!user || !token) {
    return (
      <LandingPage 
        onLogin={navigateToLogin} 
        onRegister={navigateToRegister} 
      />
    );
  }

  return (
    <div className={theme === 'dark' ? 'theme-dark app-shell' : 'theme-light app-shell'} style={{ background: theme === 'dark' ? '#111' : '#f5f6fa' }}>
      <aside className={sidebarCollapsed ? 'app-aside collapsed' : 'app-aside'} style={{ 
        background: '#0a174e', 
        color: '#fff',
        padding: '0',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
      }}>
        {/* Header Section */}
        <div style={{ 
          padding: '18px 16px', 
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <ErpLogoIcon size={38} />
            <div className="nav-text" style={{ display: sidebarCollapsed ? 'none' : 'block' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2', letterSpacing: '-0.2px' }}>ERP&CRM portal</div>
              <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Operations Portal</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="aside-toggle"
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>

        {/* Navigation Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: sidebarCollapsed ? '12px 0' : '20px 0',
          overflowY: 'auto',
          overflowX: 'hidden',
          maxWidth: '100%',
          alignItems: sidebarCollapsed ? 'center' : undefined
        }}>
          {/* Dashboard Section */}
          {isOrganizationUser && (isAdmin || isSales || isAccounts || isWarehouse) && (
            <div style={{ padding: sidebarCollapsed ? '0 8px 12px 8px' : '0 20px 20px 20px', width: '100%' }}>
              {(isAdmin || isSales || isAccounts || isWarehouse) && (
                <button style={{
                  width: '100%',
                  margin: '0 0 8px 0',
                  padding: '12px 16px',
                  background: page==='admin' ? '#e53e3e' : 'transparent',
                  color: page==='admin' ? '#fff' : '#ccc',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }} onClick={() => setPage('admin')} title="ERP Dashboard">
                  <FiGrid size={18} />
                  <span className="nav-text">ERP Dashboard</span>
                </button>
              )}
              {(isAdmin || isSales || isAccounts || isWarehouse) && (
                <button style={{
                  width: '100%',
                  margin: '0 0 8px 0',
                  padding: '12px 16px',
                  background: page==='admin-orders' ? '#e53e3e' : 'transparent',
                  color: page==='admin-orders' ? '#fff' : '#ccc',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }} onClick={() => setPage('admin-orders')} title="Order Requests">
                  <FiClipboard size={18} />
                  <span className="nav-text">Order Requests</span>
                </button>
              )}
              {(isAdmin || isSales) && (
                <button style={{
                  width: '100%',
                  margin: '0 0 8px 0',
                  padding: '12px 16px',
                  background: page==='admin-promocodes' ? '#e53e3e' : 'transparent',
                  color: page==='admin-promocodes' ? '#fff' : '#ccc',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }} onClick={() => setPage('admin-promocodes')} title="Promo Codes">
                  <FiTag size={18} />
                  <span className="nav-text">Promo Codes</span>
                </button>
              )}
              {(isAdmin || isSales || isAccounts || isWarehouse) && (
                <button style={{ 
                  width: '100%', 
                  margin: '0 0 8px 0', 
                  padding: '12px 16px', 
                  background: page==='crm-customers' ? '#e53e3e' : 'transparent', 
                  color: page==='crm-customers' ? '#fff' : '#ccc', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  textAlign: 'left' 
                }} onClick={() => setPage('crm-customers')} title="CRM Customers">
                  <FiUsers size={18} />
                  <span className="nav-text">CRM Customers</span>
                </button>
              )}
              {(isAdmin || isSales || isAccounts || isWarehouse) && (
                <button style={{ 
                  width: '100%', 
                  margin: '0 0 8px 0', 
                  padding: '12px 16px', 
                  background: page==='sales-challans' ? '#e53e3e' : 'transparent', 
                  color: page==='sales-challans' ? '#fff' : '#ccc', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease', 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }} onClick={() => setPage('sales-challans')} title="Sales Challans">
                  <FiFileText size={18} />
                  <span className="nav-text">Sales Challans</span>
                </button>
              )}
            </div>
          )}

          {/* Master Data Section - Admin Only */}
          {isOrganizationUser && isAdmin && (
            <div style={{ 
              padding: sidebarCollapsed ? '0 8px 10px 8px' : '0 20px 10px 20px',
              width: '100%'
            }}>
              <div className="section-title" style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#888', 
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '15px'
              }}>
                Administration
              </div>

              <button style={{ 
                width: '100%', 
                margin: '0 0 8px 0', 
                padding: '12px 16px', 
                background: page==='users' ? '#e53e3e' : 'transparent', 
                color: page==='users' ? '#fff' : '#ccc', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontWeight: '500', 
                cursor: 'pointer', 
                transition: 'all 0.2s ease', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                textAlign: 'left' 
              }} onClick={() => setPage('users')} title="User Management">
                <FiUsers size={18} />
                <span className="nav-text">User Management</span>
              </button>

              <button style={{ 
                width: '100%', 
                margin: '0 0 8px 0', 
                padding: '12px 16px', 
                background: page==='organization' ? '#e53e3e' : 'transparent', 
                color: page==='organization' ? '#fff' : '#ccc', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontWeight: '500', 
                cursor: 'pointer', 
                transition: 'all 0.2s ease', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                textAlign: 'left' 
              }} onClick={() => setPage('organization')} title="Organization">
                <FiBriefcase size={18} />
                <span className="nav-text">Organization</span>
              </button>
              <button style={{ 
                width: '100%', 
                margin: '0 0 8px 0', 
                padding: '12px 16px', 
                background: page==='store' ? '#e53e3e' : 'transparent', 
                color: page==='store' ? '#fff' : '#ccc', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontWeight: '500', 
                cursor: 'pointer', 
                transition: 'all 0.2s ease', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                textAlign: 'left' 
              }} onClick={() => setPage('store')} title="Store">
                <FiHome size={18} />
                <span className="nav-text">Store</span>
              </button>
            </div>
          )}
          
          {/* Inventory Section */}
          {isOrganizationUser && (isAdmin || isWarehouse || isSales || isAccounts) && (
          <div style={{ 
            padding: sidebarCollapsed ? '0 8px 10px 8px' : '0 20px 10px 20px',
            width: '100%'
          }}>
            <div className="section-title" style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#888', 
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '15px'
            }}>
              Inventory
            </div>
            {(isAdmin || isWarehouse) && (
              <button style={{ 
                width: '100%', 
                margin: '0 0 8px 0', 
                padding: '12px 16px', 
                background: page==='category' ? '#e53e3e' : 'transparent', 
                color: page==='category' ? '#fff' : '#ccc', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontWeight: '500', 
                cursor: 'pointer', 
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left'
              }} onClick={() => setPage('category')} title="Category">
                <FiGrid size={18} />
                <span className="nav-text">Category</span>
              </button>
            )}
            <button style={{ 
              width: '100%', 
              margin: '0 0 8px 0', 
              padding: '12px 16px', 
              background: page==='product' ? '#e53e3e' : 'transparent', 
              color: page==='product' ? '#fff' : '#ccc', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '14px', 
              fontWeight: '500', 
              cursor: 'pointer', 
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }} onClick={() => setPage('product')} title="Product">
              <FiPackage size={18} />
              <span className="nav-text">Product</span>
            </button>
            <button style={{ 
              width: '100%', 
              margin: '0 0 8px 0', 
              padding: '12px 16px', 
              background: page==='stock-movements' ? '#e53e3e' : 'transparent', 
              color: page==='stock-movements' ? '#fff' : '#ccc', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '14px', 
              fontWeight: '500', 
              cursor: 'pointer', 
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }} onClick={() => setPage('stock-movements')} title="Stock Movements">
              <FiTrendingUp size={18} />
              <span className="nav-text">Stock Movements</span>
            </button>
            {(isAdmin || isWarehouse) && (
              <button style={{
                  width: '100%',
                  margin: '0 0 8px 0',
                  padding: '12px 16px',
                  background: page==='barcodes' ? '#e53e3e' : 'transparent',
                  color: page==='barcodes' ? '#fff' : '#ccc',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }} onClick={() => setPage('barcodes')} title="Barcode List">
                  <FiTag size={18} />
                  <span className="nav-text">Barcode List</span>
              </button>
            )}
          </div>
          )}

          {/* POS Interface */}
          <div style={{ 
            padding: sidebarCollapsed ? '0 8px 10px 8px' : '0 20px 10px 20px',
            width: '100%'
          }}>
            {isStoreUser && (
              <>
                <button style={{
                  width: '100%',
                  margin: '0 0 8px 0',
                  padding: '12px 16px',
                  background: page==='store-dashboard' ? '#e53e3e' : 'transparent',
                  color: page==='store-dashboard' ? '#fff' : '#ccc',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }} onClick={() => setPage('store-dashboard')} title="Store Dashboard">
                  <FiGrid size={18} />
                  <span className="nav-text">Store Dashboard</span>
                </button>
                <button style={{
                  width: '100%',
                  margin: '0 0 8px 0',
                  padding: '12px 16px',
                  background: page==='store-catalogue' ? '#e53e3e' : 'transparent',
                  color: page==='store-catalogue' ? '#fff' : '#ccc',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }} onClick={() => setPage('store-catalogue')} title="Store Catalogue">
                  <FiPackage size={18} />
                  <span className="nav-text">Store Catalogue</span>
                </button>
                <button style={{
                  width: '100%',
                  margin: '0 0 8px 0',
                  padding: '12px 16px',
                  background: page==='pos' ? '#e53e3e' : 'transparent',
                  color: page==='pos' ? '#fff' : '#ccc',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }} onClick={() => setPage('pos')} title="POS Interface">
                  <FiShoppingCart size={18} />
                  <span className="nav-text">POS Interface</span>
                </button>
                <button style={{
                  width: '100%',
                  margin: '0 0 8px 0',
                  padding: '12px 16px',
                  background: page==='store-orders' ? '#e53e3e' : 'transparent',
                  color: page==='store-orders' ? '#fff' : '#ccc',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }} onClick={() => setPage('store-orders')} title="My Orders">
                  <FiClipboard size={18} />
                  <span className="nav-text">My Orders</span>
                </button>
                <button style={{
                  width: '100%',
                  margin: '0 0 8px 0',
                  padding: '12px 16px',
                  background: page==='reports' ? '#e53e3e' : 'transparent',
                  color: page==='reports' ? '#fff' : '#ccc',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }} onClick={() => setPage('reports')} title="Reports">
                  <FiPieChart size={18} />
                  <span className="nav-text">Reports</span>
                </button>
                <button style={{
                  width: '100%',
                  margin: '0 0 8px 0',
                  padding: '12px 16px',
                  background: page==='store-settings' ? '#e53e3e' : 'transparent',
                  color: page==='store-settings' ? '#fff' : '#ccc',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }} onClick={() => setPage('store-settings')} title="Settings">
                  <FiSettings size={18} />
                  <span className="nav-text">Settings</span>
                </button>
              </>
            )}
                       {(isStoreUser || isAdmin || isSales || isAccounts) && (
              <button style={{ 
                width: '100%', 
                margin: '0', 
                padding: '12px 16px', 
                background: page==='sales' ? '#e53e3e' : 'transparent', 
                color: page==='sales' ? '#fff' : '#ccc', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontWeight: '500', 
                cursor: 'pointer', 
                transition: 'all 0.2s ease', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                textAlign: 'left' 
              }} onClick={() => setPage('sales')} title="Sales">
                <FiBarChart2 size={18} />
                <span className="nav-text">Sales</span>
              </button>
            )}
          </div>
        </div>

        {/* User / Logout - Fixed at Bottom */}

        <div style={{
          padding: '10px',
          borderTop: '1px solid #333',
          background: '#0a174e'
        }}>
          {sidebarCollapsed ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleLogout}
                title="Logout"
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  color: '#ccc',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <FiLogOut size={15} />
              </button>
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  background: 'linear-gradient(45deg, #e53e3e, #38a169)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px'
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '1px'
                  }}>
                    {user.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: isAdmin ? '#e53e3e' : isSales ? '#3182ce' : isWarehouse ? '#d69e2e' : isAccounts ? '#38a169' : '#4a5568',
                      color: '#fff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {user.role}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      color: '#888',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {user.userType === 'organization' ? 'Organization' : 'Store'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '5px 10px',
                    background: 'transparent',
                    color: '#888',
                    border: '1px solid #333',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    transition: 'all 0.2s ease',
                    minWidth: '48px'
                  }}
                  onMouseOver={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.background = '#e53e3e';
                    target.style.color = '#fff';
                    target.style.borderColor = '#e53e3e';
                  }}
                  onMouseOut={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.background = 'transparent';
                    target.style.color = '#888';
                    target.style.borderColor = '#333';
                  }}
                >
                  Logout
                </button>
              </div>
              {(user.organization || user.store) && (
                <div style={{
                  fontSize: '10px',
                  color: '#666',
                  paddingLeft: '36px'
                }}>
                  {user.userType === 'store' ? (user.store?.storeName || '') : (user.organization?.organizationName || '')}
                </div>
              )}
            </>
          )}
        </div>
      </aside>
      <main className={sidebarCollapsed ? 'app-main collapsed' : 'app-main'}>
        {/* Notice Header - only on POS interface page */}
        {page === 'pos' && showNoticeHeader && (
          <div style={{ position: 'relative', zIndex: 1000 }}>
            <NoticeHeader 
              autoScroll={true}
              scrollSpeed={15}
              showCloseButton={true}
              onClose={(noticeId) => {
                console.log('Notice closed:', noticeId);
                setShowNoticeHeader(false);
              }}
            />
          </div>
        )}
        {page === 'admin' && <AdminDashboard userRole={user?.role} onNavigate={(p: Page) => setPage(p)} />}
        {page === 'admin-orders' && <AdminOrderRequests />}
        {page === 'admin-promocodes' && <React.Suspense fallback={null}>
          {React.createElement(require('./modules/admin/AdminPromoCodes').default)}
        </React.Suspense>}
        {page === 'store-dashboard' && (
          <StoreDashboard storeId={user.userType === 'store' ? user.store?._id : undefined} />
        )}
        {page === 'store-catalogue' && user.userType === 'store' && (
          <StoreCataloguePage storeId={user.store?._id} />
        )}
        {page === 'pos' && (
          <POSInterface
            storeId={user.userType === 'store' ? user.store?._id : undefined}
            storeName={user.userType === 'store' ? user.store?.storeName : undefined}
          />
        )}
        {page === 'organization' && <OrganizationModule />}
        {page === 'users' && isAdmin && <UserManagementModule />}
        {page === 'store' && <StoreModule user={user} />}
        {page === 'category' && <CategoryModule />}
        {page === 'product' && <CatalogueModule userRole={user?.role} />}
        {page === 'store-orders' && <StoreOrders />}
        {page === 'barcodes' && <BarcodeList />}
        {page === 'sales' && (
          <SalesModule
            storeId={user.userType === 'store' ? user.store?._id : undefined}
          />
        )}
        {page === 'crm-customers' && <CustomerModule userRole={user?.role} />}
        {page === 'stock-movements' && <StockMovementModule userRole={user?.role} />}
        {page === 'sales-challans' && <ChallanModule userRole={user?.role} />}
        {page === 'store-settings' && user.userType === 'store' && (
          <StoreSettings storeId={user.store?._id} />
        )}
        {page === 'reports' && user.userType === 'store' && (
          <ReportsModule storeId={user.store?._id} />
        )}
      </main>
    </div>
  );
}

export default App;
