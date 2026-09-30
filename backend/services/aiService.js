'use strict';

const http = require('http');
const https = require('https');
const { readFileSync } = require('fs');
const { join } = require('path');

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

/**
 * Read dataset for few-shot learning examples
 */
function loadDataset() {
  try {
    const datasetPath = join(process.cwd(), 'dataset');
    const content = readFileSync(datasetPath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    const parsed = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    // Prioritize examples that match common patterns
    const prioritized = [];
    const others = [];
    
    parsed.forEach(ex => {
      const instruction = ex.instruction?.toLowerCase() || '';
      // Prioritize examples with "create task" and assignment patterns
      if (instruction.includes('create') && instruction.includes('task') && 
          (instruction.includes('assign') || instruction.includes('to '))) {
        prioritized.push(ex);
      } else {
        others.push(ex);
      }
    });
    
    // Return prioritized examples first, then others, up to 25 total
    const selected = [...prioritized, ...others].slice(0, 25);
    return selected;
  } catch (error) {
    console.warn('Could not load dataset:', error.message);
    return [];
  }
}

/**
 * Generate system prompt with few-shot examples
 */
function generateSystemPrompt() {
  const examples = loadDataset();
  const examplesText = examples.map(ex => {
    return `Instruction: "${ex.instruction}"\nOutput: ${JSON.stringify(ex.output)}`;
  }).join('\n\n');

  return `You are an AI assistant that converts natural language instructions into structured JSON actions for task management.

CRITICAL EXTRACTION RULES:
1. For "create_task" action:
   - Extract task title from phrases like "task called [title]", "task named [title]", "create [title] task", or just "[title]"
   - Extract project name from phrases like "in [project] project", "under [project]", "for [project]", or "[project] project"
   - Extract assignee from phrases like "assign it to [name]", "assign to [name]", "for [name]", or "[name]"
   - Extract priority from "low/medium/high/critical priority" or "priority [level]"
   - Extract due date from "by [date]", "due [date]", or relative dates like "tomorrow", "next week"

2. For "create_project" action:
   - Extract project name from "project called [name]", "project named [name]", or just "[name]"
   - Extract team_lead from "team lead [name]" or "lead [name]"
   - Extract start_date from "starting [date]" or relative dates

3. For "add_project_member" action:
   - Extract user/member name from "add [name]", "add member [name]", "add [name] to", or "[name]"
   - Extract project name from "to project [name]", "to [name] project", "in [name] project", or "[name]"
   - Recognize patterns like "Add [name] to project [project]", "Add project member [name] to [project]"

4. Field extraction patterns:
   - "task called X" or "task named X" → title: "X"
   - "in X project" or "under X" → project: "X"
   - "assign it to X" or "assign to X" → assignee: "X"
   - "X priority" → priority: "X"
   - "by X" or "due X" → due_date: "X"

Available actions and their required fields:
- create_project: { name (required), team_lead (optional), start_date (optional) }
- create_task: { title (required), project (required), assignee (optional), priority (optional), due_date (optional) }
- update_project: { filters: { name (required) }, update: { status/priority/name (optional) } }
- update_task: { filters: { title (required) }, update: { status/priority/due_date/assignee (optional) } }
- assign: { filters: { title/status/team (optional) }, update: { assignee (required), due_date (optional) } }
- add_project_member: { data: { project (required), user (required) } }
- comment: { filters: { title (required) }, data: { body (required) } }
- notify: { data: { user (required), title (required), message (required) } }

Examples:
${examplesText}

IMPORTANT EXAMPLES - Study these patterns carefully:

Example 1: "Create a task called Fix login bug and assign it to Tanmay in workmate project"
Output: {"action": "create_task", "data": {"title": "Fix login bug", "assignee": "Tanmay", "project": "workmate"}}

Example 2: "Create a task called Header Alignment Bug under the Website Revamp project and assign it to Rohan"
Output: {"action": "create_task", "data": {"title": "Header Alignment Bug", "project": "Website Revamp", "assignee": "Rohan"}}

Example 3: "Create task Backend API Integration for Amit in E-commerce Portal project"
Output: {"action": "create_task", "data": {"title": "Backend API Integration", "assignee": "Amit", "project": "E-commerce Portal"}}

Example 4: "Add project member Tanmay to project workmate"
Output: {"action": "add_project_member", "data": {"user": "Tanmay", "project": "workmate"}}

Example 5: "Add Tanmay to workmate project"
Output: {"action": "add_project_member", "data": {"user": "Tanmay", "project": "workmate"}}

CRITICAL: When you see patterns like:
- "Create a task called [TITLE] and assign it to [NAME] in [PROJECT] project"
  → Extract: title, assignee, project
- "Create task [TITLE] for [NAME] in [PROJECT]"
  → Extract: title, assignee, project
- "Create [TITLE] task and assign to [NAME] in [PROJECT] project"
  → Extract: title, assignee, project
- "Add project member [NAME] to project [PROJECT]"
  → Extract: action="add_project_member", user="[NAME]", project="[PROJECT]"
- "Add [NAME] to [PROJECT] project"
  → Extract: action="add_project_member", user="[NAME]", project="[PROJECT]"

You MUST extract ALL fields mentioned. Do NOT ask for missing fields if they are clearly stated in the instruction.

Return only valid JSON with the "action" field and appropriate "data", "filters", or "update" fields. No additional text, no explanations, no markdown.`;
}

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => Promise.resolve(JSON.parse(data)) });
        } catch {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => Promise.resolve({ response: data }) });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * Call Ollama API to generate response
 */
