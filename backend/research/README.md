# WorkMate Research Setup

This folder contains a complete A/B/C benchmark setup:

- `dataset.jsonl` -> research prompts with expected outputs
- `benchmark.js` -> compares 3 methods:
  - `rule-based`
  - `llm-only`
  - `hybrid` (your app pipeline)

## Run

From `backend`:

```bash
npm run research:benchmark
```

## Output

After running:

- `research/results-latest.json` -> full per-prompt outputs
- `research/results-latest.md` -> summary table for report

