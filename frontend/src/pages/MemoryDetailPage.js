import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { memoryAPI } from '../services/api';
import MessageList from '../components/MessageList';
import './MemoryDetailPage.css';

function MemoryDetailPage() {
  const { id } = useParams();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await memoryAPI.get(id);
        setMemory(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Update navbar title when memory is loaded
  useEffect(() => {
    if (memory) {
      const titleElement = document.getElementById('memory-detail-title');
      if (titleElement) {
        const cleanName = memory.name.replace(/\.json$/, '');
        titleElement.querySelector('h1').textContent = cleanName;
      }
    }
  }, [memory]);

  if (loading) return <div className="loading">Loading agent instance...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!memory) return <div className="error">Agent instance not found</div>;

  return (
    <div className="memory-detail-page">
      <div className="memory-detail-header">
        <span className="message-count">{memory.messages.length} messages</span>
      </div>
      <MessageList messages={memory.messages} />
    </div>
  );
}

export default MemoryDetailPage;
