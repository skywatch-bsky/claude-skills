---
name: search-incidents
description: >-
  Topic-based incident search with relevance scoring and content classification
  for AT Protocol investigations. Expands search topics into keyword strategies,
  classifies results by content type and incident confirmation, and produces
  geographically grouped output. Use when investigating incidents by topic during
  Phase 1 (Discovery) or as a standalone search.
user-invocable: false
---

# Search Incidents

This skill guides topic-based incident search across AT Protocol content. It defines how to expand a topic into effective search terms, how to classify each result for relevance and content type, and how to present findings grouped by geography with the most relevant results first.

Use this skill when an investigation starts from a topic or event (e.g., "drone strikes in region X", "election interference campaign targeting Y") rather than from a specific account.

## Input

The skill accepts a topic description — a natural language description of the incident or event to search for. Examples:
- "Drone strike casualties in [region]"
- "Election interference targeting [country]"
- "Coordinated harassment campaign against [person/group]"

## Phase 1: Keyword Expansion

Before dispatching search queries, expand the topic into a keyword strategy. This is critical — naive keyword searches miss relevant content and surface noise.

### Expansion Process

1. **Core terms:** Extract the essential nouns and verbs from the topic (e.g., "drone", "strike", "casualties")
2. **Synonyms and variants:** Add alternate terms for each core concept (e.g., "drone" -> "UAV", "unmanned"; "casualties" -> "killed", "dead", "victims", "fatalities")
3. **Regional terms:** If the topic has a geographic focus, include local-language terms and transliterations
4. **Platform-specific terms:** Consider how AT Protocol users discuss this topic (hashtags, common abbreviations, slang)
5. **Exclusion terms:** Identify terms that would produce false matches (e.g., for drone strikes, exclude "drone photography", "drone racing")

### Keyword Strategy Output

Before dispatching queries, document the keyword strategy:

```
**Topic:** [original topic]
**Core terms:** [list]
**Expanded terms:** [list with synonyms/variants]
**Regional terms:** [list, if applicable]
**Exclusion terms:** [list]
**Languages to search:** [list based on geographic focus]
```

## Phase 2: Data Collection

Dispatch the following research questions to the data-analyst agent. Use the keyword strategy to construct effective queries.

### 1. Content Search

**Dispatch to data-analyst:**
"Search osprey_execution_results for posts matching these terms: [expanded keyword list]. Use content_similarity or LIKE/iLIKE patterns as appropriate. Time range: [specified or default 30 days]. Return: post content, author DID, timestamp, any rules that matched, and the match context. Limit to 200 results ordered by recency."

### 2. Account Concentration

**Dispatch to data-analyst:**
"From the content search results, show the top 20 accounts by post count on this topic. For each account: DID, post count, earliest and latest post on topic, and whether they appear in any co-sharing clusters."

### 3. Temporal Distribution

**Dispatch to data-analyst:**
"Show the temporal distribution of posts matching [topic keywords] over [time range]. Group by day and show: date, post count, unique authors. Identify any spikes (days with 2x+ the average volume)."

### Handling Zero Results

If the content search returns no results:
1. Report: "No content matching [topic] found in the specified time range."
2. Suggest broadening: expand the time range, loosen keyword matching, or try alternate terms from the keyword strategy
3. Do NOT attempt classification on empty results — return the empty result with the explanation
