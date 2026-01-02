# Project Structure

```
compliance_framework/
├── backend/                          # FastAPI backend application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI application entry point
│   │   ├── database.py               # SQLAlchemy database configuration
│   │   ├── models.py                 # Database models (AgentMemory, Policy, ComplianceEvaluation)
│   │   ├── schemas.py                # Pydantic schemas for API validation
│   │   ├── routes/                   # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── memories.py           # Agent memory endpoints
│   │   │   ├── policies.py           # Policy management endpoints
│   │   │   └── compliance.py         # Compliance evaluation endpoints
│   │   └── services/                 # Business logic
│   │       ├── __init__.py
│   │       └── policy_evaluator.py   # Policy evaluation engine
│   ├── Dockerfile                    # Backend container configuration
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment variables template
│   └── data/                         # SQLite database (created at runtime)
│
├── frontend/                         # React frontend application
│   ├── public/
│   │   └── index.html                # HTML template
│   ├── src/
│   │   ├── index.js                  # React entry point
│   │   ├── index.css                 # Global styles
│   │   ├── App.js                    # Main app component with routing
│   │   ├── App.css                   # App-wide styles
│   │   ├── services/
│   │   │   └── api.js                # API client for backend communication
│   │   ├── components/               # Reusable React components
│   │   │   ├── PolicyEditor.js       # Policy creation/editing modal
│   │   │   ├── ToolFlowVisualization.js        # Tool call flow diagram
│   │   │   └── ToolFlowVisualization.css
│   │   └── pages/                    # Page components
│   │       ├── Dashboard.js          # Compliance dashboard with charts
│   │       ├── MemoriesPage.js       # Memory upload and management
│   │       ├── PoliciesPage.js       # Policy management
│   │       ├── MemoryDetailPage.js   # Memory review with violations
│   │       └── MemoryDetailPage.css
│   ├── Dockerfile                    # Frontend container configuration
│   └── package.json                  # Node dependencies
│
├── sample_memories/                  # Test data files (independent from code)
│   ├── README.md                     # Documentation for test files
│   ├── sample_memory.json            # Simple invoice creation scenario
│   └── backoffice_agent_memory.json  # Complex multi-cycle workflow
│
├── screenshots/                      # UX reference images
│
├── docker-compose.yml                # Docker orchestration configuration
├── .gitignore                        # Git ignore patterns
│
├── README.md                         # Main project documentation
├── QUICKSTART.md                     # 5-minute quick start guide
├── TEST_EXAMPLES.md                  # Policy examples and testing guide
├── STATUS.md                         # Current application status
└── PROJECT_STRUCTURE.md              # This file

```

## Key Directories

### `/backend`
Contains the Python FastAPI backend with:
- RESTful API endpoints
- SQLAlchemy ORM models
- Policy evaluation engine
- Support for 5 policy types
- Integration with Anthropic and OpenAI APIs

### `/frontend`
Contains the React frontend with:
- Multi-page SPA using React Router
- Dashboard with compliance charts (Recharts)
- Policy editor with type-specific configuration
- Memory review with violation annotations
- Tool flow visualization

### `/sample_memories`
**Independent test data** separate from application code:
- Sample agent memory JSON files
- Test scenarios for different policy types
- Documentation for each test file
- Can be shared without sharing source code

### `/screenshots`
Reference images for UX design and inspiration

## Important Files

### Configuration
- `docker-compose.yml` - Service orchestration
- `backend/.env.example` - Environment variable template
- `backend/requirements.txt` - Python dependencies
- `frontend/package.json` - Node dependencies

### Documentation
- `README.md` - Complete project documentation
- `QUICKSTART.md` - Getting started in 5 minutes
- `TEST_EXAMPLES.md` - Policy examples and test scenarios
- `sample_memories/README.md` - Test data documentation

### Entry Points
- `backend/app/main.py` - Backend application
- `frontend/src/index.js` - Frontend application

## Data Flow

```
User → Frontend (React) → Backend API (FastAPI) → Database (SQLite)
                                    ↓
                          Policy Evaluator
                                    ↓
                          LLM APIs (optional)
```

## Runtime Artifacts

Created during application runtime (not in git):
- `backend/data/compliance.db` - SQLite database
- `frontend/build/` - Production build
- `node_modules/` - Node dependencies
- `__pycache__/` - Python bytecode

## Adding New Features

### New Policy Type
1. Add schema to `backend/app/schemas.py`
2. Add evaluation logic to `backend/app/services/policy_evaluator.py`
3. Add UI configuration in `frontend/src/components/PolicyEditor.js`

### New API Endpoint
1. Create route in `backend/app/routes/`
2. Add to `backend/app/main.py`
3. Add API call to `frontend/src/services/api.js`
4. Create/update UI component

### New Test Scenario
1. Create JSON file in `sample_memories/`
2. Document in `sample_memories/README.md`
3. Add examples to `TEST_EXAMPLES.md`
