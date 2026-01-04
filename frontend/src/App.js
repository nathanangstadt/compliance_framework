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
    const complianceMatch = location.pathname.match(/^\/([^/]+)\/compliance\/(.+)$/);
    if (complianceMatch && window.complianceReviewState) {
      setActiveTab(window.complianceReviewState.activeTab);
      const agentId = complianceMatch[1];
      setReturnUrl(window.complianceReviewState.returnUrl || `/${agentId}/issues`);
    }
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Dispatch event to ComplianceReviewPage
    window.dispatchEvent(new CustomEvent('complianceTabChange', { detail: { tab } }));
  };

  const getNavbarContent = () => {
    // Agent-specific dashboard
    const dashboardMatch = location.pathname.match(/^\/([^/]+)\/dashboard$/);
    if (dashboardMatch) {
      const agentId = dashboardMatch[1];
      const agentName = agentId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

      return (
        <>
          <div className="navbar-left-with-back">
            <button
              className="back-arrow-button"
              onClick={() => navigate('/')}
              title="Back to Agents"
            >
              &lt;
            </button>
            <div className="navbar-title-section">
              <h1>{agentName}</h1>
              <p className="navbar-description">Agent Dashboard</p>
            </div>
          </div>
          <div className="navbar-right">
            <span className="navbar-timestamp">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </>
      );
    }

    // Agent-specific issues page
    const issuesMatch = location.pathname.match(/^\/([^/]+)\/issues$/);
    if (issuesMatch) {
      const agentId = issuesMatch[1];
      const agentName = agentId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return (
        <>
          <div className="navbar-left-with-back">
            <button
              className="back-arrow-button"
              onClick={() => navigate(`/${agentId}/dashboard`)}
              title="Back to Dashboard"
            >
              &lt;
            </button>
            <div className="navbar-title-section">
              <h1>Issues - {agentName}</h1>
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
    }

    // Agent-specific compliance review page
    const complianceMatch = location.pathname.match(/^\/([^/]+)\/compliance\/(.+)$/);
    if (complianceMatch) {
      const agentId = complianceMatch[1];
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
              <p className="navbar-description">Session Detail</p>
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
    }

    // Agent-specific memory detail page
    const memoryDetailMatch = location.pathname.match(/^\/([^/]+)\/memories\/(.+)$/);
    if (memoryDetailMatch) {
      const agentId = memoryDetailMatch[1];
      return (
        <>
          <div className="navbar-left-with-back">
            <button
              className="back-arrow-button"
              onClick={() => navigate(`/${agentId}/memories`)}
              title="Back to Sessions"
            >
              &lt;
            </button>
            <div className="navbar-title-section" id="memory-detail-title">
              <h1>Session</h1>
              <p className="navbar-description">Session Detail</p>
            </div>
          </div>
          <div className="navbar-right">
            <span className="navbar-timestamp">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </>
      );
    }

    // Agent-specific policies page
    const policiesMatch = location.pathname.match(/^\/([^/]+)\/policies$/);
    if (policiesMatch) {
      const agentId = policiesMatch[1];
      const agentName = agentId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return (
        <>
          <div className="navbar-left-with-back">
            <button
              className="back-arrow-button"
              onClick={() => navigate(`/${agentId}/dashboard`)}
              title="Back to Dashboard"
            >
              &lt;
            </button>
            <div className="navbar-title-section">
              <h1>Policy Management - {agentName}</h1>
              <p className="navbar-description">Define and manage compliance policies</p>
            </div>
          </div>
          <div className="navbar-right">
            <span className="navbar-timestamp">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </>
      );
    }

    // Agent-specific memories/sessions page
    const memoriesMatch = location.pathname.match(/^\/([^/]+)\/memories$/);
    if (memoriesMatch) {
      const agentId = memoriesMatch[1];
      const agentName = agentId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return (
        <>
          <div className="navbar-left-with-back">
            <button
              className="back-arrow-button"
              onClick={() => navigate(`/${agentId}/dashboard`)}
              title="Back to Dashboard"
            >
              &lt;
            </button>
            <div className="navbar-title-section">
              <h1>Sessions - {agentName}</h1>
              <p className="navbar-description">Agent Sessions</p>
            </div>
          </div>
          <div className="navbar-right">
            <span className="navbar-timestamp">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </>
      );
    }

    // Default: Agent list at root
    else {
      return (
        <>
          <div className="navbar-left">
            <h1>Agent List</h1>
            <p className="navbar-description">Select an agent to view compliance and policy management</p>
          </div>
          <div className="navbar-right" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
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
  // Show sidebar only on root (/) for agent selection
  const showSidebar = location.pathname === '/';

  return (
    <div className="App">
      <NavbarContent />
      {showSidebar && <Sidebar />}

      <div className={showSidebar ? "main-content" : "main-content-full"}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/:agentId/dashboard" element={<Dashboard />} />
          <Route path="/:agentId/memories" element={<MemoriesPage />} />
          <Route path="/:agentId/memories/:id" element={<MemoryDetailPage />} />
          <Route path="/:agentId/compliance/:id" element={<ComplianceReviewPage />} />
          <Route path="/:agentId/policies" element={<PoliciesPage />} />
          <Route path="/:agentId/issues" element={<IssuesPage />} />
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
