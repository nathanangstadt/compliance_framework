# Compliance Framework Changelog

## 2026-01-04 - Codex Updates

### 🔄 Composite-only policy clean-up and test fixes (by Codex)

- Removed unused legacy policy editors and deprecated session upload APIs from the frontend to enforce composite-only policies.
- Simplified Policies UI to show composite violation logic only (removed legacy type badges).
- Tightened backend schemas to accept only `policy_type: "composite"` and clarified policy model intent.
- Added pytest to backend dependencies plus sample memory fixtures (`sample_memories/backoffice_with_rejection.json`, `backoffice_with_approval.json`) so CI/local tests pass in Docker.
- Updated README/.env.example to emphasize Docker-only workflows and default Postgres usage.
- Aligned agent creation LLM model input with policy UX (free-text model entry).

Files touched include backend schemas/requirements, frontend policy/editor components, API client, create-agent modal, README, env example, and new sample memories.

## 2025-12-30 - Major Updates

### 📏 Enhanced Response Length Check Messages

**Problem Solved:**
Response Length check violations showed minimal information, making it hard to understand the requirement and actual token count.

**Solution Implemented:**
Enhanced the Response Length check to show detailed information in both passing and failing scenarios:
- **Failed checks**: Now shows "Response length 250 tokens exceeds limit of 100 tokens (exceeded by 150 tokens)"
- **Passed checks**: Now shows "Response length 75 tokens within 100 token limit"

**What This Means for Users:**
- ✅ See the exact token count at a glance
- ✅ Know the token limit requirement
- ✅ See how much the limit was exceeded by (for failures)
- ✅ Better visibility without needing to expand details

**Files Modified:**
- `backend/app/services/check_types.py` - Enhanced `ResponseLengthCheck` messages

---

### 🔧 Custom Violation Message Template Fix

**Problem Solved:**
Custom violation messages with template variables like `${params.status}` were displaying literally instead of substituting the actual parameter values.

**Solution Implemented:**
Enhanced the `LLMToolResponseCheck` class to include a `params` dictionary in the details object for template substitution. The params dictionary now contains the actual parameter values from tool responses.

**What This Means for Users:**
- ✅ Custom violation messages work correctly with template variables
- ✅ Use `${params.fieldname}` to reference tool response field values
- ✅ More informative and context-aware violation messages

**Example:**
```
"Approval status validation failed with human response of '${params.status}'."
```
Now correctly shows: `"Approval status validation failed with human response of 'Rejected'."`

**Files Modified:**
- `backend/app/services/check_types.py` - Added params dictionary to LLMToolResponseCheck details

---

### 🎯 LLM Validation: No More Magic Words!

**Problem Solved:**
Previously, LLM-based validation relied on undocumented "magic keywords" that policy managers had to guess. Prompts needed to include words like "compliant", "violation", "approved", or "rejected" for the system to correctly interpret results.

**Solution Implemented:**
The framework now automatically enhances user prompts with:
- Clear binary decision instructions (compliant yes/no)
- Structured JSON output formatting
- Format enforcement (prevents markdown issues)

**What This Means for Users:**
- ✅ Write prompts in plain natural language
- ✅ No special keywords required
- ✅ More reliable, deterministic results
- ✅ Better error messages with explanations

**Example:**

Before (fragile):
```
"Validate that the status indicates approval. Respond with compliant or violation."
```

Now (robust):
```
"Validate that the status indicates approval"
```

The framework automatically handles the rest!

**Technical Details:**
- User prompt is framed as compliance evaluation task
- Binary decision requested explicitly
- JSON format: `{"compliant": true/false, "reason": "explanation"}`
- Markdown code blocks are handled gracefully
- Fallback keyword detection for edge cases

**Files Modified:**
- `backend/app/services/check_types.py` - Enhanced `_validate_with_llm()` in both LLMToolResponseCheck and LLMResponseValidationCheck classes
- `LLM_VALIDATION_GUIDE.md` - Updated documentation with new approach

---

### 🌐 Multi-Vendor Message Format Support

**Problem Solved:**
The framework only supported Anthropic's message format (`role: "user"` for tool results), limiting compatibility with other LLM vendors.

**Solution Implemented:**
Added support for both industry standards:
- **OpenAI format**: `role: "tool"` (now the default)
- **Anthropic format**: `role: "user"` with `type: "tool_result"` (still supported)

**What This Means for Users:**
- ✅ Audit agent memories from any LLM provider
- ✅ No conversion needed for existing Anthropic memories
- ✅ Future-proof for new vendors
- ✅ Industry-standard format

**Files Modified:**
- `backend/app/services/check_types.py` - Updated `_find_tool_results()` methods
- `sample_memories/*.json` - Converted to OpenAI format
- `convert_to_openai_format.py` - Migration script created
- `MESSAGE_FORMAT_SUPPORT.md` - Comprehensive documentation

---

### 📊 Enhanced Compliance Reporting

**Problem Solved:**
Compliant policies showed minimal information, making it hard to understand WHY they passed.

**Solution Implemented:**
- Compliance details now shown with same richness as violations
- Expandable sections for triggered checks and passed requirements
- Green-themed UI for compliant policies
- Detailed breakdown of what passed

**What This Means for Users:**
- ✅ Full transparency for both passing and failing policies
- ✅ Better audit trails
- ✅ Easier to verify correct policy operation
- ✅ Consistent UI across all policy states

**Files Modified:**
- `backend/app/services/composite_policy_evaluator.py` - Return details for compliant cases
- `backend/app/schemas.py` - Added `compliance_details` field
- `backend/app/routes/compliance.py` - Separate violations from compliance_details
- `frontend/src/components/ViolationDisplay.js` - Render compliance details
- `frontend/src/components/ViolationDisplay.css` - Green styling for compliant cards

---

### 🎨 UI/UX Improvements

**Added:**
- Loading indicators for LLM-based evaluations
- Toast notifications for evaluation status
- Stacked bar charts in dashboard
- Policy names and descriptions throughout UI
- Default descriptions for REQUIRE_ALL policies
- Violation type badges for all policies

**Files Modified:**
- `frontend/src/pages/MemoriesPage.js` - Loading states and toasts
- `frontend/src/App.css` - Toast notification styles
- `frontend/src/pages/Dashboard.js` - Stacked bar charts
- `frontend/src/components/ViolationDisplay.js` - Enhanced display

---

## Testing

All tests pass with the new features:
- ✅ IF_ANY_THEN_ALL with LLM validation
- ✅ REQUIRE_ALL policies
- ✅ Tool absence checks
- ✅ Tool call count limits
- ✅ Response length validation
- ✅ Both OpenAI and Anthropic message formats

---

## Documentation

New comprehensive guides created:
- `LLM_VALIDATION_GUIDE.md` - How to write LLM validation prompts
- `MESSAGE_FORMAT_SUPPORT.md` - Multi-vendor message format support
- `CHANGELOG.md` - This file

---

## Migration Notes

### For Existing Deployments:

1. **LLM Validation Prompts**: Existing prompts will continue to work! The enhancement is backward compatible.

2. **Message Formats**: Both Anthropic and OpenAI formats are supported. No migration required.

3. **Sample Memories**: If you want to standardize on OpenAI format:
   ```bash
   python3 convert_to_openai_format.py
   ```

4. **Docker**: Restart containers to pick up changes:
   ```bash
   docker-compose restart backend frontend
   ```

---

## Breaking Changes

None! All changes are backward compatible.

---

## Contributors

- Enhanced LLM validation system
- Multi-vendor message format support
- Compliance details reporting
- UI/UX improvements
- Comprehensive documentation
