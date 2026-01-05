import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { agentVariantsAPI } from '../services/api';
import '../styles/VariantsFlowPage.css';

function VariantsFlowPage() {
  const { agentId } = useParams();
  const [transitions, setTransitions] = useState([]);
  const [uniqueTools, setUniqueTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!agentId) return;
      try {
        setLoading(true);
        const res = await agentVariantsAPI.getTransitions(agentId);
        setTransitions(res.data.transitions || []);
        setUniqueTools(res.data.unique_tools || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [agentId]);

  if (loading) return <div className="loading">Loading variants flow...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!transitions.length) {
    return (
      <div className="empty-state">
        <h3>No tool flow data</h3>
        <p>Process sessions to generate aggregated tool flow.</p>
      </div>
    );
  }

  // Build nodes/links for horizontal sankey-like layout
  const nodes = Array.from(new Set(uniqueTools.concat(['_start', '_end']))).map((name, idx) => ({
    id: name,
    index: idx
  }));
  const links = transitions.map(t => ({
    source: t.from_tool,
    target: t.to_tool,
    value: t.count
  }));

  return (
    <div className="variants-flow-page">
      <div className="page-header">
        <h1>Agent Tool Flow</h1>
        <p className="page-subtitle">Aggregated tool transitions across all processed sessions</p>
      </div>
      <div className="flow-legend">
        <div className="legend-item"><span className="legend-node start"></span>Start</div>
        <div className="legend-item"><span className="legend-node end"></span>End</div>
        <div className="legend-item"><span className="legend-link"></span>Transition count</div>
      </div>
      <div className="flow-container">
        {/* Simple horizontal flow render */}
        <div className="flow-nodes">
          {nodes.map(n => (
            <div key={n.id} className={`flow-node ${n.id === '_start' ? 'start' : n.id === '_end' ? 'end' : ''}`}>
              {n.id === '_start' ? 'Start' : n.id === '_end' ? 'End' : n.id}
            </div>
          ))}
        </div>
        <div className="flow-links">
          {links.map((l, idx) => (
            <div key={idx} className="flow-link">
              <span className="flow-link-label">{l.source} → {l.target}</span>
              <span className="flow-link-count">{l.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VariantsFlowPage;
