import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { complianceAPI, memoryAPI, agentVariantsAPI, agentsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useToast } from '../components/Toast';
import CreateAgentModal from '../components/CreateAgentModal';
import GenerateSessionsModal from '../components/GenerateSessionsModal';

const TIME_SLOTS = [
  { label: '12 AM', start: 0, end: 3 },
  { label: '4 AM', start: 4, end: 7 },
  { label: '8 AM', start: 8, end: 11 },
  { label: '12 PM', start: 12, end: 15 },
  { label: '4 PM', start: 16, end: 19 },
  { label: '8 PM', start: 20, end: 23 },
];

function buildSessionActivity(memories) {
  const daysLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timestamps = memories
    .map(m => ({ ts: m.metadata?.timestamp, id: m.id }))
    .filter(m => !!m.ts)
    .map(m => ({ date: new Date(m.ts), id: m.id }));

  // Initialize empty grid helper
  const emptyGrid = () =>
    TIME_SLOTS.map(slot => {
      const row = { time: slot.label };
      daysLabels.forEach(d => (row[d] = { count: 0, ids: [] }));
      return row;
    });

  if (!timestamps.length) {
    return emptyGrid();
  }

  // Oldest session determines week, but align to Monday start
  const oldest = timestamps.reduce((min, entry) => (entry.date < min.date ? entry : min), timestamps[0]);
  const weekStart = new Date(oldest.date);
  const utcDay = weekStart.getUTCDay(); // 0=Sun, 1=Mon
  const diffToMonday = utcDay === 0 ? 6 : utcDay - 1;
  weekStart.setUTCDate(weekStart.getUTCDate() - diffToMonday);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const grid = emptyGrid();

  const findSlot = (hour) => {
    for (let i = 0; i < TIME_SLOTS.length; i++) {
      const slot = TIME_SLOTS[i];
      if (hour >= slot.start && hour <= slot.end) return i;
    }
    return 0;
  };

  timestamps.forEach(entry => {
    const ts = entry.date;
    if (ts < weekStart || ts >= weekEnd) return;
    const dayIndex = Math.floor((ts - weekStart) / (24 * 60 * 60 * 1000));
    if (dayIndex < 0 || dayIndex > 6) return;
    const dayLabel = daysLabels[dayIndex];
    const slotIndex = findSlot(ts.getUTCHours());
    const cell = grid[slotIndex][dayLabel] || { count: 0, ids: [] };
    cell.count += 1;
    cell.ids = [...cell.ids, entry.id];
    grid[slotIndex][dayLabel] = cell;
  });

  return grid;
}

