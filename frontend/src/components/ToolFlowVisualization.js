import React, { useMemo, useState } from 'react';
import './ToolFlowVisualization.css';

function ToolFlowVisualization({ messages }) {
  const [selectedTool, setSelectedTool] = useState(null);

  const toolFlow = useMemo(() => {
    const flow = [];
    const toolUseMap = new Map();

    messages.forEach((message, idx) => {
      if (message.role === 'assistant' && Array.isArray(message.content)) {
        message.content.forEach(block => {
          if (block.type === 'tool_use') {
            const toolCall = {
              id: block.id,
              name: block.name,
              input: block.input,
              messageIndex: idx,
              result: null,
              resultIndex: null
            };
            toolUseMap.set(block.id, toolCall);
            flow.push(toolCall);
          }
        });
      } else if (message.role === 'user' && Array.isArray(message.content)) {
        message.content.forEach(block => {
          if (block.type === 'tool_result') {
            const toolCall = toolUseMap.get(block.tool_use_id);
            if (toolCall) {
              toolCall.result = block.content;
              toolCall.resultIndex = idx;
              toolCall.isError = block.is_error;
            }
          }
        });
      }
    });

    return flow;
  }, [messages]);

  if (toolFlow.length === 0) {
    return (
      <div className="empty-state">
        <h3>No tool calls found</h3>
        <p>This agent memory does not contain any tool calls</p>
      </div>
    );
  }

  return (
    <div className="tool-flow-visualization">
      <div className="tab-header">
        <h3>Tool Call Flow</h3>
        <div className="tab-underline"></div>
      </div>

      <div className="flow-timeline">
        {/* Start Play Button */}
        <div className="flow-start-icon">
          <svg width="48" height="48" viewBox="0 0 60 60">
            <rect x="5" y="5" width="50" height="50" rx="10" fill="#5a7a95" transform="rotate(45 30 30)"/>
            <polygon points="25,20 25,40 38,30" fill="white"/>
          </svg>
        </div>

        <div className="flow-arrow-down"></div>

        {toolFlow.map((tool, idx) => (
          <React.Fragment key={tool.id}>
            <div
              className="flow-step-card"
              onClick={() => setSelectedTool(tool)}
              style={{ cursor: 'pointer' }}
            >
              <div className="flow-card-stripe"></div>
              <div className="flow-card-content">
                <div className="flow-card-title">{tool.name}</div>
                <div className="flow-card-subtitle">
                  {tool.name.replace(/_/g, '_')}
                </div>
              </div>
              {!tool.isError && (
                <div className="flow-card-check">✓</div>
              )}
            </div>

            {idx < toolFlow.length - 1 && <div className="flow-arrow-down"></div>}
          </React.Fragment>
        ))}

        <div className="flow-arrow-down"></div>

        {/* End Stop Icon */}
        <div className="flow-end-icon">
          <svg width="48" height="48" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="25" fill="#6a7a8a"/>
            <rect x="22" y="22" width="16" height="16" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTool && (
        <div className="tool-detail-modal-overlay" onClick={() => setSelectedTool(null)}>
          <div className="tool-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selectedTool.name}</h3>
                <span className="modal-message-ref">Message #{selectedTool.messageIndex}</span>
              </div>
              <button className="modal-close" onClick={() => setSelectedTool(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <div className="modal-section-title">Input Parameters:</div>
                <pre className="modal-code">{JSON.stringify(selectedTool.input, null, 2)}</pre>
              </div>

              {selectedTool.result !== null && (
                <div className="modal-section">
                  <div className="modal-section-title">
                    Result:
                    {selectedTool.isError && <span className="modal-error-badge">ERROR</span>}
                    <span className="modal-message-ref">Message #{selectedTool.resultIndex}</span>
                  </div>
                  <pre className={`modal-code ${selectedTool.isError ? 'modal-code-error' : ''}`}>
                    {typeof selectedTool.result === 'string' ? selectedTool.result : JSON.stringify(selectedTool.result, null, 2)}
                  </pre>
                </div>
              )}

              <div className="modal-footer">
                <div className="modal-tool-id">Tool ID: {selectedTool.id}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ToolFlowVisualization;
