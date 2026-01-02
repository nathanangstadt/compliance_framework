# Policy Compliance Framework

A full-stack application for analyzing agent memory (LLM message exchanges) for policy compliance. Built with React frontend and FastAPI backend, deployable via Docker Compose.

## Features

### Agent Memory Management
- Upload agent memory files as JSON containing complete message exchanges with LLMs
- List and manage uploaded agent memories
- Process agent memories for compliance against defined policies

### Policy Management
Support for multiple policy types:

1. **Response Length Policy**: Enforce maximum output tokens from agents for cost and conciseness
2. **Tool Call Policy**: Validate specific tool calls and their parameters
3. **Tool Response Policy**: Validate successful tool responses
4. **Compound Tool Policy**: Validate specific combinations of tool calls (e.g., approval before high-value actions)
5. **Targeted LLM Evaluation Policy**: Use an LLM to evaluate specific messages for compliance

### Compliance Dashboard
- Visualize compliance metrics with bar charts
- View non-compliant agent instances
- Review memory with compliance annotations
- Visualize tool calls as a flow diagram

## Quick Start

### Prerequisites
- Docker and Docker Compose
- (Optional) Anthropic or OpenAI API key for LLM evaluation policies

### Installation

1. Clone the repository:
```bash
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

### 1. Upload Agent Memories

Navigate to "Agent Memories" and upload a JSON file containing agent messages. Sample files are available in the `sample_memories/` folder. The JSON should be in one of these formats:

**Format 1: Array of messages**
```json
[
  {
    "role": "user",
    "content": "Hello"
  },
  {
    "role": "assistant",
    "content": "Hi there!"
  }
]
```

**Format 2: Object with messages field**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello"
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
          "name": "create_order",
          "input": {
            "amount": 1500
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
          "content": "Order created successfully"
        }
      ]
    }
  ]
}
```

### 2. Define Policies

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

### 3. Evaluate Compliance

From the "Agent Memories" page:
- Click "Evaluate" on individual memories
- Or click "Evaluate All" to evaluate all memories

### 4. Review Results

Navigate to the "Dashboard" to see:
- Compliance statistics
- Charts showing compliance by policy
- List of non-compliant memories

Click "Review" on any non-compliant memory to see:
- **Messages Tab**: All messages with compliance violations highlighted
- **Tool Flow Tab**: Visual representation of tool calls and their results
- **Compliance Summary Tab**: Overview of policy results

## Architecture

### Backend (FastAPI + SQLAlchemy)
- RESTful API with automatic OpenAPI documentation
- SQLite database for storing memories, policies, and evaluations
- Policy evaluation engine supporting multiple policy types
- Integration with Anthropic and OpenAI APIs for LLM evaluations

### Frontend (React)
- Multi-page application with React Router
- Responsive UI with custom styling
- Interactive charts using Recharts
- Tool flow visualization

### Deployment
- Docker containers for frontend and backend
- Docker Compose for orchestration
- Volume persistence for database and uploads

## API Endpoints

### Agent Memories
- `POST /api/memories/upload` - Upload memory file
- `GET /api/memories` - List all memories
- `GET /api/memories/{id}` - Get specific memory
- `DELETE /api/memories/{id}` - Delete memory

### Policies
- `POST /api/policies` - Create policy
- `GET /api/policies` - List all policies
- `GET /api/policies/{id}` - Get specific policy
- `PUT /api/policies/{id}` - Update policy
- `DELETE /api/policies/{id}` - Delete policy

### Compliance
- `POST /api/compliance/evaluate` - Evaluate memory against policies
- `GET /api/compliance/summary` - Get compliance summary
- `GET /api/compliance/memory/{id}` - Get evaluations for specific memory

## Development

### Running without Docker

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

### Adding New Policy Types

1. Add policy type to `backend/app/schemas.py`
2. Implement evaluation logic in `backend/app/services/policy_evaluator.py`
3. Add UI configuration in `frontend/src/components/PolicyEditor.js`

## Environment Variables

### Backend
- `DATABASE_URL` - Database connection string (default: sqlite:///./data/compliance.db)
- `ANTHROPIC_API_KEY` - Anthropic API key for LLM evaluations
- `OPENAI_API_KEY` - OpenAI API key for LLM evaluations

### Frontend
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000)

## License

MIT
