import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { agentVariantsAPI } from '../services/api';
import ReactFlow, { Background, Controls, MiniMap, MarkerType, Handle, Position } from 'react-flow-renderer';
import 'react-flow-renderer/dist/style.css';
import '../styles/VariantsFlowPage.css';

const FlowNode = ({ data }) => (
  <div className="rf-node-card">
    <Handle type="target" position={Position.Left} className="rf-handle" />
    <Handle type="target" position={Position.Top} className="rf-handle" />
    <div className="rf-node-title">{data.label}</div>
    {data.subtitle ? <div className="rf-node-subtitle">{data.subtitle}</div> : null}
    <Handle type="source" position={Position.Right} className="rf-handle" />
    <Handle type="source" position={Position.Bottom} className="rf-handle" />
  </div>
);

const StartNode = () => (
  <div className="rf-node-start">
    <Handle type="source" position={Position.Right} className="rf-handle" />
    <Handle type="source" position={Position.Bottom} className="rf-handle" />
    <span>Start</span>
  </div>
);

const EndNode = () => (
  <div className="rf-node-end">
    <Handle type="target" position={Position.Left} className="rf-handle" />
    <Handle type="target" position={Position.Top} className="rf-handle" />
    <span>End</span>
  </div>
);

function VariantsFlowPage() {
  const { agentId } = useParams();
  const [transitions, setTransitions] = useState([]);
  const [uniqueTools, setUniqueTools] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState([]);
  const [variantSearch, setVariantSearch] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const NODE_WIDTH = 240;
  const NODE_HEIGHT = 78;
  const START_RADIUS = 28;
  const END_RADIUS = 28;

  useEffect(() => {
    const loadVariants = async () => {
      if (!agentId) return;
      try {
        const res = await agentVariantsAPI.list(agentId);
        setVariants(res.data.variants || []);
      } catch (err) {
        setError(err.message);
      }
    };
    loadVariants();
  }, [agentId]);

  useEffect(() => {
    const loadTransitions = async () => {
      if (!agentId) return;
      try {
        setLoading(true);
        const res = await agentVariantsAPI.getTransitions(agentId, selectedVariantIds);
        setTransitions(res.data.transitions || []);
        setUniqueTools(res.data.unique_tools || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadTransitions();
  }, [agentId, selectedVariantIds]);

const toggleVariant = (variantId) => {
  setSelectedVariantIds((prev) =>
    prev.includes(variantId)
      ? prev.filter((id) => id !== variantId)
      : [...prev, variantId]
  );
};

const selectAllVariants = () => {
  const allIds = variants.map((v) => v.id);
  setSelectedVariantIds(allIds);
};

const clearSelection = () => {
  setSelectedVariantIds([]);
};

const toggleFilterPanel = () => {
  setShowFilterPanel((prev) => !prev);
};

  const { flowNodes, flowEdges, flowHeight } = useMemo(() => {
    // Build node list from unique tools + any tool names present in transitions
    const nodeIds = new Set(['_start', '_end']);
    uniqueTools.forEach(t => nodeIds.add(t));
    transitions.forEach(t => {
      nodeIds.add(t.from_tool);
      nodeIds.add(t.to_tool);
    });

    const baseNodes = Array.from(nodeIds).map(name => ({
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
    baseNodes.forEach(n => (depth[n.id] = n.id === '_start' ? 0 : Infinity));
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
    baseNodes.forEach(n => {
      if (!isFinite(depth[n.id])) depth[n.id] = 1;
    });
    const maxDepth = Math.max(...Object.values(depth));
    depth['_end'] = Math.max(depth['_end'] || 0, maxDepth + 1);

    // Group nodes by depth to position vertically
    const columns = {};
    baseNodes.forEach(n => {
      const d = depth[n.id];
      if (!columns[d]) columns[d] = [];
      columns[d].push(n.id);
    });

    const nodePositions = {};
    const colSpacing = 520;
    const rowSpacing = 300;
    Object.entries(columns).forEach(([dStr, ids]) => {
      const d = parseInt(dStr, 10);
      ids.sort((a, b) => a.localeCompare(b));
      ids.forEach((id, idx) => {
        nodePositions[id] = {
          x: d * colSpacing,
          y: idx * rowSpacing
        };
      });
    });

    const maxRows = Math.max(...Object.values(columns).map(col => col.length));
    const flowHeight = Math.min(Math.max(maxRows * rowSpacing + 200, 480), 900);

    const flowNodes = baseNodes.map(n => {
      const isStart = n.id === '_start';
      const isEnd = n.id === '_end';
      const nodeStyle = {
        width: isStart || isEnd ? 80 : NODE_WIDTH,
        height: isStart || isEnd ? 80 : NODE_HEIGHT,
        background: isStart || isEnd ? 'transparent' : '#ffffff',
        border: isStart || isEnd ? 'none' : '1px solid #d8e1ea',
        color: '#1f2933',
        fontWeight: 700,
        borderRadius: isStart || isEnd ? 50 : 16,
        boxShadow: isStart || isEnd ? 'none' : undefined,
      };

      return {
        id: n.id,
        position: nodePositions[n.id] || { x: 0, y: 0 },
        data: { label: n.label, subtitle: !isStart && !isEnd && n.id !== n.label ? n.id : '' },
        type: isStart ? 'startNode' : isEnd ? 'endNode' : 'flowNode',
        style: nodeStyle,
      };
    });

    const flowEdges = links.map(l => {
      const id = `${l.from}-${l.to}`;
      return {
        id,
        source: l.from,
        target: l.to,
        label: l.value.toString(),
        type: 'default',
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 6,
        labelStyle: { fill: '#1f2933', fontWeight: 600 },
        labelBgStyle: { fill: '#e9eef5', color: '#2b3b52' },
        style: { stroke: '#3b6a99', strokeWidth: Math.max(2.5, Math.min(7, Math.log2(l.value + 1) + 1.5)), borderRadius: 12 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b6a99', width: 16, height: 16 },
        interactionWidth: 24,
      };
    });

    return { flowNodes, flowEdges, flowHeight };
  }, [uniqueTools, transitions]);

  const nodeTypes = useMemo(() => ({ flowNode: FlowNode, startNode: StartNode, endNode: EndNode }), []);
  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'default',
      style: { stroke: '#1f64b5', strokeWidth: 2.2, opacity: 0.9 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#1f64b5', width: 16, height: 16 },
      labelStyle: { fill: '#0f172a', fontWeight: 700 },
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 6,
      labelBgStyle: { fill: '#e9eef5', color: '#0f172a' },
    }),
    []
  );

  const filteredVariants = useMemo(() => {
    if (!variantSearch.trim()) return variants;
    const term = variantSearch.toLowerCase();
    return variants.filter(
      (v) =>
        v.name.toLowerCase().includes(term) ||
        v.sequence_preview.toLowerCase().includes(term)
    );
  }, [variants, variantSearch]);

  const selectedVariants = variants.filter(v => selectedVariantIds.includes(v.id));
  const selectionLabel = selectedVariantIds.length
    ? `Filtered to ${selectedVariantIds.length} pattern${selectedVariantIds.length > 1 ? 's' : ''}`
    : 'Aggregated across all patterns';

  if (loading) return <div className="loading">Loading variants flow...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!transitions.length) {
    return (
      <div className="empty-state">
        <h3>No tool flow data</h3>
        <p>
          {selectedVariantIds.length
            ? 'No flow data for the selected patterns. Try selecting different patterns or clearing the filter.'
            : 'Process sessions to generate aggregated tool flow.'}
        </p>
        {selectedVariantIds.length > 0 && (
          <button className="btn btn-secondary" onClick={clearSelection}>
            Clear Pattern Filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="variants-flow-page">
      <div className="page-header">
        <h1>Agent Tool Flow</h1>
        <p className="page-subtitle">
          Visualize tool transitions across processed sessions. Use pattern filters to focus on specific flows.
        </p>
      </div>

      <div className="variant-filter">
        <div className="variant-filter-header">
          <div>
            <div className="filter-title">Filter by Patterns</div>
            <div className="filter-subtitle">{selectionLabel}</div>
          </div>
          <div className="filter-actions">
            <button className="btn btn-secondary btn-sm" onClick={clearSelection} disabled={!selectedVariantIds.length}>
              Clear
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={toggleFilterPanel}
              disabled={variants.length === 0}
            >
              {showFilterPanel ? 'Hide' : 'Choose Patterns'} ({selectedVariantIds.length})
            </button>
          </div>
        </div>

        {showFilterPanel && (
          <div className="variant-filter-panel">
            <div className="variant-filter-controls">
              <input
                type="text"
                placeholder="Search patterns..."
                value={variantSearch}
                onChange={(e) => setVariantSearch(e.target.value)}
              />
              <div className="filter-actions-inline">
                <button className="btn btn-secondary btn-sm" onClick={clearSelection} disabled={!selectedVariantIds.length}>
                  Clear
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={selectAllVariants}
                  disabled={variants.length === 0 || selectedVariantIds.length === variants.length}
                >
                  Select All
                </button>
              </div>
            </div>

            <div className="variant-filter-list typeahead-list">
              {variants.length === 0 ? (
                <div className="filter-placeholder">No patterns yet. Process sessions to generate variants.</div>
              ) : filteredVariants.length === 0 ? (
                <div className="filter-placeholder">No matches. Try a different search.</div>
              ) : (
                filteredVariants.map((variant) => (
                  <label key={variant.id} className="variant-row">
                    <input
                      type="checkbox"
                      checked={selectedVariantIds.includes(variant.id)}
                      onChange={() => toggleVariant(variant.id)}
                    />
                    <div className="variant-row-body">
                      <div className="variant-row-title">
                        <span className="variant-row-name">{variant.name}</span>
                        <span className="variant-row-meta">
                          {variant.session_count} sessions · {variant.percentage}%
                        </span>
                      </div>
                      <div className="variant-row-seq">{variant.sequence_preview}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flow-legend">
        <div className="legend-item"><span className="legend-node start"></span>Start</div>
        <div className="legend-item"><span className="legend-node end"></span>End</div>
        <div className="legend-item"><span className="legend-link"></span>Transition count</div>
      </div>
      <div className="flow-canvas">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.4}
          maxZoom={1.5}
          style={{ width: '100%', height: flowHeight }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} color="rgba(17,24,39,0.08)" />
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            style={{ height: 140, width: 180, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}
            nodeColor="#5c86b1"
            nodeStrokeColor="#1f64b5"
            maskColor="rgba(255,255,255,0.88)"
          />
          <Controls showInteractive={false} position="bottom-left" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
        </ReactFlow>
      </div>
    </div>
  );
}

export default VariantsFlowPage;
