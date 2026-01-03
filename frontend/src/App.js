import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MemoriesPage from './pages/MemoriesPage';
import PoliciesPage from './pages/PoliciesPage';
import MemoryDetailPage from './pages/MemoryDetailPage';
import ComplianceReviewPage from './pages/ComplianceReviewPage';
import IssuesPage from './pages/IssuesPage';
import Sidebar from './components/Sidebar';
import ModeSelector from './components/ModeSelector';
import { ToastProvider } from './components/Toast';
import { JobProvider } from './context/JobContext';
import './App.css';

function NavbarContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('compliance');
  const [returnUrl, setReturnUrl] = useState('/issues');

  // Sync with ComplianceReviewPage state
  useEffect(() => {
    if (location.pathname.startsWith('/compliance/') && window.complianceReviewState) {
      setActiveTab(window.complianceReviewState.activeTab);
      setReturnUrl(window.complianceReviewState.returnUrl || '/issues');
    }
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Dispatch event to ComplianceReviewPage
    window.dispatchEvent(new CustomEvent('complianceTabChange', { detail: { tab } }));
  };

  const getNavbarContent = () => {
    if (location.pathname === '/issues') {
      return (
        <>
          <div className="navbar-left-with-back">
            <button
              className="back-arrow-button"
              onClick={() => navigate('/')}
              title="Back to Dashboard"
            >
              &lt;
            </button>
            <div className="navbar-title-section">
              <h1>Issues</h1>
              <p className="navbar-description">Session Evaluations</p>
            </div>
          </div>
          <div className="navbar-right">
            <span className="navbar-timestamp">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </>
      );
    } else if (location.pathname.startsWith('/compliance/')) {
      // Compliance review page - from Issues
      return (
        <>
          <div className="navbar-left-with-back">
            <button
              className="back-arrow-button"
              onClick={() => navigate(returnUrl)}
              title="Back to Issues"
            >
              &lt;
            </button>
            <div className="navbar-title-section" id="compliance-review-title">
              <h1>Compliance Review</h1>
              <p className="navbar-description">Order Management Agent</p>
            </div>
          </div>
          <div className="navbar-right">
            <div className="navbar-tabs">
              <button
                className={`navbar-tab ${activeTab === 'compliance' ? 'active' : ''}`}
                onClick={() => handleTabChange('compliance')}
              >
                Summary
              </button>
              <button
                className={`navbar-tab ${activeTab === 'messages' ? 'active' : ''}`}
                onClick={() => handleTabChange('messages')}
              >
                Messages
              </button>
              <button
                className={`navbar-tab ${activeTab === 'toolflow' ? 'active' : ''}`}
                onClick={() => handleTabChange('toolflow')}
              >
                Tool Flow
              </button>
              <button
                className={`navbar-tab ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => handleTabChange('info')}
              >
                More Info
              </button>
            </div>
            <span className="navbar-timestamp">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </>
      );
    } else if (location.pathname.startsWith('/memories/')) {
      // Memory detail page - shows raw agent instance messages
      return (
        <>
          <div className="navbar-left-with-back">
            <button
              className="back-arrow-button"
              onClick={() => navigate('/memories')}
              title="Back to Sessions"
            >
              &lt;
            </button>
            <div className="navbar-title-section" id="memory-detail-title">
              <h1>Session</h1>
              <p className="navbar-description">Order Management Agent</p>
            </div>
          </div>
          <div className="navbar-right">
            <span className="navbar-timestamp">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </>
      );
    } else if (location.pathname === '/policies') {
      return (
        <>
          <div className="navbar-left-with-back">
            <button
              className="back-arrow-button"
              onClick={() => navigate('/')}
              title="Back to Dashboard"
            >
              &lt;
            </button>
            <div className="navbar-title-section">
              <h1>Policy Management</h1>
              <p className="navbar-description">Define and manage compliance policies using the composite policy builder</p>
            </div>
          </div>
          <div className="navbar-right">
            <span className="navbar-timestamp">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </>
      );
    } else if (location.pathname === '/memories') {
      return (
        <>
          <div className="navbar-left-with-back">
            <button
              className="back-arrow-button"
              onClick={() => navigate('/')}
              title="Back to Dashboard"
            >
              &lt;
            </button>
            <div className="navbar-title-section">
              <h1>Sessions</h1>
              <p className="navbar-description">Order Management Agent</p>
            </div>
          </div>
          <div className="navbar-right">
            <span className="navbar-timestamp">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="navbar-left">
            <h1>Order Management Agent</h1>
            <p className="navbar-description">Ensures accurate order processing and inventory management</p>
          </div>
          <div className="navbar-right">
            <ModeSelector />
            <span className="navbar-timestamp">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </>
      );
    }
  };

  const showSidebar = location.pathname === '/';

  return (
    <nav className="navbar">
      <div className={showSidebar ? "navbar-content" : "navbar-content-full"}>
        {getNavbarContent()}
      </div>
    </nav>
  );
}

function AppContent() {
  const location = useLocation();
  const showSidebar = location.pathname === '/';

  return (
    <div className="App">
      <NavbarContent />
      {showSidebar && <Sidebar />}

      <div className={showSidebar ? "main-content" : "main-content-full"}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/memories" element={<MemoriesPage />} />
          <Route path="/memories/:id" element={<MemoryDetailPage />} />
          <Route path="/compliance/:id" element={<ComplianceReviewPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/issues" element={<IssuesPage />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <JobProvider>
        <Router>
          <AppContent />
        </Router>
      </JobProvider>
    </ToastProvider>
  );
}

export default App;
