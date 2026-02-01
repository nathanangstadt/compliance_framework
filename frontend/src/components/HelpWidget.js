import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/HelpWidget.css';
import { buildExcerpt, getContextSuggestion, parseMarkdownSections, searchUserGuide } from '../utils/userGuideSearch';

const GUIDE_URL = '/help/USER_GUIDE.md';

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatAnswer(results) {
  if (!results.length) {
    return [
      "I couldn’t find a matching section in the User Guide.",
      "Try asking about: sessions, policies, issues, jobs, variants, or API keys."
    ].join('\n');
  }

  const parts = ['Here’s what I found in the User Guide:'];
  results.forEach(({ section }, i) => {
    const excerpt = buildExcerpt(section.text, { maxChars: 700, maxLines: 12 });
    parts.push('');
    parts.push(`${i + 1}) ${section.title}`);
    parts.push(excerpt);
  });

  return parts.join('\n');
}

function HelpWidget() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [guideMarkdown, setGuideMarkdown] = useState('');
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [guideError, setGuideError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const sections = useMemo(() => {
    if (!guideMarkdown) return [];
    return parseMarkdownSections(guideMarkdown);
  }, [guideMarkdown]);

  const context = useMemo(() => getContextSuggestion(pathname), [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, messages.length, isAnswering]);

  useEffect(() => {
    const onKeyDown = (e) => {
      // Cmd/Ctrl + / toggles help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const ensureGuideLoaded = async () => {
    if (guideMarkdown || loadingGuide) return;
    try {
      setLoadingGuide(true);
      setGuideError(null);
      const res = await fetch(GUIDE_URL, { cache: 'force-cache' });
      if (!res.ok) throw new Error(`Failed to load guide (${res.status})`);
      const text = await res.text();
      setGuideMarkdown(text);
    } catch (err) {
      setGuideError(err.message || String(err));
    } finally {
      setLoadingGuide(false);
    }
  };

  const open = async () => {
    setIsOpen(true);
    await ensureGuideLoaded();
  };

  // When opened (and guide is loaded), show context-based starter help once per open session.
  useEffect(() => {
    if (!isOpen) return;
    if (!sections.length) return;
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      const contextResults = searchUserGuide(sections, context.query, { limit: 1 });
      const body = contextResults.length
        ? `You’re on: ${context.title}\n\n${formatAnswer(contextResults)}`
        : `You’re on: ${context.title}\n\nAsk a question about how to use this page.`;

      return [{
        id: nowId(),
        role: 'assistant',
        content: body
      }];
    });
  }, [isOpen, sections, context.title, context.query]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q) return;

    setMessages((prev) => ([
      ...prev,
      { id: nowId(), role: 'user', content: q }
    ]));
    setInput('');
    setIsAnswering(true);

    try {
      await ensureGuideLoaded();

      const results = searchUserGuide(sections, q, { limit: 3 });
      const answer = guideError
        ? `Help content unavailable: ${guideError}`
        : formatAnswer(results);

      setMessages((prev) => ([
        ...prev,
        { id: nowId(), role: 'assistant', content: answer }
      ]));
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <>
      <div className="help-launcher" role="region" aria-label="Help">
        <button className="help-launcher-button" onClick={() => (isOpen ? setIsOpen(false) : open())}>
          {isOpen ? 'Close Help' : 'Help'}
          <span className="help-launcher-hint">Ctrl/⌘ + /</span>
        </button>
      </div>

      {isOpen && (
        <div className="help-modal-overlay" onClick={() => setIsOpen(false)} role="dialog" aria-modal="true">
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-modal-header">
              <div className="help-modal-title">
                <div className="help-modal-title-main">Help</div>
                <div className="help-modal-title-sub">Context: {context.title}</div>
              </div>
              <button className="help-close" onClick={() => setIsOpen(false)} aria-label="Close">
                ×
              </button>
            </div>

            <div className="help-modal-body">
              {loadingGuide && !guideMarkdown && (
                <div className="help-banner">Loading user guide…</div>
              )}
              {guideError && !guideMarkdown && (
                <div className="help-banner help-banner-error">
                  Failed to load help content. Ensure `frontend/public/help/USER_GUIDE.md` exists.
                </div>
              )}

              <div className="help-messages" ref={scrollRef}>
                {messages.map((m) => (
                  <div key={m.id} className={`help-message help-message-${m.role}`}>
                    <div className="help-message-role">{m.role === 'user' ? 'You' : 'Guide'}</div>
                    <pre className="help-message-content">{m.content}</pre>
                  </div>
                ))}
                {isAnswering && (
                  <div className="help-message help-message-assistant">
                    <div className="help-message-role">Guide</div>
                    <pre className="help-message-content">Searching…</pre>
                  </div>
                )}
              </div>
            </div>

            <div className="help-modal-footer">
              <input
                ref={inputRef}
                className="help-input"
                placeholder="Ask a question (answers are drawn from the User Guide)…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button className="btn btn-primary" onClick={handleSend} disabled={!input.trim() || isAnswering}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HelpWidget;

