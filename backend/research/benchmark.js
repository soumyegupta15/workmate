'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { processPrompt } = require('../services/aiService');

const DATASET_PATH = path.join(__dirname, 'dataset.jsonl');
const RESULTS_JSON_PATH = path.join(__dirname, 'results-latest.json');
const RESULTS_MD_PATH = path.join(__dirname, 'results-latest.md');
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

function loadDataset(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function normalize(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim().toLowerCase();
}

function getByPath(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function expectedPaths(expectedObj) {
  const paths = [];
  function walk(node, prefix = '') {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      if (prefix) paths.push(prefix);
      return;
    }
    for (const key of Object.keys(node)) {
      const next = prefix ? `${prefix}.${key}` : key;
      walk(node[key], next);
    }
  }
  walk(expectedObj);
  return paths;
}

function extractJson(text) {
  if (!text) return null;
  const direct = String(text).trim();
  try {
    return JSON.parse(direct);
  } catch {
    // continue
  }

  const match = direct.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = { raw: body };
          }
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: parsed,
          });
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(options.timeoutMs || 20000, () => {
      req.destroy(new Error(`Request timeout after ${options.timeoutMs || 20000}ms`));
    });
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function ruleBasedPredict(prompt) {
  const p = String(prompt || '').trim();
  const lower = p.toLowerCase();

  if (lower.includes('add') && lower.includes('project') && lower.includes('member')) {
    const m = p.match(/add(?:\s+project\s+member)?\s+(.+?)\s+to\s+(?:project\s*:?\s*)?(.+?)(?:\s+project)?$/i);
    return {
      action: 'add_project_member',
      data: {
        user: m ? String(m[1]).trim() : undefined,
        project: m ? String(m[2]).trim() : undefined,
      },
    };
  }

  if (lower.startsWith('create') && lower.includes('task')) {
    const m = p.match(/create(?:\s+a)?\s+task(?:\s+called)?\s+(.+?)\s+(?:and\s+)?assign(?:\s+it)?\s+to\s+(.+?)\s+in\s+(.+?)(?:\s+project)?(?:\s+with\s+(.+?)\s+priority)?$/i);
    if (m) {
      return {
        action: 'create_task',
        data: {
          title: String(m[1]).trim(),
          assignee: String(m[2]).trim(),
          project: String(m[3]).replace(/^project\s*:\s*/i, '').trim(),
          priority: m[4] ? String(m[4]).trim().toLowerCase() : undefined,
        },
      };
    }
    return { action: 'create_task', data: {} };
  }

  if (lower.startsWith('create') && lower.includes('project')) {
    const m = p.match(/create\s+project(?:\s+called|\s+named)?\s+(.+?)(?:\s+starting\s+(.+))?$/i);
    return {
      action: 'create_project',
      data: {
        name: m ? String(m[1]).trim() : undefined,
        start_date: m && m[2] ? String(m[2]).trim() : undefined,
      },
    };
  }

  if (lower.includes('update') && lower.includes('task')) {
    const m = p.match(/update\s+task(?:\s+called)?\s+(.+?)\s+(?:to|status)\s+(.+)$/i);
    return {
      action: 'update_task',
      filters: { title: m ? String(m[1]).trim() : undefined },
      update: { status: m ? normalize(m[2]).replace(/\s+/g, '_') : undefined },
    };
  }

  if (lower.includes('assign')) {
    const m = p.match(/assign(?:\s+task)?\s+(.+?)\s+to\s+(.+?)(?:\s+by\s+(.+))?$/i);
    return {
      action: 'assign',
      filters: { title: m ? String(m[1]).trim() : undefined },
      update: {
        assignee: m ? String(m[2]).trim() : undefined,
        due_date: m && m[3] ? String(m[3]).trim() : undefined,
      },
    };
  }

  if (lower.includes('comment')) {
    const m = p.match(/(?:comment(?:\s+on)?\s+task\s+(.+?)\s*:\s*(.+))|(?:comment:\s*(.+))/i);
    if (m && m[1] && m[2]) {
      return { action: 'comment', filters: { title: String(m[1]).trim() }, data: { body: String(m[2]).trim() } };
    }
    return { action: 'comment', data: { body: m && m[3] ? String(m[3]).trim() : undefined } };
  }

  return { action: 'unknown' };
}