async function callOllama(prompt) {
  const ollamaUrl = OLLAMA_API_URL || 'http://localhost:11434';
  
  try {
    const response = await makeRequest(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        model: 'phi3',
        prompt: prompt,
        system: generateSystemPrompt(),
        stream: false,
        options: {
          temperature: 0.1, // Lower temperature for more deterministic, accurate extraction
          top_p: 0.9,
          top_k: 40,
        }
      }
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || data.text || '';
  } catch (error) {
    // Fallback: try with phi3:mini
    if (error.message.includes('phi3') || error.message.includes('not found')) {
      try {
        const fallbackResponse = await makeRequest(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            model: 'phi3:mini',
            prompt: prompt,
            system: generateSystemPrompt(),
            stream: false,
            options: {
              temperature: 0.1, // Lower temperature for more deterministic, accurate extraction
              top_p: 0.9,
              top_k: 40,
            }
          }
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return fallbackData.response || fallbackData.text || '';
        }
      } catch (fallbackError) {
        console.error('Fallback model also failed:', fallbackError);
      }
    }
    throw error;
  }
}

/**
 * Pull JSON out of ```json ... ``` or ``` ... ``` fences (models often wrap output this way).
 */
function stripMarkdownCodeFences(raw) {
  let t = String(raw || '').trim();
  const fenced = t.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  t = t.replace(/^```(?:json|JSON)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return t;
}

/**
 * From first '{', find the matching '}' so we do not greedily swallow extra text after the object.
 */
function extractBalancedJsonObject(s) {
  const str = String(s || '');
  const start = str.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < str.length; i++) {
    const c = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{') depth += 1;
    if (c === '}') {
      depth -= 1;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Parse AI response to extract JSON (handles markdown fences + trailing model chatter).
 */
function extractJSON(text) {
  const cleaned = stripMarkdownCodeFences(text);
  const candidates = [cleaned, String(text || '').trim()].filter(Boolean);

  for (const chunk of candidates) {
    const balanced = extractBalancedJsonObject(chunk);
    if (balanced) {
      try {
        return JSON.parse(balanced);
      } catch (err) {
        console.error('[aiService] JSON.parse balanced failed:', err.message);
      }
    }
    try {
      return JSON.parse(chunk.trim());
    } catch {
      // continue
    }
  }

  throw new Error(
    `Failed to parse AI response as JSON: ${String(text).substring(0, 200)}`
  );
}

/**
 * Process user prompt and return structured action
 */
async function processPrompt(userPrompt) {
  if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
    throw new Error('Prompt is required');
  }

  const prompt = `Analyze this instruction word by word and extract ALL information:

"${userPrompt.trim()}"

Step-by-step extraction:
1. Identify the action: Look for "create task", "create project", "update task", "assign", etc.
2. Extract task title: Find text after "task called", "task named", or the task name itself
3. Extract project name: Find text after "in", "under", "for" followed by "project" or project name
4. Extract assignee: Find name after "assign it to", "assign to", "to [name] in", or name before "in [project]"
5. Extract priority: Find "low/medium/high/critical priority" or "priority [level]"
6. Extract due date: Find "by [date]", "due [date]", or relative dates

SPECIFIC PATTERN RECOGNITION:
- "Create a task called [TITLE] and assign it to [NAME] in [PROJECT] project"
  → title: "[TITLE]", assignee: "[NAME]", project: "[PROJECT]"
- "Create task [TITLE] for [NAME] in [PROJECT]"
  → title: "[TITLE]", assignee: "[NAME]", project: "[PROJECT]"
- "Create [TITLE] task and assign to [NAME] in [PROJECT]"
  → title: "[TITLE]", assignee: "[NAME]", project: "[PROJECT]"

Convert the instruction into a structured JSON action. Extract EVERYTHING mentioned.

Return ONLY valid JSON. No explanations, no markdown, no code blocks. Just the JSON object.`;

  try {
    const aiResponse = await callOllama(prompt);
    const action = extractJSON(aiResponse);
    
    console.log('[aiService] Raw AI response:', aiResponse);
    console.log('[aiService] Parsed action:', JSON.stringify(action, null, 2));
    
    // Validate action structure
    if (!action.action) {
      throw new Error('AI response missing required "action" field');
    }

    // Post-process to ensure common patterns are captured
    const processedAction = postProcessAction(action, userPrompt);
    
    return processedAction;
  } catch (error) {
    console.error('AI processing error:', error);
    throw new Error(`Failed to process prompt: ${error.message}`);
  }
}

/**
 * Post-process action to fix common extraction issues
 */
function postProcessAction(action, originalPrompt) {
  const prompt = originalPrompt.toLowerCase();
  
  function cleanProjectName(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw
      .replace(/^project\s*:\s*/i, '')
      .replace(/^project\s+/i, '')
      .trim();
  }
  
  // For add_project_member, try to extract fields
  if (action.action === 'add_project_member' || prompt.includes('add') && (prompt.includes('member') || prompt.includes('to project'))) {
    if (!action.data) {
      action.data = {};
    }
    
    // Pattern: "Add project member [NAME] to project [PROJECT]"
    const pattern1 = originalPrompt.match(/add\s+(?:project\s+)?member\s+([^"']+?)\s+to\s+(?:project\s+)?([^"']+?)(?:\s+project)?/i);
    if (pattern1) {
      action.action = 'add_project_member';
      action.data = {
        user: pattern1[1].trim(),
        project: pattern1[2].trim()
      };
      console.log('[aiService] Post-processed add_project_member using pattern 1:', action.data);
      return action;
    }
    
    // Pattern: "Add [NAME] to project [PROJECT]"
    const pattern2 = originalPrompt.match(/add\s+([^"']+?)\s+to\s+(?:project\s+)?([^"']+?)(?:\s+project)?/i);
    if (pattern2 && !action.data.user && !action.data.project) {
      action.action = 'add_project_member';
      action.data = {
        user: pattern2[1].trim(),
        project: pattern2[2].trim()
      };
      console.log('[aiService] Post-processed add_project_member using pattern 2:', action.data);
      return action;
    }
  }
  
  // For create_task, try to extract missing fields from the prompt
  if (action.action === 'create_task') {
    if (!action.data) {
      action.data = {};
    }
    
    // Pattern 0: "in Project: [PROJECT] project"
    const projectColonPattern = originalPrompt.match(/in\s+project\s*:\s*([^"']+?)(?:\s+project)?(?:\s+and|\s+assign|$)/i);
    if (projectColonPattern && projectColonPattern[1]) {
      action.data.project = cleanProjectName(projectColonPattern[1]);
    }

    // Pattern 1: "Create a task called [TITLE] and assign it to [NAME] in [PROJECT] project"
    const pattern1 = originalPrompt.match(/create\s+(?:a\s+)?task\s+called\s+([^"']+?)\s+and\s+assign\s+it\s+to\s+([^"']+?)\s+in\s+([^"']+?)(?:\s+project)?(?:\s+with|\s+and|$)/i);
    if (pattern1) {
      action.data.title = pattern1[1].trim();
      action.data.assignee = pattern1[2].trim();
      action.data.project = cleanProjectName(pattern1[3]);
      console.log('[aiService] Post-processed using pattern 1:', action.data);
      return action;
    }
    
    // Pattern 2: "Create task [TITLE] for [NAME] in [PROJECT]"
    const pattern2 = originalPrompt.match(/create\s+task\s+([^"']+?)\s+for\s+([^"']+?)\s+in\s+([^"']+?)(?:\s+project)?(?:\s+with|\s+and|$)/i);
    if (pattern2) {
      action.data.title = pattern2[1].trim();
      action.data.assignee = pattern2[2].trim();
      action.data.project = cleanProjectName(pattern2[3]);
      console.log('[aiService] Post-processed using pattern 2:', action.data);
      return action;
    }
    
    // Pattern 3: "Create [TITLE] task and assign to [NAME] in [PROJECT]"
    const pattern3 = originalPrompt.match(/create\s+([^"']+?)\s+task\s+and\s+assign\s+to\s+([^"']+?)\s+in\s+([^"']+?)(?:\s+project)?(?:\s+with|\s+and|$)/i);
    if (pattern3) {
      action.data.title = pattern3[1].trim();
      action.data.assignee = pattern3[2].trim();
      action.data.project = cleanProjectName(pattern3[3]);
      console.log('[aiService] Post-processed using pattern 3:', action.data);
      return action;
    }

    // Pattern 4: "Create a task [TITLE] assign to [NAME] in [PROJECT] with [priority] priority"
    const pattern4 = originalPrompt.match(
      /create\s+(?:a\s+)?task\s+(.+?)\s+assign\s+to\s+(.+?)\s+in\s+(.+?)(?:\s+with\s+(\w+)\s+priority)?(?:\s+project)?$/i
    );
    if (pattern4) {
      action.data.title = pattern4[1].trim();
      action.data.assignee = pattern4[2].trim();
      action.data.project = cleanProjectName(pattern4[3]);
      if (pattern4[4]) {
        action.data.priority = String(pattern4[4]).trim().toLowerCase();
      }
      console.log('[aiService] Post-processed using pattern 4:', action.data);
      return action;
    }
    
    // Extract task title if missing
    if (!action.data.title || !action.data.title.trim()) {
      // Look for patterns like "task called X", "task named X"
      const titleMatch = originalPrompt.match(/task\s+(?:called|named)\s+([^"']+?)(?:\s+and|\s+in|\s+under|\s+assign|$)/i);
      if (titleMatch && titleMatch[1]) {
        action.data.title = titleMatch[1].trim();
      } else {
        // Try to extract after "create" and before "and" or "in"
        const createMatch = originalPrompt.match(/create\s+(?:a\s+)?task\s+(?:called\s+|named\s+)?["']?([^"']+?)["']?(?:\s+and|\s+in|\s+under)/i);
        if (createMatch && createMatch[1]) {
          action.data.title = createMatch[1].trim();
        }
      }
    }
    
    // Extract project name if missing
    if (!action.data.project || !action.data.project.trim()) {
      // Look for patterns like "in X project", "under X", "for X project"
      const projectMatch = originalPrompt.match(/(?:in|under|for)\s+([^"']+?)(?:\s+project)?(?:\s+and|\s+assign|$)/i);
      if (projectMatch && projectMatch[1]) {
        action.data.project = cleanProjectName(projectMatch[1]);
      }
    }
    
    if (action.data.project) {
      action.data.project = cleanProjectName(action.data.project);
    }
    
    // If project extraction became too short (e.g., "P"), recover from explicit "Project: ..."
    if (action.data.project && action.data.project.length <= 2) {
      const recoverColon = originalPrompt.match(/project\s*:\s*([^"']+?)(?:\s+project|\s+with|\s+and|$)/i);
      if (recoverColon && recoverColon[1]) {
        action.data.project = cleanProjectName(recoverColon[1]);
      } else {
        const recoverInProject = originalPrompt.match(/in\s+([^"']+?)\s+project(?:\s+with|\s+and|$)/i);
        if (recoverInProject && recoverInProject[1]) {
          action.data.project = cleanProjectName(recoverInProject[1]);
        }
      }
    }
    
    // Extract assignee if missing
    if (!action.data.assignee || !action.data.assignee.trim()) {
      // Look for patterns like "assign it to X", "assign to X", "to X"
      const assigneeMatch = originalPrompt.match(/(?:assign\s+(?:it\s+)?to|assign\s+to)\s+([^"']+?)(?:\s+in|\s+under|$)/i);
      if (assigneeMatch && assigneeMatch[1]) {
        action.data.assignee = assigneeMatch[1].trim();
      } else {
        // Try pattern: "to [name] in [project]"
        const toMatch = originalPrompt.match(/to\s+([^"']+?)\s+in/i);
        if (toMatch && toMatch[1]) {
          action.data.assignee = toMatch[1].trim();
        }
      }
    }
    
    console.log('[aiService] Post-processed action:', JSON.stringify(action, null, 2));
  }
  
  return action;
}

/**
 * Process prompt with conversation context - merges partial actions
 */
async function processPromptWithContext(userPrompt, context) {
  if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
    throw new Error('Prompt is required');
  }

  // If we have a partial action in context, merge it
  if (context && context.partialAction && context.actionType) {
    console.log('[aiService] Merging with existing context:', context);
    
    // Build a prompt that includes the existing context
    const providedFields = context.providedFields || {};
    const providedFieldsList = Object.entries(providedFields)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: [${value.join(', ')}]`;
        }
        return `${key}: ${value}`;
      });
    
    const providedFieldsStr = providedFieldsList.length > 0 
      ? providedFieldsList.join(', ')
      : 'none';
    
    const contextInfo = `You are continuing a conversation to complete an action. DO NOT ask for information that has already been provided.

Previous context:
- Action type: ${context.actionType}
- Information already collected: ${providedFieldsStr}
- Still needed: ${context.missingFields.join(', ') || 'none'}

User's new input: "${userPrompt.trim()}"

CRITICAL INSTRUCTIONS:
1. Extract ONLY NEW information from the user's input (ignore anything already provided)
2. Merge the new information with the existing partial action
3. Return the COMPLETE merged action JSON with ALL fields (both previously provided AND newly provided)
4. DO NOT ask for fields that have already been provided
5. If the user says "assign task to [name]", extract: assignee=[name] and keep existing project/title if provided
6. If the user provides team members, merge them with existing team_members array
7. If task title is missing, only ask for task title (not other fields that are already provided)

Return only valid JSON with the complete merged action, no additional text.`;
    
    const prompt = `${contextInfo}\n\nReturn only valid JSON, no additional text.`;
    
    try {
      const aiResponse = await callOllama(prompt);
      const newAction = extractJSON(aiResponse);
      
      // Deep merge with existing partial action - prioritize new data over old
      const mergedAction = {
        action: newAction.action || context.actionType,
        data: {
          ...(context.partialAction?.data || {}),
          ...(newAction?.data || {})
        },
        filters: {
          ...(context.partialAction?.filters || {}),
          ...(newAction?.filters || {})
        },
        update: {
          ...(context.partialAction?.update || {}),
          ...(newAction?.update || {})
        }
      };
      
      // Remove null/undefined/empty values to keep action clean
      if (mergedAction.data) {
        for (const key in mergedAction.data) {
          if (mergedAction.data[key] === null || mergedAction.data[key] === undefined || mergedAction.data[key] === '') {
            delete mergedAction.data[key];
          }
        }
      }
      
      // Handle team members - merge arrays if both exist
      if (context.partialAction?.data?.team_members && newAction?.data?.team_members) {
        const existing = Array.isArray(context.partialAction.data.team_members) 
          ? context.partialAction.data.team_members 
          : [context.partialAction.data.team_members];
        const newOnes = Array.isArray(newAction.data.team_members)
          ? newAction.data.team_members
          : [newAction.data.team_members];
        mergedAction.data.team_members = [...new Set([...existing, ...newOnes])];
      } else if (newAction?.data?.team_members) {
        mergedAction.data.team_members = newAction.data.team_members;
      } else if (context.partialAction?.data?.team_members) {
        mergedAction.data.team_members = context.partialAction.data.team_members;
      }
      
      // Validate action structure
      if (!mergedAction.action) {
        mergedAction.action = context.actionType;
      }
      
      console.log('[aiService] Merged action:', JSON.stringify(mergedAction, null, 2));
      return mergedAction;
    } catch (error) {
      console.error('[aiService] Error merging context, falling back to normal processing:', error);
      // Fall through to normal processing
    }
  }

  // Normal processing without context
  return await processPrompt(userPrompt);
}

module.exports = {
  processPrompt,
  processPromptWithContext
};
