# Agent Compliance Framework

A comprehensive full-stack application for evaluating AI agent behavior against configurable compliance policies. Built with React frontend and FastAPI backend, deployable via Docker Compose.

## Features

### Multi-Agent Support
- Manage multiple agents with isolated data and policies
- Agent-scoped sessions, policies, evaluations, and variants
- Complete agent deletion with database and filesystem cleanup

### Session Management
- Upload agent session files as JSON containing complete message exchanges with LLMs
- Three processing states: Unprocessed, Needs Re-processing, Processed
- Session metadata support (session_id, timestamp, duration, business identifiers)
- Resolve/unresolve compliance issues with tracking

### Policy Management
Support for multiple policy types:

1. **Response Length Policy**: Enforce maximum output tokens from agents for cost and conciseness
2. **Tool Call Policy**: Validate specific tool calls and their parameters
3. **Tool Response Policy**: Validate successful tool responses
4. **Compound Tool Policy**: Validate specific combinations of tool calls (e.g., approval before high-value actions)
5. **Targeted LLM Evaluation Policy**: Use an LLM to evaluate specific messages for compliance
6. **Composite Policy Builder**: Complex logic with IF_ANY_THEN_ALL, IF_ALL_THEN_ALL, REQUIRE_ALL, REQUIRE_ANY, FORBID_ALL

### Compliance Dashboard
- Agent selection with session statistics
- Policy compliance charts and metrics
- Agent variants detection and pattern analysis
- Tool usage visualization with transition flow diagrams
- Session activity heatmap
- Full compliance review with messages, summary, and tool flow views

### Async Processing
- Background job processing with real-time progress tracking
- Non-blocking batch evaluations with polling
- Job status monitoring and cancellation

## Quick Start

### Prerequisites
- Docker and Docker Compose
- (Optional) Anthropic or OpenAI API key for LLM evaluation policies

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd compliance_framework
```

2. Create environment file for backend:
```bash
cp backend/.env.example backend/.env
```

3. Edit `backend/.env` and add your API keys if using LLM evaluation policies:
```
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

4. Start the application:
```bash
docker-compose up --build
```

5. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Usage

### 1. Select or Create Agent

The application starts with an agent selection page. Each agent has:
- Isolated sessions, policies, evaluations, and variants
- Separate directory in `agent_data/<agent_id>/`

Sample agent `order_to_invoice` is included with 12 session files.

### 2. Upload Sessions

Navigate to "Sessions" and upload JSON files. Sessions can include metadata:

```json
{
  "metadata": {
    "session_id": "10001",
    "timestamp": "2026-01-01T17:00:00Z",
    "duration_seconds": 42.0,
    "business_identifiers": {
      "customer_id": "CID54321",
      "customer_name": "Acme Corporation"
    }
  },
  "messages": [
    {
      "role": "user",
      "content": "Process order for customer 54321"
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "I'll help you with that."
        },
        {
          "type": "tool_use",
          "id": "toolu_123",
          "name": "get_customer_account",
          "input": {
            "customer_id": 54321
          }
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_123",
          "content": "{\"status\": \"active\"}"
        }
      ]
    }
  ]
}
```

### 3. Define Policies

Navigate to "Policies" and create policies:

**Response Length Policy Example:**
- Max Tokens: 1000

**Tool Call Policy Example:**
- Tool Name: `create_order`
- Parameters: `{"amount": {"gt": 1000}}` (validates amount > 1000)

**Compound Tool Policy Example:**
```json
[
  {
    "type": "if_then",
    "if_tool": "create_invoice",
    "if_params": {"amount": {"gt": 1000}},
    "then_tool": "request_approval",
    "then_before": true
  }
]
```

**LLM Evaluation Policy Example:**
- Evaluation Prompt: "Analyze this message for PII data. Respond with 'violation' if PII is found."
- Message Filter: `{"role": "assistant"}`
- LLM Provider: anthropic
- Model: claude-sonnet-4-5-20250929

### 4. Process Sessions

From the "Sessions" page:
- Click "Process Session" on individual sessions
- Or click "Process All Unprocessed" to process all sessions
- Background job processing with real-time progress updates

Sessions have three states:
- **Unprocessed**: Never evaluated
- **Needs Re-processing**: Evaluated but new policies added
- **Processed**: Fully evaluated against all enabled policies

### 5. Review Results

Navigate to the "Dashboard" to see:
- Agent variants (tool usage patterns)
- Tool usage transition flow
- Session statistics

Navigate to "Issues" to see:
- Sessions with compliance violations
- Filter by policy and status
- Resolve/unresolve compliance issues
- View compliance details

Click "Review" on any session to see:
- **Messages Tab**: All messages with compliance violations highlighted
- **Tool Flow Tab**: Visual representation of tool calls and their results
- **Compliance Summary Tab**: Overview of policy results
- **More Info Tab**: Session metadata and business identifiers

### 6. Load Sample Policies

For the `order_to_invoice` agent, load sample policies using either script:

