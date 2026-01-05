import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { agentVariantsAPI } from '../services/api';
import '../styles/VariantsFlowPage.css';

function VariantsFlowPage() {
  const { agentId } = useParams();
  const [transitions, setTransitions] = useState([]);
  const [uniqueTools, setUniqueTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const NODE_WIDTH = 240;
  const NODE_HEIGHT = 78;
  const START_RADIUS = 28;
  const END_RADIUS = 28;

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

  const layout = useMemo(() => {
    // Build node list from unique tools + any tool names present in transitions
    const nodeIds = new Set(['_start', '_end']);
    uniqueTools.forEach(t => nodeIds.add(t));
    transitions.forEach(t => {
      nodeIds.add(t.from_tool);
      nodeIds.add(t.to_tool);
    });

    const nodes = Array.from(nodeIds).map(name => ({
      id: name,
      label: name === '_start' ? 'Start' : name === '_end' ? 'End' : name
    }));

    // Combine duplicate links and ignore no-op/invalid edges
    const linkMap = new Map();
    transitions
      .filter(t => t.from_tool !== t.to_tool && t.from_tool !== '_end' && t.to_tool !== '_start')
      .forEach(t => {
        const key = `${t.from_tool}→${t.to_tool}`;
        const existing = linkMap.get(key) || { from: t.from_tool, to: t.to_tool, value: 0 };
        existing.value += t.count;
        linkMap.set(key, existing);
      });
    const links = Array.from(linkMap.values());

    // Assign depth (columns) via BFS from _start
    const depth = {};
    nodes.forEach(n => (depth[n.id] = n.id === '_start' ? 0 : Infinity));
    const queue = ['_start'];
    while (queue.length) {
      const cur = queue.shift();
      const curDepth = depth[cur];
      links
        .filter(l => l.from === cur)
        .forEach(l => {
          if (depth[l.to] > curDepth + 1) {
            depth[l.to] = curDepth + 1;
            queue.push(l.to);
          }
        });
    }

    // Fallback for unreachable nodes and ensure `_end` is rendered to the right
    nodes.forEach(n => {
      if (!isFinite(depth[n.id])) depth[n.id] = 1;
    });
    const maxDepth = Math.max(...Object.values(depth));
    depth['_end'] = Math.max(depth['_end'] || 0, maxDepth + 1);

    // Group nodes by depth to position vertically
    const columns = {};
    nodes.forEach(n => {
      const d = depth[n.id];
      if (!columns[d]) columns[d] = [];
      columns[d].push(n.id);
    });

    const nodePositions = {};
    const colSpacing = 260;
    const rowSpacing = 190;
    Object.entries(columns).forEach(([dStr, ids]) => {
      const d = parseInt(dStr, 10);
      ids.sort((a, b) => a.localeCompare(b));
      ids.forEach((id, idx) => {
        nodePositions[id] = {
          x: d * colSpacing + 80,
          y: idx * rowSpacing + 60
        };
      });
    });

    const svgWidth = (Math.max(...Object.values(depth)) + 2) * colSpacing + 200;
    const svgHeight = Math.max(
      Math.max(...Object.values(columns).map(col => col.length)) * rowSpacing + 160,
      420
    );

    return { nodes, links, nodePositions, svgWidth, svgHeight };
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
      <div className="flow-canvas">
        <svg width={layout.svgWidth} height={layout.svgHeight} viewBox={`0 0 ${layout.svgWidth} ${layout.svgHeight}`}>
          <defs>
            <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#7ba3c7" />
            </marker>
          </defs>
          {layout.links.map((l, idx) => {
            const fromPos = layout.nodePositions[l.from];
            const toPos = layout.nodePositions[l.to];
            if (!fromPos || !toPos) return null;
            const isFromStart = l.from === '_start';
            const isToEnd = l.to === '_end';

            const fromX = isFromStart ? fromPos.x + START_RADIUS * 2 : fromPos.x + NODE_WIDTH;
            const fromY = isFromStart ? fromPos.y + START_RADIUS : fromPos.y + NODE_HEIGHT / 2;
            const toX = isToEnd ? toPos.x : toPos.x;
            const toY = isToEnd ? toPos.y + END_RADIUS : toPos.y + NODE_HEIGHT / 2;

            const midX = (fromX + toX) / 2;
            const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
            return (
              <g key={`link-${idx}`} className="flow-link-path">
                <path
                  d={path}
                  stroke="#7ba3c7"
                  strokeWidth={Math.max(2, Math.log10(l.value + 1))}
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
                <text x={midX} y={(fromPos.y + toPos.y) / 2 + 24} className="flow-count">
                  {l.value}
                </text>
              </g>
            );
          })}

          {layout.nodes.map(n => {
            const pos = layout.nodePositions[n.id];
            if (!pos) return null;
            const isStart = n.id === '_start';
            const isEnd = n.id === '_end';
            const width = NODE_WIDTH;
            const height = NODE_HEIGHT;
            return (
              <g key={n.id} transform={`translate(${pos.x}, ${pos.y})`} className="flow-node">
                {isStart ? (
                  <>
                    <circle cx={START_RADIUS} cy={START_RADIUS} r={START_RADIUS} fill="#e8f3ed" stroke="#81b29a" strokeWidth="2" />
                    <polygon
                      points={`${START_RADIUS - 7},${START_RADIUS - 12} ${START_RADIUS - 7},${START_RADIUS + 12} ${START_RADIUS + 12},${START_RADIUS}`}
                      fill="#3f7f5e"
                    />
                  </>
                ) : isEnd ? (
                  <>
                    <circle cx={END_RADIUS} cy={END_RADIUS} r={END_RADIUS} fill="#fbeaea" stroke="#d97373" strokeWidth="2" />
                    <circle cx={END_RADIUS} cy={END_RADIUS} r={END_RADIUS - 6} fill="#d97373" opacity="0.3" />
                  </>
                ) : (
                  <>
                    <rect
                      width={width}
                      height={height}
                      rx="12"
                      ry="12"
                      fill="#fff"
                      stroke="#dfe4e8"
                      strokeWidth="1"
                    />
                    <text
                      x={width / 2}
                      y={height / 2 - 4}
                      className="flow-node-title flow-node-title-bold"
                      textAnchor="middle"
                    >
                      {n.label}
                    </text>
                    <text
                      x={width / 2}
                      y={height / 2 + 14}
                      className="flow-node-subtitle"
                      textAnchor="middle"
                    >
                      {n.label}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default VariantsFlowPage;