async function llmOnlyPredict(prompt) {
  const system = 'Convert instruction to JSON with action/data/filters/update only.';
  const response = await makeRequest(`${OLLAMA_API_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    timeoutMs: 25000,
    body: {
      model: 'phi3',
      prompt: String(prompt),
      system,
      stream: false,
      options: { temperature: 0.1, top_p: 0.9, top_k: 40 },
    },
  });
  if (!response.ok) throw new Error(`llm-only HTTP ${response.status}`);
  const text = response.data?.response || response.data?.text || response.data?.raw || '';
  return extractJson(text) || { action: 'parse_error' };
}

async function hybridPredict(prompt) {
  return Promise.race([
    processPrompt(String(prompt)),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Hybrid timeout after 30s')), 30000)),
  ]);
}

function scorePrediction(expected, actual) {
  const paths = expectedPaths(expected);
  let matched = 0;
  for (const keyPath of paths) {
    const e = normalize(getByPath(expected, keyPath));
    const a = normalize(getByPath(actual, keyPath));
    if (e && e === a) matched += 1;
  }
  const total = paths.length;
  const fieldAccuracy = total > 0 ? matched / total : 0;
  const exact = total > 0 && matched === total;
  const intentCorrect = normalize(expected.action) === normalize(actual.action);
  return { totalFields: total, matchedFields: matched, fieldAccuracy, exact, intentCorrect };
}

async function runMethod(methodName, predictor, dataset) {
  const rows = [];
  let intentHits = 0;
  let exactHits = 0;
  let totalFields = 0;
  let matchedFields = 0;
  let latencySum = 0;
  let failCount = 0;

  for (const item of dataset) {
    const start = Date.now();
    let actual;
    let error = null;
    try {
      actual = await predictor(item.prompt);
    } catch (e) {
      error = e;
      actual = { action: 'error', error: e.message };
      failCount += 1;
    }
    const latencyMs = Date.now() - start;
    latencySum += latencyMs;

    const score = scorePrediction(item.expected, actual);
    if (score.intentCorrect) intentHits += 1;
    if (score.exact) exactHits += 1;
    totalFields += score.totalFields;
    matchedFields += score.matchedFields;

    rows.push({
      id: item.id,
      prompt: item.prompt,
      expected: item.expected,
      actual,
      latencyMs,
      error: error ? error.message : null,
      ...score,
    });
  }

  const total = dataset.length;
  return {
    method: methodName,
    total,
    intentAccuracy: total ? intentHits / total : 0,
    exactMatchAccuracy: total ? exactHits / total : 0,
    fieldAccuracy: totalFields ? matchedFields / totalFields : 0,
    avgLatencyMs: total ? latencySum / total : 0,
    failRate: total ? failCount / total : 0,
    rows,
  };
}

function toPercent(v) {
  return `${(v * 100).toFixed(2)}%`;
}

function buildMarkdown(summary) {
  const lines = [];
  lines.push('# WorkMate AI Research Benchmark');
  lines.push('');
  lines.push('| Method | Intent Accuracy | Exact Match | Field Accuracy | Avg Latency (ms) | Fail Rate |');
  lines.push('|---|---:|---:|---:|---:|---:|');
  for (const s of summary) {
    lines.push(
      `| ${s.method} | ${toPercent(s.intentAccuracy)} | ${toPercent(s.exactMatchAccuracy)} | ${toPercent(
        s.fieldAccuracy
      )} | ${s.avgLatencyMs.toFixed(2)} | ${toPercent(s.failRate)} |`
    );
  }
  lines.push('');
  lines.push('Generated by `npm run research:benchmark`.');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const datasetFull = loadDataset(DATASET_PATH);
  const datasetLimit = Number(process.env.BENCHMARK_LIMIT || 0);
  const dataset = datasetLimit > 0 ? datasetFull.slice(0, datasetLimit) : datasetFull;
  if (!dataset.length) throw new Error('Dataset is empty');

  console.log(`Loaded ${dataset.length} prompts from dataset.jsonl`);
  console.log('Running method: rule-based');
  const rule = await runMethod('rule-based', async (p) => ruleBasedPredict(p), dataset);

  console.log('Running method: llm-only');
  const llm = await runMethod('llm-only', async (p) => llmOnlyPredict(p), dataset);

  console.log('Running method: hybrid');
  const hybrid = await runMethod('hybrid', async (p) => hybridPredict(p), dataset);

  const summary = [rule, llm, hybrid].map((r) => ({
    method: r.method,
    total: r.total,
    intentAccuracy: r.intentAccuracy,
    exactMatchAccuracy: r.exactMatchAccuracy,
    fieldAccuracy: r.fieldAccuracy,
    avgLatencyMs: r.avgLatencyMs,
    failRate: r.failRate,
  }));

  const resultObj = {
    generatedAt: new Date().toISOString(),
    datasetSize: dataset.length,
    summary,
    details: {
      ruleBased: rule.rows,
      llmOnly: llm.rows,
      hybrid: hybrid.rows,
    },
  };

  fs.writeFileSync(RESULTS_JSON_PATH, JSON.stringify(resultObj, null, 2), 'utf8');
  fs.writeFileSync(RESULTS_MD_PATH, buildMarkdown(summary), 'utf8');

  console.log('\n=== Benchmark Summary ===');
  for (const s of summary) {
    console.log(
      `${s.method.padEnd(10)} | intent ${toPercent(s.intentAccuracy)} | exact ${toPercent(
        s.exactMatchAccuracy
      )} | field ${toPercent(s.fieldAccuracy)} | latency ${s.avgLatencyMs.toFixed(2)} ms | fail ${toPercent(
        s.failRate
      )}`
    );
  }
  console.log(`\nSaved: ${RESULTS_JSON_PATH}`);
  console.log(`Saved: ${RESULTS_MD_PATH}`);
}

main().catch((error) => {
  console.error('Benchmark failed:', error.message);
  process.exit(1);
});
