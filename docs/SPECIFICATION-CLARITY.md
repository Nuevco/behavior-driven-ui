# **🚨 SPECIFICATION CLARITY ISSUES**

Here are the **8 behavioral uncertainties** that need resolution before we can write proper tests:

---

## **1. Empty Features Array**
**Issue**: `defineConfig({ features: [] })` - Should empty features array be valid?

**Options:**
- **A) Allow empty array** - Valid configuration, no features to run
- **B) Require at least one feature** - Throw ConfigValidationError

**Pros/Cons:**
- **A Pros**: Flexible for conditional setups, valid edge case
- **A Cons**: Running with no features seems pointless
- **B Pros**: Prevents likely configuration mistakes
- **B Cons**: Less flexible, harder to build configs conditionally

**Recommendation**: **Option A (Allow)** - Empty array is valid. Users might want to conditionally add features or start with empty config.

---

## **2. Null BaseURL**
**Issue**: `defineConfig({ baseURL: null })` - Should null baseURL throw or be treated as undefined?

**Options:**
- **A) Treat null as undefined** - No navigation in beforeScenario()
- **B) Throw ConfigValidationError** - Null is invalid, must be string or undefined

**Pros/Cons:**
- **A Pros**: Flexible, matches JavaScript null/undefined patterns
- **A Cons**: Inconsistent with TypeScript strict typing
- **B Pros**: Clear error early, matches strict typing
- **B Cons**: Less forgiving for JavaScript users

**Recommendation**: **Option B (Throw)** - Null should throw. TypeScript types should be `string | undefined`, null indicates likely error.

---

## **3. Undefined Config in Merge**
**Issue**: `mergeConfigurations(undefined, config)` - Should undefined configs throw or be ignored?

**Options:**
- **A) Treat undefined as empty object** - Merge proceeds normally
- **B) Throw ConfigMergeError** - Both configs must be defined
- **C) Return the defined config unchanged** - Skip merge for undefined

**Pros/Cons:**
- **A Pros**: Most flexible, handles edge cases gracefully
- **A Cons**: Might hide bugs where config is unexpectedly undefined
- **B Pros**: Strict validation catches errors early
- **B Cons**: Less flexible for conditional merging
- **C Pros**: Intuitive behavior, practical for optional overrides
- **C Cons**: Asymmetric behavior (undefined base vs undefined override)

**Recommendation**: **Option C** - If base is undefined, return override. If override is undefined, return base. This matches practical usage patterns.

---

## **4. Circular Tag References**
**Issue**: Tag A references tag B which references tag A - what happens?

**Options:**
- **A) Throw ConfigMergeError** - Detect and reject circular references
- **B) Apply once and stop** - Use first reference, ignore subsequent
- **C) Maximum depth limit** - Allow up to N levels of nesting

**Pros/Cons:**
- **A Pros**: Clear error, prevents infinite loops
- **A Cons**: Requires cycle detection algorithm
- **B Pros**: Simple implementation, predictable behavior
- **B Cons**: Might miss intended config inheritance
- **C Pros**: Practical compromise, handles most real cases
- **C Cons**: Arbitrary limit, complex edge cases

**Recommendation**: **Option A (Throw)** - Circular references indicate configuration error and should be caught early.

---

## **5. World.setData with Undefined Value**
**Issue**: `world.setData('key', undefined)` - Should undefined values be stored or treated as deletion?

**Options:**
- **A) Store undefined value** - `getData('key')` returns undefined, `hasData('key')` returns true
- **B) Treat as deletion** - Remove key entirely, `hasData('key')` returns false
- **C) Throw error** - Undefined values not allowed

**Pros/Cons:**
- **A Pros**: Consistent with JavaScript Map behavior, explicit undefined
- **A Cons**: Confusing since getData() always returns undefined for missing keys
- **B Pros**: Clear semantic difference between "exists with undefined" vs "doesn't exist"
- **B Cons**: Different from Map behavior, might surprise users
- **C Pros**: Forces explicit intent, clearer API
- **C Cons**: Less flexible, more restrictive

