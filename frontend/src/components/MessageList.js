import React from 'react';
import './MessageList.css';

function MessageList({ messages, violations = null, getViolationsForMessage = null }) {
  const renderMessageContent = (content) => {
    if (typeof content === 'string') {
      return <div className="message-text">{content}</div>;
    }

    if (Array.isArray(content)) {
      return content.map((block, idx) => {
        if (block.type === 'text') {
          return <div key={idx} className="message-text">{block.text}</div>;
        } else if (block.type === 'tool_use') {
          return (
            <div key={idx} className="tool-use">
              <div className="tool-header">
                <strong>Tool Call:</strong> {block.name}
              </div>
              <div className="tool-id">ID: {block.id}</div>
              <pre>{JSON.stringify(block.input, null, 2)}</pre>
            </div>
          );
        } else if (block.type === 'tool_result') {
          return (
            <div key={idx} className={`tool-result ${block.is_error ? 'error' : 'success'}`}>
              <div className="tool-header">
                <strong>Tool Result:</strong> {block.tool_use_id}
              </div>
              {block.is_error && <div className="error-badge">ERROR</div>}
              <pre>{JSON.stringify(block.content, null, 2)}</pre>
            </div>
          );
        }
        return null;
      });
    }

    return <pre>{JSON.stringify(content, null, 2)}</pre>;
  };

  return (
    <div className="message-list">
      {messages.map((message, idx) => {
        const messageViolations = getViolationsForMessage ? getViolationsForMessage(idx) : [];
        const hasViolations = messageViolations.length > 0;

        return (
          <div
            key={idx}
            className={`message ${message.role} ${hasViolations ? 'has-violations' : ''}`}
          >
            <div className="message-header">
              <span className="message-role">{message.role}</span>
              <span className="message-index">#{idx}</span>
            </div>

            <div className="message-content">
              {renderMessageContent(message.content)}
            </div>

            {hasViolations && (
              <div className="violations">
                <div className="violations-header">Compliance Information:</div>
                {messageViolations.map((violation, vIdx) => {
                  if (violation.is_trigger || violation.is_requirement) {
                    const typeLabel = violation.is_trigger ? 'Triggered' : 'Required';
                    const typeClass = violation.is_trigger ? 'trigger-check' : 'requirement-check';

                    return (
                      <div key={vIdx} className={`check-violation ${typeClass}`}>
                        <div className="check-violation-header">
                          <span className="check-type-badge">{typeLabel}</span>
                          <span className="check-policy-name">{violation.policy_name}</span>
                        </div>
                        <div className="check-name">{violation.check_name}</div>
                        <div className="check-message">{violation.message}</div>
                      </div>
                    );
                  }

                  return (
                    <div key={vIdx} className="violation-item">
                      <strong>{violation.policy_name || `Policy #${violation.policy_id}`}</strong>
                      <p>{violation.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MessageList;