**Option 1: Using the restore script (recommended for fresh builds):**
```bash
docker exec compliance_framework-backend-1 python3 restore_order_to_invoice_policies.py
```

**Option 2: Using the original loader:**
```bash
docker exec -it compliance_framework-backend-1 python3 load_order_to_invoice_policies.py
```

Both scripts create the same 4 policies:
- **Large Invoice** - IF_ALL_THEN_ALL composite policy requiring approval for invoices > $2,000
- **No PII Data** - LLM validation to detect PII in responses
- **Response Quality** - Multi-check semantic validation (clarity, sentiment, brand voice, safety)
- **Concise Response** - Response length validation (50-200 tokens)

## Architecture

### Backend (FastAPI + SQLAlchemy)
- RESTful API with automatic OpenAPI documentation
- SQLite database for storing policies, evaluations, variants, and session statuses
- Multi-agent data isolation via `agent_id` column
- Policy evaluation engine supporting multiple policy types
- Background job processing with threading
- Integration with Anthropic and OpenAI APIs for LLM evaluations
- Session files stored in `agent_data/<agent_id>/` directories

### Frontend (React)
- Multi-page application with React Router
- Agent-based routing (/:agentId/dashboard, /:agentId/sessions, etc.)
- Global job context for async processing
- Responsive UI with custom styling
- Interactive charts using Recharts
- Tool flow visualization with Sankey diagrams
- Toast notifications for user feedback

### Deployment
- Docker containers for frontend and backend
- Docker Compose for orchestration
- Volume persistence for database and agent data
- Hot reload for development

## API Endpoints

### Agents
- `GET /api/agents/` - List all agents
- `GET /api/agents/{agent_id}` - Get agent details
- `DELETE /api/agents/{agent_id}` - Delete agent and all data

### Sessions
- `GET /api/memories/{agent_id}/` - List sessions for agent
- `GET /api/memories/{agent_id}/{memory_id}` - Get specific session
- `POST /api/memories/{agent_id}/{memory_id}/resolve` - Mark session as resolved
- `POST /api/memories/{agent_id}/{memory_id}/unresolve` - Remove resolved status

### Policies
- `POST /api/policies/{agent_id}/` - Create policy
- `GET /api/policies/{agent_id}/` - List policies for agent
- `GET /api/policies/{agent_id}/{id}` - Get specific policy
- `PUT /api/policies/{agent_id}/{id}` - Update policy
- `DELETE /api/policies/{agent_id}/{id}` - Delete policy

### Compliance
- `POST /api/compliance/{agent_id}/evaluate` - Evaluate session(s) against policies
- `GET /api/compliance/{agent_id}/summary` - Get compliance summary
- `GET /api/compliance/{agent_id}/memory/{id}` - Get evaluations for specific session
- `POST /api/compliance/{agent_id}/process-batch` - Process multiple sessions
- `DELETE /api/compliance/{agent_id}/reset` - Reset all compliance data

### Agent Variants
- `GET /api/agent-variants/{agent_id}/` - List agent variants
- `GET /api/agent-variants/{agent_id}/transitions` - Get tool transitions
- `GET /api/agent-variants/{agent_id}/{variant_id}` - Get variant details
- `POST /api/agent-variants/{agent_id}/refresh` - Refresh variants

### Jobs
- `POST /api/jobs/submit` - Submit async processing job
- `GET /api/jobs/{job_id}/status` - Get job status
- `GET /api/jobs/{job_id}/result` - Get job result
- `GET /api/jobs/` - List jobs
- `DELETE /api/jobs/{job_id}` - Delete job

## Development

This project is intended to run inside Docker via `docker-compose up --build`. Host-only execution is not supported; the browser is the only thing that should run on the host.

### Adding New Policy Types

1. Add policy type to `backend/app/schemas.py`
2. Implement evaluation logic in `backend/app/services/policy_evaluator.py`
3. Add UI configuration in `frontend/src/components/PolicyEditor.js`

### Adding New Agents

1. Create directory: `agent_data/<agent_id>/`
2. Add session JSON files to the directory
3. Sessions will be automatically discovered and listed

## Environment Variables

### Backend
- `DATABASE_URL` - Database connection string (default: sqlite:///./data/compliance.db)
- `ANTHROPIC_API_KEY` - Anthropic API key for LLM evaluations
- `OPENAI_API_KEY` - OpenAI API key for LLM evaluations

### Frontend
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000)

## Project Structure

```
compliance_framework/
├── agent_data/                 # Agent session files
│   └── order_to_invoice/       # Sample agent
│       └── *.json              # Session files
├── backend/
│   ├── app/
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── routes/             # API routes
│   │   └── services/           # Business logic
│   ├── data/                   # SQLite database (volume)
│   ├── requirements.txt
│   └── load_order_to_invoice_policies.py  # Sample policy loader
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API client
│   │   └── context/            # React context providers
│   └── package.json
└── docker-compose.yml
```

## License

MIT
