import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
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

  const sankeyData = useMemo(() => {
    const toolSet = new Set(uniqueTools.concat(['_start', '_end']));
    const nodes = Array.from(toolSet).map(name => ({ name: name === '_start' ? 'Start' : name === '_end' ? 'End' : name }));
    const nameToIndex = Object.fromEntries(nodes.map((n, idx) => [n.name === 'Start' ? '_start' : n.name === 'End' ? '_end' : n.name, idx]));

    const hasPath = (from, to, links) => {
      const adj = {};
      links.forEach(l => {
        if (!adj[l.source]) adj[l.source] = [];
        adj[l.source].push(l.target);
      });
      const stack = [from];
      const seen = new Set();
      while (stack.length) {
        const cur = stack.pop();
        if (cur === to) return true;
        if (seen.has(cur)) continue;
        seen.add(cur);
        (adj[cur] || []).forEach(n => stack.push(n));
      }
      return false;
    };

    const links = [];
    const seen = new Set();

    transitions.forEach(t => {
      // Skip invalid/self links and those that point back to start or originate from end
      if (t.from_tool === t.to_tool) return;
      if (t.from_tool === '_end') return;
      if (t.to_tool === '_start') return;
      const source = nameToIndex[t.from_tool];
      const target = nameToIndex[t.to_tool];
      if (source === undefined || target === undefined) return;
      const key = `${source}-${target}`;
      // Avoid cycles that break Recharts Sankey
      if (hasPath(target, source, links)) return;
      if (seen.has(key)) {
        // accumulate
        const existing = links.find(l => l.source === source && l.target === target);
        if (existing) existing.value += t.count;
      } else {
        seen.add(key);
        links.push({ source, target, value: t.count });
      }
    });

    return { nodes, links };
  }, [uniqueTools, transitions]);

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
      <div className="flow-chart">
        <ResponsiveContainer width="100%" height={500}>
          <Sankey
            data={sankeyData}
            nodePadding={24}
            linkCurvature={0.5}
            layout="horizontal"
            node={{ stroke: '#dfe4e8', strokeWidth: 1 }}
            link={{ stroke: '#7ba3c7' }}
          >
            <Tooltip />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default VariantsFlowPage;