**Recommendation**: **Option B (Treat as deletion)** - `setData(key, undefined)` should delete the key. This provides semantic clarity between "exists with undefined value" vs "doesn't exist".

---

## **6. Page Object Constructor Errors**
**Issue**: `world.createPageObject(BadConstructor)` - If constructor throws, should World catch/wrap error or let it bubble?

**Options:**
- **A) Let constructor errors bubble** - Raw error thrown to caller
- **B) Wrap in custom error** - Catch and throw WorldError with context
- **C) Cache the error** - Store error and re-throw on subsequent calls

**Pros/Cons:**
- **A Pros**: Transparent error handling, simple implementation
- **A Cons**: Less context about where error occurred
- **B Pros**: Better error context, consistent error handling
- **B Cons**: Hides original stack trace unless carefully preserved
- **C Pros**: Consistent caching behavior even for errors
- **C Cons**: Complex implementation, potentially confusing

**Recommendation**: **Option A (Let bubble)** - Constructor errors should bubble transparently. Page object construction is developer responsibility.

---

## **7. Multiple beforeScenario() Calls**
**Issue**: If `beforeScenario()` called multiple times, should subsequent calls be no-ops or reset state?

**Options:**
- **A) No-op after first call** - Only first call does work
- **B) Reset state each time** - Clear data/page objects, navigate again
- **C) Throw error** - Multiple calls indicate framework misuse

**Pros/Cons:**
- **A Pros**: Safe, prevents duplicate work
- **A Cons**: Might hide framework bugs
- **B Pros**: Predictable reset behavior, idempotent
- **B Cons**: Unnecessary work, potential navigation overhead
- **C Pros**: Catches framework integration errors
- **C Cons**: Less forgiving, harder to debug

**Recommendation**: **Option B (Reset each time)** - Each call should clear state and navigate. This makes the method idempotent and predictable.

---

## **8. destroy() Called Twice**
**Issue**: `world.destroy()` called twice - should second call be no-op or throw?

**Options:**
- **A) No-op after first call** - Subsequent calls do nothing
- **B) Throw error** - Multiple destroy calls indicate misuse
- **C) Reset and destroy again** - Allow re-destruction

**Pros/Cons:**
- **A Pros**: Safe, matches common dispose patterns
- **A Cons**: Might hide double-cleanup bugs
- **B Pros**: Catches double-cleanup bugs early
- **B Cons**: Less forgiving in complex cleanup scenarios
- **C Pros**: Flexible, allows re-initialization patterns
- **C Cons**: Likely indicates design problems

**Recommendation**: **Option A (No-op)** - Multiple destroy() calls should be safe no-ops. This matches common resource disposal patterns and prevents errors in complex cleanup scenarios.

---

## **📋 SUMMARY OF RECOMMENDATIONS**

1. **Empty features array**: ✅ **Allow** (valid edge case)
2. **Null baseURL**: ❌ **Throw** (strict typing enforcement)
3. **Undefined in merge**: ✅ **Return defined config** (practical usage)
4. **Circular tag references**: ❌ **Throw** (configuration error)
5. **setData(key, undefined)**: 🗑️ **Delete key** (semantic clarity)
6. **Page object constructor errors**: ⬆️ **Let bubble** (transparent errors)
7. **Multiple beforeScenario()**: 🔄 **Reset each time** (idempotent behavior)
8. **Multiple destroy()**: ✅ **No-op** (safe disposal pattern)

---

## **📝 DECISION LOG**

**To be filled in as we review each item...**

| Issue | Decision | Rationale |
|-------|----------|-----------|
| 1. Empty features array | | |
| 2. Null baseURL | | |
| 3. Undefined in merge | | |
| 4. Circular tag references | | |
| 5. setData(key, undefined) | | |
| 6. Page object constructor errors | | |
| 7. Multiple beforeScenario() | | |
| 8. Multiple destroy() | | |