function Dashboard({ mode = 'observability' }) {
  const { agentId } = useParams();
  const location = useLocation();
  const isDesignMode = mode === 'design' || location.pathname === '/design';
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toolUsageData, setToolUsageData] = useState([]);
  const [toolUsageLoading, setToolUsageLoading] = useState(false);
  const [variants, setVariants] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsSortField, setVariantsSortField] = useState('session_count');
  const [variantsSortDir, setVariantsSortDir] = useState('desc');
  const [sessionActivity, setSessionActivity] = useState([]);

  // Agent list state (for agent selection mode)
  const [agents, setAgents] = useState([]);
  const [deletingAgent, setDeletingAgent] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [showGenerateSessionsModal, setShowGenerateSessionsModal] = useState(false);
  const [selectedAgentForGeneration, setSelectedAgentForGeneration] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();


  // Load agents list (for agent selection mode)
  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await agentsAPI.list();
      setAgents(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle agent deletion
  const handleDeleteAgent = async () => {
    if (!deletingAgent) return;

    try {
      const response = await agentsAPI.delete(deletingAgent.id);
      toast.success(`Agent "${deletingAgent.name}" deleted successfully`, 'Deleted');
      setShowDeleteDialog(false);
      setDeletingAgent(null);
      await loadAgents();
    } catch (err) {
      toast.error(`Failed to delete agent: ${err.message}`, 'Error');
    }
  };

  const openDeleteDialog = (e, agent) => {
    e.stopPropagation(); // Prevent card click navigation
    setDeletingAgent(agent);
    setShowDeleteDialog(true);
  };

  // Fetch sessions once to drive both tool usage and session activity
  const fetchSessionsData = useCallback(async (agentId) => {
    if (!agentId) return;  // Skip if no agentId
    setToolUsageLoading(true);
    const toolCounts = {};

    try {
      // Fetch all memories with their processing status
      const memoriesResponse = await memoryAPI.list(agentId);
      const memories = memoriesResponse.data;

      if (!memories || memories.length === 0) {
        setToolUsageData([]);
        return;
      }

      // Only count tools from processed sessions (sessions evaluated against at least one policy)
      const processedMemories = memories.filter(m => m.processing_status?.is_processed);

      if (processedMemories.length === 0) {
        setToolUsageData([]);
        setSessionActivity(buildSessionActivity([]));
        return;
      }

      // Extract tool usage from processed sessions
      processedMemories.forEach(memory => {
        if (memory.messages && Array.isArray(memory.messages)) {
          memory.messages.forEach(message => {
            if (message.role === 'assistant' && Array.isArray(message.content)) {
              message.content.forEach(block => {
                if (block.type === 'tool_use') {
                  const entry = toolCounts[block.name] || { value: 0, ids: [] };
                  entry.value += 1;
                  entry.ids.push(memory.id);
                  toolCounts[block.name] = entry;
                }
              });
            }
          });
        }
      });

      // Convert to array and sort by count
      const toolData = Object.entries(toolCounts)
        .map(([name, value]) => ({ name, value: value.value, ids: value.ids }))
        .sort((a, b) => b.value - a.value);

      setToolUsageData(toolData);

      // Build session activity heatmap based on timestamps of processed sessions
      const activity = buildSessionActivity(processedMemories);
      setSessionActivity(activity);
    } catch (err) {
      console.error('Error fetching tool usage:', err);
      setToolUsageData([]);
      setSessionActivity(buildSessionActivity([]));
    } finally {
      setToolUsageLoading(false);
    }
  }, []);

  // Fetch agent variants
  const fetchVariants = useCallback(async (agentId) => {
    if (!agentId) return;  // Skip if no agentId
    setVariantsLoading(true);
    try {
      const response = await agentVariantsAPI.list(agentId);
      setVariants(response.data.variants || []);
    } catch (err) {
      console.error('Error fetching agent variants:', err);
      setVariants([]);
    } finally {
      setVariantsLoading(false);
    }
  }, []);

  // Load compliance summary
  const loadSummary = useCallback(async (agentId) => {
    if (!agentId) return;  // Skip if no agentId
    try {
      setLoading(true);
      const response = await complianceAPI.getSummary(agentId);
      setSummary(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all dashboard data
  const loadAllData = useCallback(async (agentId) => {
    if (!agentId) return;
    await Promise.all([
      loadSummary(agentId),
      fetchSessionsData(agentId),
      fetchVariants(agentId)
    ]);
  }, [loadSummary, fetchSessionsData, fetchVariants]);

  // Load data on mount - either agent list or dashboard data
  useEffect(() => {
    if (!agentId) {
      // Agent selection mode - load agents list
      loadAgents();
    } else {
      // Agent-specific dashboard mode - load dashboard data
      loadAllData(agentId);
    }
  }, [agentId, loadAgents, loadAllData]);

  // Refresh data when page becomes visible (user returns from another tab/page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!agentId) {
          loadAgents();
        } else {
          loadAllData(agentId);
        }
      }
    };

    // Also refresh when window gains focus
    const handleFocus = () => {
      if (!agentId) {
        loadAgents();
      } else {
        loadAllData(agentId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [agentId, loadAgents, loadAllData]);

  // Agent selection mode - show agent list
  if (!agentId) {
    if (loading) return <div className="loading">Loading agents...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
      <div className="dashboard">
        {/* Create Agent Button */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end', paddingRight: '2rem', minHeight: '42px' }}>
          {isDesignMode && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateAgentModal(true)}
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.938rem', fontWeight: 600 }}
            >
              + Create New Agent
            </button>
          )}
        </div>

        <div className="agent-grid">
          {agents.map(agent => (
            <div
              key={agent.id}
              className="agent-card"
              onClick={() => navigate(`/${agent.id}/dashboard`)}
            >
              <div className="agent-card-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>{agent.name}</h2>
                    <span className="agent-id">{agent.id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', visibility: isDesignMode ? 'visible' : 'hidden' }}>
                    {isDesignMode && (
                      <>
                        <button
                          className="icon-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgentForGeneration(agent);
                            setShowGenerateSessionsModal(true);
                          }}
                          title="Generate sessions"
                        >
                          ✨
                        </button>
                        <button
                          className="icon-button"
                          onClick={(e) => openDeleteDialog(e, agent)}
                          title="Delete agent"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="agent-card-body">
                <div className="agent-stat">
                  <span className="stat-label">Sessions</span>
                  <span className="stat-value">{agent.session_count}</span>
                </div>
                {agent.use_case && (
                  <div className="agent-description-snippet" style={{ marginTop: '0.5rem', color: '#6c757d', fontSize: '0.875rem', lineHeight: 1.4 }}>
                    {agent.use_case.slice(0, 120)}{agent.use_case.length > 120 ? '…' : ''}
                  </div>
                )}
              </div>
              <div className="agent-card-footer">
                <button className="btn btn-primary" style={{ width: '100%' }}>
                  View Dashboard →
                </button>
              </div>
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="empty-state">
            <h3>No agents found</h3>
            <p>Create agent directories in <code>agent_data/</code> to get started.</p>
          </div>
        )}

        {/* Delete confirmation dialog */}
        {showDeleteDialog && deletingAgent && (
          <div className="modal-overlay" onClick={() => setShowDeleteDialog(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Agent</h3>
              <p>
                Are you sure you want to delete <strong>{deletingAgent.name}</strong>?
              </p>
              <p style={{ color: '#d9534f', marginTop: '1rem' }}>
                This will permanently delete:
              </p>
              <ul style={{ textAlign: 'left', marginLeft: '2rem', color: '#666' }}>
                <li>All {deletingAgent.session_count} session files</li>
                <li>All policies</li>
                <li>All compliance evaluations</li>
                <li>All agent variants and patterns</li>
                <li>The agent directory</li>
              </ul>
              <p style={{ color: '#d9534f', fontWeight: 'bold', marginTop: '1rem' }}>
                This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeletingAgent(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteAgent}
                >
                  Delete Agent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Agent Modal */}
        {isDesignMode && showCreateAgentModal && (
          <CreateAgentModal
            onClose={() => setShowCreateAgentModal(false)}
            onSuccess={() => loadAgents()}
          />
        )}

        {/* Generate Sessions Modal */}
        {isDesignMode && showGenerateSessionsModal && selectedAgentForGeneration && (
          <GenerateSessionsModal
            agentId={selectedAgentForGeneration.id}
            agentName={selectedAgentForGeneration.name}
            agentDescription={selectedAgentForGeneration.use_case || selectedAgentForGeneration.description}
            onClose={() => {
              setShowGenerateSessionsModal(false);
              setSelectedAgentForGeneration(null);
            }}
            onJobSubmitted={(jobId) => {
              console.log('Session generation job started:', jobId);
              // Job progress tracking handled by GlobalJobContext
            }}
          />
        )}
      </div>
    );
  }

  // Agent-specific dashboard mode
  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!summary) return null;

  const chartData = Object.entries(summary.compliance_by_policy).map(([policyId, policy]) => {
    const nonCompliantCount = policy.total_count - policy.compliant_count;
    const data = {
      policyId: parseInt(policyId, 10),
      name: policy.name,
      compliant: policy.compliant_count,
      nonCompliant: nonCompliantCount,
      total: policy.total_count,
      severity: policy.severity
    };

    return data;
  });

  // Handle bar click - navigate to issues with filter
  const handleBarClick = (data, segment) => {
    if (!data || !data.policyId) return;

    const params = new URLSearchParams();
    params.set('policy', data.policyId.toString());

    // If clicking non-compliant segment, filter to show sessions that FAILED this policy
    if (segment === 'nonCompliant' && data.nonCompliant > 0) {
      params.set('policyStatus', 'violated');
    } else if (segment === 'compliant' && data.compliant > 0) {
      params.set('policyStatus', 'passed');
    }

    navigate(`/${agentId}/issues?${params.toString()}`);
  };

  const compliantCount = summary.all_memories ? summary.all_memories.filter(m => m.is_compliant).length : 0;
  const nonCompliantCount = summary.all_memories ? summary.all_memories.filter(m => !m.is_compliant).length : 0;
  const llmTotals = summary.llm_usage_totals || {
    total_calls: 0,
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    cost_usd: 0
  };

  const formatCost = (value) => {
    if (value === null || value === undefined) return '$0.00';
    if (value < 0.01 && value > 0) return `$${value.toFixed(4)}`;
    return `$${value.toFixed(2)}`;
  };


  // Tool usage colors
  const TOOL_COLORS = ['#5a7a95', '#81b29a', '#daa65d', '#7ba3c7', '#8a9199'];

  // Custom legend component for Policy Compliance chart
  // Using organic, muted tones consistent with the pie chart palette
  const renderCustomLegend = () => {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1.5rem',
        marginTop: '1rem',
        fontSize: '0.813rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#81b29a', borderRadius: '2px' }}></div>
          <span>Compliant</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#d97373', borderRadius: '2px' }}></div>
          <span>Error</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#daa65d', borderRadius: '2px' }}></div>
          <span>Warning</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#7ba3c7', borderRadius: '2px' }}></div>
          <span>Info</span>
        </div>
      </div>
    );
  };

  // Get activity level color for heatmap
  const getActivityColor = (cell) => {
    const value = cell?.count || 0;
    if (value === 0) return '#f0f0f0';
    if (value < 5) return '#d4e5f1';
    if (value < 10) return '#a8cbe3';
    if (value < 20) return '#6da3c7';
    if (value < 30) return '#4a7fa6';
    return '#2d5a7f';
  };

  // Get max sessions for Wednesday peak
  const getMaxSessions = () => {
    let max = 0;
    sessionActivity.forEach(row => {
      ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(day => {
        const count = row[day]?.count || 0;
        if (count > max) max = count;
      });
    });
    return max;
  };

  const handleActivityClick = (dayLabel, row) => {
    const cell = row[dayLabel];
    if (!cell || !cell.count || !cell.ids || cell.ids.length === 0) return;
    const params = new URLSearchParams();
    params.set('memories', cell.ids.join(','));
    navigate(`/${agentId}/issues?${params.toString()}`);
  };

  const handleToolClick = (toolEntry) => {
    if (!toolEntry || !toolEntry.ids || toolEntry.ids.length === 0) return;
    const params = new URLSearchParams();
    params.set('memories', toolEntry.ids.join(','));
    navigate(`/${agentId}/issues?${params.toString()}`);
  };

  const maxSessions = getMaxSessions();

  // Sort variants
  const sortedVariants = [...variants].sort((a, b) => {
    const aVal = a[variantsSortField];
    const bVal = b[variantsSortField];
    if (variantsSortDir === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const handleVariantsSort = (field) => {
    if (variantsSortField === field) {
      setVariantsSortDir(variantsSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setVariantsSortField(field);
      setVariantsSortDir('desc');
    }
  };

  const getSortIcon = (field) => {
    if (variantsSortField !== field) return '◇';
    return variantsSortDir === 'asc' ? '△' : '▽';
  };

  return (
    <div className="dashboard">
      <div className="metrics-bar">
        <div className="metrics-row">
          <div className="metric-item">
            <span className="metric-value">{summary.processed_memories || 0}</span>
            <span className="metric-label">Sessions</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <span className="metric-value">{summary.total_policies}</span>
            <span className="metric-label">Policies</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <span className="metric-value compliant">{compliantCount}</span>
            <span className="metric-label">Compliant</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <span className={`metric-value ${nonCompliantCount > 0 ? 'non-compliant' : 'compliant'}`}>{nonCompliantCount}</span>
            <span className="metric-label">Non-Compliant</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <span className="metric-value">{llmTotals.total_calls}</span>
            <span className="metric-label">LLM Calls</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <span className="metric-value">{formatCost(llmTotals.cost_usd)}</span>
            <span className="metric-label">LLM Cost (est)</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate(`/${agentId}/memories`)}>
          Sessions
        </button>
      </div>

      {/* 4-Quadrant Layout */}
      <div className="dashboard-quadrants">
        {/* Upper Left - Policy Compliance Chart */}
        <div className="quadrant">
          <div className="card">
            <div className="card-header-with-actions">
              <h3>Policy compliance</h3>
              <div className="card-actions">
                <button className="btn btn-primary" onClick={() => navigate(`/${agentId}/issues`)}>
                  Manage issues
                </button>
                <button className="btn btn-primary" onClick={() => navigate(`/${agentId}/policies`)}>
                  Manage policies
                </button>
              </div>
            </div>
            <p className="card-subtitle">Track the agent's adherence to safety and policy rules across sessions.</p>
            {chartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280} key="compliance-chart-v2">
                  <BarChart data={chartData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    {/* Organic, muted colors consistent with pie chart palette */}
                    <Bar
                      dataKey="compliant"
                      stackId="a"
                      name="Compliant"
                      isAnimationActive={false}
                      onClick={(data) => handleBarClick(data, 'compliant')}
                      style={{ cursor: 'pointer' }}
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`compliant-${index}`} fill="#81b29a" />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="nonCompliant"
                      stackId="a"
                      name="Non-Compliant"
                      isAnimationActive={false}
                      onClick={(data) => handleBarClick(data, 'nonCompliant')}
                      style={{ cursor: 'pointer' }}
                    >
                      {chartData.map((entry, index) => {
                        const severityColors = {
                          error: '#d97373',
                          warning: '#daa65d',
                          info: '#7ba3c7'
                        };
                        const color = severityColors[entry.severity] || '#d97373';
                        return <Cell key={`non-compliant-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {renderCustomLegend()}
              </>
            ) : (
              <div className="empty-state">
                <h3>No evaluations yet</h3>
                <p>Upload sessions and run compliance evaluations to see results</p>
              </div>
            )}
          </div>
        </div>

        {/* Upper Right - Agent Variants */}
        <div className="quadrant">
          <div className="card">
            <div className="card-header-with-actions">
              <h3>Agent variants</h3>
              <div className="card-actions">
                <button className="btn btn-primary" onClick={() => navigate(`/${agentId}/variants-flow`)}>
                  View variant flows
                </button>
              </div>
            </div>
            <p className="card-subtitle">Unique tool usage patterns identified across sessions.</p>
            {variantsLoading ? (
              <div className="loading">Loading variants...</div>
            ) : sortedVariants.length > 0 ? (
              <div className="variants-table-container">
                <table className="variants-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleVariantsSort('name')} className="sortable">
                        Agent variant {getSortIcon('name')}
                      </th>
                      <th onClick={() => handleVariantsSort('session_count')} className="sortable">
                        Sessions {getSortIcon('session_count')}
                      </th>
                      <th onClick={() => handleVariantsSort('percentage')} className="sortable">
                        % of all {getSortIcon('percentage')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVariants.map(variant => (
                      <tr key={variant.id}>
                        <td className="variant-name">{variant.name}</td>
                        <td className="variant-sessions">{variant.session_count}</td>
                        <td className="variant-percentage">{variant.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <h3>No patterns detected</h3>
                <p>Upload sessions to analyze tool usage patterns</p>
              </div>
            )}
          </div>
        </div>

        {/* Lower Left - Session Activity */}
        <div className="quadrant">
          <div className="card">
            <h3>Session activity</h3>
            <p className="card-subtitle">Wednesday is the busiest day with {maxSessions} sessions, peaking from 8 AM to 4 PM at {maxSessions} sessions per hour.</p>
            <div className="heatmap-container">
              <div className="heatmap-legend">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#636e72' }}>
                  <span>More activity</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#2d5a7f' }}></div>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#4a7fa6' }}></div>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#6da3c7' }}></div>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#a8cbe3' }}></div>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#d4e5f1' }}></div>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#f0f0f0' }}></div>
                  </div>
                  <span>Less activity</span>
                </div>
              </div>
              <table className="heatmap-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Mon</th>
                    <th>Tue</th>
                    <th>Wed</th>
                    <th>Thu</th>
                    <th>Fri</th>
                    <th>Sat</th>
                    <th>Sun</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionActivity.map((row, idx) => (
                    <tr key={idx}>
                      <td className="time-label">{row.time}</td>
                      <td
                        style={{ backgroundColor: getActivityColor(row.Mon) }}
                        onClick={() => handleActivityClick('Mon', row)}
                        className={row.Mon?.count ? 'heatmap-cell clickable' : 'heatmap-cell'}
                      >
                        {row.Mon?.count > 0 ? row.Mon.count : ''}
                      </td>
                      <td
                        style={{ backgroundColor: getActivityColor(row.Tue) }}
                        onClick={() => handleActivityClick('Tue', row)}
                        className={row.Tue?.count ? 'heatmap-cell clickable' : 'heatmap-cell'}
                      >
                        {row.Tue?.count > 0 ? row.Tue.count : ''}
                      </td>
                      <td
                        style={{ backgroundColor: getActivityColor(row.Wed) }}
                        onClick={() => handleActivityClick('Wed', row)}
                        className={row.Wed?.count ? 'heatmap-cell clickable' : 'heatmap-cell'}
                      >
                        {row.Wed?.count > 0 ? row.Wed.count : ''}
                      </td>
                      <td
                        style={{ backgroundColor: getActivityColor(row.Thu) }}
                        onClick={() => handleActivityClick('Thu', row)}
                        className={row.Thu?.count ? 'heatmap-cell clickable' : 'heatmap-cell'}
                      >
                        {row.Thu?.count > 0 ? row.Thu.count : ''}
                      </td>
                      <td
                        style={{ backgroundColor: getActivityColor(row.Fri) }}
                        onClick={() => handleActivityClick('Fri', row)}
                        className={row.Fri?.count ? 'heatmap-cell clickable' : 'heatmap-cell'}
                      >
                        {row.Fri?.count > 0 ? row.Fri.count : ''}
                      </td>
                      <td
                        style={{ backgroundColor: getActivityColor(row.Sat) }}
                        onClick={() => handleActivityClick('Sat', row)}
                        className={row.Sat?.count ? 'heatmap-cell clickable' : 'heatmap-cell'}
                      >
                        {row.Sat?.count > 0 ? row.Sat.count : ''}
                      </td>
                      <td
                        style={{ backgroundColor: getActivityColor(row.Sun) }}
                        onClick={() => handleActivityClick('Sun', row)}
                        className={row.Sun?.count ? 'heatmap-cell clickable' : 'heatmap-cell'}
                      >
                        {row.Sun?.count > 0 ? row.Sun.count : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lower Right - Tool Usage */}
        <div className="quadrant">
          <div className="card">
            <h3>Tool usage</h3>
            <p className="card-subtitle">See which tools agents made most calls to across all sessions.</p>
            {toolUsageLoading ? (
              <div className="loading">Loading tool usage data...</div>
            ) : toolUsageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={360}>
                <PieChart>
                  <Pie
                    data={toolUsageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={false}
                    onClick={(_, index) => handleToolClick(toolUsageData[index])}
                  >
                    {toolUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TOOL_COLORS[index % TOOL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <h3>No tool usage data</h3>
                <p>Upload sessions to see tool usage statistics</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
