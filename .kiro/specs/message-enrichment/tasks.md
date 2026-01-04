# Implementation Tasks

## Task 1: Create Message Enrichment Module Structure

- [x] Create `apps/api/src/modules/ai/enrichment/` directory structure
- [x] Create `enrichment/types.ts` with interfaces (EnrichmentContext, EnrichmentResult, EnrichmentTrace)
- [x] Create `enrichment/index.ts` as module entry point

## Task 2: Implement Time Expression Enricher

- [x] Create `enrichment/enrichers/time-expression.ts`
- [x] Implement `TIME_EXPRESSIONS` mapping with date resolvers
- [x] Implement `enrichWithTimeContext()` function
- [x] Generate XML format `<time_resolved>` output
- [x] Handle edge cases: 今晚, 明晚, 周末, 下周X

## Task 3: Implement Location Context Enricher

- [x] Create `enrichment/enrichers/location-context.ts`
- [x] Implement `LOCATION_KEYWORDS` detection
- [x] Implement `enrichWithLocationContext()` function
- [x] Generate XML format `<user_location>` output
- [x] Handle missing location gracefully

## Task 4: Implement Draft Context Enricher

- [x] Create `enrichment/enrichers/draft-context.ts`
- [x] Implement `MODIFICATION_KEYWORDS` detection
- [x] Implement `enrichWithDraftContext()` function
- [x] Generate XML format `<draft_context>` output
- [x] Include all draft fields: title, location, locationHint, time, participants

## Task 5: Implement Pronoun Resolver

- [x] Create `enrichment/enrichers/pronoun-resolver.ts`
- [x] Implement `PRONOUNS` list (那个, 这个, 它, 那边, 那里)
- [x] Implement `findRecentActivity()` from conversation history
- [x] Implement `findRecentLocation()` from conversation history
- [x] Implement `resolvePronouns()` with fallback to original

## Task 6: Implement User Preference Enricher

- [x] Create `enrichment/enrichers/user-preference.ts`
- [x] Implement `RECOMMENDATION_KEYWORDS` detection
- [x] Query user's preferred activity type from history
- [x] Generate XML format `<user_preference>` output
- [x] Add 500ms timeout for database query

## Task 7: Implement Pipeline Orchestrator

- [x] Create `enrichment/pipeline.ts`
- [x] Implement `enrichMessages()` function
- [x] Chain all enrichers in correct order
- [x] Merge XML context parts into `<enrichment_hints>` block
- [x] Collect enrichment trace for debugging

## Task 8: Refactor System Prompt to XML Structure (Claude Best Practices)

- [x] Create `apps/api/src/modules/ai/prompts/xiaoju-v36.ts` (新版本)
- [x] Refactor prompt to use XML tags: `<system_role>`, `<persona>`, `<instructions>`, `<constraints>`
- [x] Add `<intent_classification>` with priority rules
- [x] Add `<output_format>` section
- [x] Refactor Few-Shot examples to use `<examples>` and `<example>` tags
- [x] Add `<tone>` section for style guidelines
- [x] Implement `buildXmlSystemPrompt()` function to generate XML-structured prompt with context injection

## Task 9: Integrate Enrichment into streamChat

- [x] Update `ai.service.ts` to call `enrichMessages()` before `streamText()`
- [x] Pass enrichment context (userId, location, draftContext, currentTime)
- [x] Inject contextXml into system prompt via `buildXmlSystemPrompt()`
- [x] Add enrichment trace to trace mode output
- [x] Ensure original messages are preserved in conversation history
- [x] Switch to xiaoju-v36 prompt
