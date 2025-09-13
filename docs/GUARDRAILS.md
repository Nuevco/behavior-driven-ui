# Development Guardrails & Workflow Rules

## Critical Workflow Rules

### 🚨 Authorization Requirements

#### Implementation Mode Control
- **NEVER make code changes without explicit authorization**
- **Only USER can authorize implementation mode**  
- **Must be OUT OF IMPLEMENTATION MODE by default**
- **Acknowledge mode restrictions when requested**
- **Ask for explicit permission before any code modifications**

#### Mode States
- 🟡 **PLANNING MODE**: Documentation, analysis, discussion only - NO CODE CHANGES (outside the docs folder)
- 🟢 **IMPLEMENTATION MODE**: Authorized to write, edit, and modify code
- 🔴 **RESTRICTED MODE**: No operations allowed

### 📋 Pre-Implementation Verification Requirements

#### Mandatory Checks Before ANY Code Changes (The "Rules")
**These checks MUST be completed BEFORE any work begins. If ANY check fails, work CANNOT start.**

1. **Git Status Check**: `git status` to understand current state
2. **Build Validation**: `npm run build` must pass without errors  
3. **Test Validation**: `npm test` must show all tests passing
4. **Branch Verification**: Confirm correct branch for changes

#### Failure Handling Rules
- **Build Failures**: Maximum 3 attempts to fix build issues
  - After 3 failed attempts, MUST STOP and report challenges to user
  - Cannot proceed with any code work until build passes
- **Test Failures**: Maximum 2 attempts to fix test issues
  - After 2 failed attempts, MUST STOP and report challenges to user
  - Cannot proceed with any code work until tests pass

#### The "Rules" Reference
- **When user says "remember your rules" or "follow the rules"**
- **This refers to the pre-implementation verification requirements above**
- **ALL rules must be followed in sequence BEFORE code changes**
- **No shortcuts or assumptions allowed**

### 🏗️ Architecture & Design Standards

#### Modular Design Requirements
- **NEVER create monolithic components**
- **Always design with separation of concerns**
- **Create focused, single-responsibility components**
- **Build reusable, composable pieces**

#### Component Architecture Rules
- **One component per file with clear naming**
- **Props interfaces defined for all components**
- **Consistent file and folder organization**
- **Follow established naming conventions**

### 🧪 Testing Requirements

#### Test Coverage Standards
- **ALL new functionality must have comprehensive tests**
- **Maintain existing test coverage - never break passing tests**
- **Add tests BEFORE claiming implementation is complete**
- **Fix broken tests immediately - do not leave failing tests**

#### Test Development Rules
- **Write tests that verify actual functionality**
- **Proper mocking of external dependencies**
- **Follow established testing patterns**
- **Validate both success and error scenarios**

### 📝 Code Quality Standards

#### Implementation Standards
- **TypeScript compliance required - zero compilation errors**
- **Follow established code patterns and conventions**  
- **Proper error handling and user feedback**
- **Consistent styling and UI patterns**

#### API Development Rules
- **Proper REST API principles (GET, PATCH, etc.)**
- **Comprehensive validation (client and server-side)**
- **Appropriate HTTP status codes and error messages**
- **CORS handling for all endpoints**

### 🚫 Critical Prohibitions

#### What I Must NEVER Do
- **Make code changes without explicit authorization**
- **Skip the pre-implementation verification steps**
- **Create monolithic components despite clear instructions**
- **Break existing tests or functionality**
- **Ignore established architecture patterns**
- **Make assumptions about what the user wants**

#### Common Failure Patterns to Avoid
- **"Close enough" mentality - precision is required**
- **Shortcuts that skip verification steps**
- **Implementing features without clear requirements**
- **Breaking working functionality while adding new features**

### 📊 Communication Standards

#### Status Reporting Requirements
- **Always acknowledge current mode restrictions**
- **Report test status accurately (X passing, Y failing)**
- **Clear communication about what was completed vs. remaining**
- **Honest reporting of any issues or blockers encountered**

#### Progress Tracking
- **Use TodoWrite tool for complex multi-step tasks**
- **Update todos in real-time as work progresses**
- **Mark todos complete only when fully finished**
- **Clean up stale todos that no longer match current work**

### 🔄 Workflow Process

#### Standard Development Workflow
1. **Receive Request**: Understand requirements clearly
2. **Check Mode**: Verify if in implementation mode or request authorization
3. **Pre-Implementation Verification**: Run all mandatory checks
4. **Plan & Design**: Create proper modular architecture plan
5. **Implement**: Write code following established patterns
6. **Test**: Ensure all tests pass and add new test coverage
7. **Validate**: Verify build and functionality work correctly
8. **Report**: Communicate completion status and any issues

#### Error Recovery Process
1. **Acknowledge the mistake immediately**
2. **Identify root cause of the error**
3. **Fix the issue completely - no partial solutions**
4. **Verify fix with full test suite**
5. **Learn from the mistake to prevent recurrence**

### 🎯 Success Criteria

#### Implementation Completion Checklist
**Work is NOT complete until ALL criteria are met:**
- ✅ All pre-implementation checks passed
- ✅ Code follows modular architecture principles  
- ✅ All tests passing (no regressions)
- ✅ Build passes without errors (`npm run build` successful)
- ✅ TypeScript compilation successful
- ✅ Functionality works as specified
- ✅ User feedback addressed appropriately

**CRITICAL**: Work is only complete when both build AND tests pass. No exceptions.

#### Quality Gates
- **Code Review**: Follows established patterns and standards
- **Test Coverage**: Comprehensive coverage of new functionality
- **Integration**: Works properly with existing system
- **Performance**: No regressions in build or runtime performance

## Escalation Procedures

### When Things Go Wrong
1. **Stop immediately** if any verification step fails
2. **Report the issue clearly** to the user
3. **Do not proceed** until issue is resolved
4. **Ask for guidance** if solution path is unclear

### Critical Failure Response
- **Acknowledge the mistake immediately and completely**
- **Take full responsibility without excuses**
- **Fix the issue thoroughly, not partially**
- **Verify the fix works completely**
- **Update process to prevent similar failures**

---

**Remember**: These guardrails exist to ensure quality, reliability, and proper communication. Following them strictly leads to successful implementations and maintains user trust.

**Violation of these guardrails is unacceptable and must be avoided at all costs.**