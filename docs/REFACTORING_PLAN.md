# Agent Observability Refactoring Plan

## Context

We are building an Agent Observability tool that emulates Oracle Integration Cloud (OIC) UX patterns. The tool is part of a larger Project that includes Integration, RPA, Agent, and other automation components. We are specifically focused on the Agent Observability view for a specific agent (e.g., "Order Management Agent").

## Confirmed Decisions

### 1. Terminology
- **Session** (replacing "Memory" and "Agent Instance")
- **Agent variants** (keeping this, not "Tool variants")
- **Issues** (sessions with policy violations)

### 2. Status Model (Option B - Dual Status Fields)

| processing_status | compliance_status | UI Display |
|-------------------|-------------------|------------|
| `unprocessed` | `null` | "Unprocessed" |
| `processed` | `compliant` | "Compliant" |
| `processed` | `issues` | "Critical" / "Warning" badge |
| `processed` | `resolved` | "Resolved" |

### 3. Session Metadata Schema

```json
{
  "metadata": {
    "session_id": "10001",
    "timestamp": "2025-10-13T09:58:07Z",
    "duration_seconds": 45.2,
    "business_identifiers": {
      "customer_id": "CID54321",
      "customer_name": "Acme Corporation",
      "location": "Phoenix",
      "order_id": "ORD-2025-001"
    }
  },
  "messages": [...]
}
```

- `metadata` block is optional (backward compatible)
- Standard fields: `session_id`, `timestamp`, `duration_seconds`
- `business_identifiers` is flexible key-value object

### 4. Async Processing
- Simple polling approach
- Backend returns job ID immediately
- Frontend polls for status updates
- Can upgrade to WebSocket later if needed

---

## Implementation Phases

### Phase 1: Backend Schema Updates

**Files to modify:**
- `backend/app/models.py` - Add compliance_status to Session model
- `backend/app/schemas.py` - Update schemas for new status fields
- `backend/app/services/memory_loader.py` - Parse metadata from JSON files
- `backend/app/routes/memories.py` - Return metadata in API responses
- `backend/app/routes/compliance.py` - Update status after evaluation

**Database changes:**
```python
# In models.py - Add to existing model or create new
class SessionStatus(Base):
    __tablename__ = "session_status"

    session_id = Column(String, primary_key=True)  # maps to memory_id
    processing_status = Column(String, default="unprocessed")  # unprocessed, processed
    compliance_status = Column(String, nullable=True)  # null, compliant, issues, resolved
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String, nullable=True)
```

**API changes:**
- `GET /api/memories/` - Include metadata and status fields
- `POST /api/sessions/{id}/resolve` - Mark session as resolved
- `POST /api/sessions/{id}/unresolve` - Reopen a resolved session

---

### Phase 2: Backend Async Processing

**New endpoints:**
```python
POST /api/compliance/process-batch-async
  Request: { "session_ids": [...] }
  Response: { "job_id": "uuid", "status": "pending", "total": 10 }

GET /api/compliance/jobs/{job_id}
  Response: {
    "job_id": "uuid",
    "status": "running" | "completed" | "failed",
    "progress": { "completed": 3, "total": 10 },
    "results": [...]
  }
```

**Implementation:**
- Use Python threading or asyncio for background processing
- Store job state in memory (simple dict) or database
- Jobs auto-expire after 1 hour

---

### Phase 3: Frontend Terminology Updates

**Files to update:**
- `App.js` - Navbar titles and descriptions
- `Sidebar.js` - Menu labels (if any)
- `Dashboard.js` - Card titles, labels
- `MemoriesPage.js` → Consider renaming to `SessionsPage.js`
- `IssuesPage.js` - Column headers, labels
- `ComplianceReviewPage.js` - Title, labels
- `MemoryDetailPage.js` → Consider renaming to `SessionDetailPage.js`

**Terminology mapping:**
| Old | New |
|-----|-----|
| Agent Instance | Session |
| Memory | Session |
| Agent instance name | Session / Business identifier |
| Memories page | Sessions |

---

### Phase 4: Frontend Issues Page Enhancements

**Current columns:**
- Agent Instance Name
- Status
- Actions

**New columns:**
- Business Identifier (primary display)
- Issues (count: "2 unresolved")
- Date (timestamp)
- Status (Critical/Warning/Resolved badge)
- Actions (View, Mark resolved)

**Add filter bar:**
- Time window chip
- Status filter (All, Critical, Warning, Resolved)
- Search input

---

### Phase 5: Frontend Resolution Workflow

**Session Detail Page:**
- Add "Mark as resolved" button in header
- Show resolution status if resolved
- Allow reopening resolved sessions

**Issues Page:**
- Checkbox column for bulk actions
- "Mark resolved" bulk action button
- Visual distinction for resolved items

---

### Phase 6: Frontend Async Processing UX

**Processing flow:**
1. User selects sessions and clicks "Process"
2. Show toast: "Processing 10 sessions..."
3. Start polling job status
4. Update progress: "Processing... 3 of 10 complete"
5. On complete: Refresh data, show success toast

**Components:**
- Progress indicator in toast or modal
- Disable process button while job running
- Handle errors gracefully

---

## File Rename Considerations

| Current | Proposed | Notes |
|---------|----------|-------|
| `MemoriesPage.js` | `SessionsPage.js` | Main sessions list |
| `MemoryDetailPage.js` | `SessionDetailPage.js` | Raw session view |
| `memory_loader.py` | `session_loader.py` | Backend service |
| `/api/memories/` | `/api/sessions/` | API routes (breaking change) |

**Decision needed:** Do we rename API routes? This is a breaking change but keeps things consistent. Alternatively, keep `/api/memories/` internally but use "session" terminology in UI only.

---

## Sample Session Files

Update sample files to include metadata:

```json
{
  "metadata": {
    "session_id": "10001",
    "timestamp": "2025-10-13T09:58:07Z",
    "duration_seconds": 23.4,
    "business_identifiers": {
      "customer_id": "CID54321",
      "customer_name": "Acme Corporation",
      "location": "Phoenix"
    }
  },
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

---

## Testing Checklist

- [ ] Sessions without metadata still work
- [ ] Status transitions work correctly
- [ ] Resolved sessions excluded from issue counts
- [ ] Async processing handles errors
- [ ] UI remains responsive during bulk operations
- [ ] Filters work with new status model
