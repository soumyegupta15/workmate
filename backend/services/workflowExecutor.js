'use strict';

const userRepository = require('../repositories/userRepository');
const projectRepository = require('../repositories/projectRepository');
const taskRepository = require('../repositories/taskRepository');
const projectMemberRepository = require('../repositories/projectMemberRepository');
const commentRepository = require('../repositories/commentRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { TASK_PRIORITY, TASK_STATUS, PROJECT_MEMBER_ROLE } = require('../enums');
const { supabase, supabaseAdmin } = require('../config/supabase');

// Use admin client for database operations
const db = supabaseAdmin || supabase;

/**
 * Parse relative date strings (e.g., "tomorrow", "next week", "+2 days")
 */
function parseRelativeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const str = dateStr.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (str === 'today') return today.toISOString().split('T')[0];
  if (str === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  if (str === 'next week') {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }
  if (str === 'next monday') {
    const nextMonday = new Date(today);
    const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  }
  if (str.includes('+') && str.includes('day')) {
    const match = str.match(/(\d+)/);
    if (match) {
      const days = parseInt(match[1], 10);
      const future = new Date(today);
      future.setDate(future.getDate() + days);
      return future.toISOString().split('T')[0];
    }
  }
  if (str.includes('this friday')) {
    const thisFriday = new Date(today);
    const daysUntilFriday = (5 - thisFriday.getDay() + 7) % 7 || 7;
    thisFriday.setDate(thisFriday.getDate() + daysUntilFriday);
    return thisFriday.toISOString().split('T')[0];
  }
  if (str.includes('end of this month')) {
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return endOfMonth.toISOString().split('T')[0];
  }
  
  // Try to parse as ISO date
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {
    // ignore
  }
  
  return null;
}

/**
 * Normalize priority string to enum value
 */
function normalizePriority(priority) {
  if (!priority) return null;
  const p = String(priority).toLowerCase().trim();
  if (p === 'low') return TASK_PRIORITY.LOW;
  if (p === 'medium') return TASK_PRIORITY.MEDIUM;
  if (p === 'high') return TASK_PRIORITY.HIGH;
  if (p === 'critical' || p === 'urgent') return TASK_PRIORITY.URGENT;
  return null;
}

/**
 * Normalize status string to enum value
 */
function normalizeStatus(status) {
  if (!status) return null;
  const s = String(status).toLowerCase().trim();
  if (s === 'todo' || s === 'to do' || s === 'pending') return TASK_STATUS.TODO;
  if (s === 'in-progress' || s === 'in_progress') return TASK_STATUS.IN_PROGRESS;
  if (s === 'in review' || s === 'in_review') return TASK_STATUS.IN_REVIEW;
  if (s === 'done' || s === 'completed' || s === 'closed') return TASK_STATUS.DONE;
  return null;
}

/**
 * Find user by email or name
 */
async function findUser(identifier, projectId = null) {
  if (!identifier) return null;
  
  const str = String(identifier).trim();
  
  // Try email first
  if (str.includes('@')) {
    return await userRepository.findByEmail(str);
  }
  
  // If we have a project ID, search within project members first
  if (projectId) {
    try {
      console.log('[workflowExecutor] Searching for user in project members:', { identifier, projectId });
      
      // Get all project members for this project
      const projectMembers = await projectMemberRepository.findMany({ project_id: String(projectId) });
      console.log('[workflowExecutor] Found project members:', projectMembers.length);
      
      if (projectMembers.length > 0) {
        // Get user IDs from project members
        const userIds = projectMembers.map(pm => pm.user_id).filter(Boolean);
        
        // Search users by name within project members
        const { data: users } = await db
          .from('users')
          .select('id,email,name,profile_image_url')
          .in('id', userIds)
          .or(`name.ilike.%${str}%,name.ilike.${str}%`);
        
        if (users && users.length > 0) {
          // Try exact first name match first
          const firstNameMatch = users.find(u => {
            const firstName = u.name?.split(' ')[0]?.toLowerCase();
            return firstName === str.toLowerCase();
          });
          
          if (firstNameMatch) {
            console.log('[workflowExecutor] Found user by first name in project:', firstNameMatch.name);
            return firstNameMatch;
          }
          
          // Try partial match
          const partialMatch = users.find(u => {
            const name = u.name?.toLowerCase() || '';
            return name.includes(str.toLowerCase()) || str.toLowerCase().includes(name.split(' ')[0]?.toLowerCase() || '');
          });
          
          if (partialMatch) {
            console.log('[workflowExecutor] Found user by partial name in project:', partialMatch.name);
            return partialMatch;
          }
          
          // Return first match if any
          if (users[0]) {
            console.log('[workflowExecutor] Found user in project (first match):', users[0].name);
            return users[0];
          }
        }
      }
    } catch (error) {
      console.error('[workflowExecutor] Error finding user in project members:', error);
      // Fall through to general search
    }
  }
  
  // Try name search in all users (fallback)
  try {
    console.log('[workflowExecutor] Searching for user in all users:', identifier);
    const { data } = await db
      .from('users')
      .select('id,email,name,profile_image_url')
      .or(`name.ilike.%${str}%,name.ilike.${str}%`)
      .limit(5);
    
    if (data && data.length > 0) {
      // Try exact first name match first
      const firstNameMatch = data.find(u => {
        const firstName = u.name?.split(' ')[0]?.toLowerCase();
        return firstName === str.toLowerCase();
      });
      
      if (firstNameMatch) {
        console.log('[workflowExecutor] Found user by first name:', firstNameMatch.name);
        return firstNameMatch;
      }
      
      // Return first match
      console.log('[workflowExecutor] Found user (first match):', data[0].name);
      return data[0];
    }
    
    return null;
  } catch (error) {
    console.error('[workflowExecutor] Error finding user by name:', error);
    return null;
  }
}

/**
 * Find project by name
 */
async function findProjectByName(name, orgId) {
  if (!name) return null;
  
  try {
    const normalizedName = String(name).trim();
    if (!normalizedName) return null;
    const lowerName = normalizedName.toLowerCase();
    const sanitizedName = lowerName.replace(/^project\s*:\s*/i, '').trim();

    // Fetch candidate projects in scope once, then do strict matching in code.
    let listQuery = db.from('projects').select('*').limit(100);
    if (orgId) {
      listQuery = listQuery.eq('org_id', String(orgId));
    }

    const { data: projects, error: listError } = await listQuery;
    if (listError) {
      console.error('[workflowExecutor] Error listing projects:', listError);
      return null;
    }

    const candidates = (projects || []).filter(Boolean);
    if (candidates.length === 0) return null;

    const normalizeProjectName = (value) =>
      String(value || '')
        .toLowerCase()
        .replace(/^project\s*:\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    // 1) Exact match against raw or sanitized input (strict)
    const exactMatches = candidates.filter((p) => {
      const pn = normalizeProjectName(p.name);
      return pn === lowerName || pn === sanitizedName;
    });
    if (exactMatches.length === 1) return exactMatches[0];
    if (exactMatches.length > 1) return null; // ambiguous

    // 2) Starts-with only if unique and long enough query
    const searchKey = sanitizedName || lowerName;
    if (searchKey.length >= 4) {
      const startsWithMatches = candidates.filter((p) =>
        normalizeProjectName(p.name).startsWith(searchKey)
      );
      if (startsWithMatches.length === 1) return startsWithMatches[0];
    }

    // No reliable unique match -> force caller to ask user instead of wrong routing.
    return null;
  } catch (error) {
    console.error('[workflowExecutor] Error finding project:', error);
    return null;
  }
}

/**
 * Find task by title
 */
async function findTaskByTitle(title, projectId) {
  if (!title) return null;
  
  try {
    let query = db.from('tasks').select('*').ilike('title', `%${title}%`).limit(1);
    
    if (projectId) {
      query = query.eq('project_id', String(projectId));
    }
    
    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error('[workflowExecutor] Error finding task:', error);
      return null;
    }
    return data || null;
  } catch (error) {
    console.error('[workflowExecutor] Error finding task:', error);
    return null;
  }
}

/**
 * Validate and get missing fields for create_project
 */
function validateCreateProject(action) {
  const { name, team_members, team_lead } = action.data || {};
  const missing = [];
  
  if (!name || !String(name).trim()) {
    missing.push('project name');
  }
  
  return missing;
}

/**
 * Extract team members from action data
 */
function extractTeamMembers(action) {
  const { team_members, members, team_lead } = action.data || {};
  
  // Support various formats: team_members, members, or single team_lead
  let membersList = [];
  
  if (Array.isArray(team_members)) {
    membersList = team_members;
  } else if (Array.isArray(members)) {
    membersList = members;
  } else if (typeof team_members === 'string') {
    membersList = team_members.split(',').map(m => m.trim()).filter(Boolean);
  } else if (typeof members === 'string') {
    membersList = members.split(',').map(m => m.trim()).filter(Boolean);
  }
  
  // Add team_lead if specified
  if (team_lead && !membersList.includes(team_lead)) {
    membersList.push(team_lead);
  }
  
  return membersList;
}

/**
 * Execute create_project action
 */
async function executeCreateProject(action, req) {
  const { name, team_lead, start_date, orgId } = action.data || {};
  
  // Validate required fields
  const missing = validateCreateProject(action);
  if (missing.length > 0) {
    const question = `I need some more information to create the project. Could you please provide: ${missing.join(', ')}?`;
    const error = new Error(question);
    error.isQuestion = true;
    error.missingFields = missing;
    throw error;
  }
  
  // Extract team members from action
  const teamMembersList = extractTeamMembers(action);
  
  // Ensure req.user is set
  if (!req.user || !req.user.id) {
    const error = new Error('I need you to be logged in to create a project. Please log in and try again.');
    error.isQuestion = true;
    throw error;
  }
  
  const userId = String(req.user.id);
  const orgIdValue = orgId || req.orgId || null;
  const teamLeadUser = team_lead ? await findUser(team_lead) : null;
  const startDate = start_date ? parseRelativeDate(start_date) : null;
  
  try {
    console.log('[workflowExecutor] ===== CREATING PROJECT =====');
    console.log('[workflowExecutor] Input:', { name, orgId: orgIdValue, userId, team_lead, start_date });
    
    // Create project directly using repository
    const projectPayload = {
      org_id: orgIdValue,
      name: String(name).trim(),
      description: null,
      status: 'planning',
      start_date: startDate,
      end_date: null,
      created_by: userId
    };
    
    console.log('[workflowExecutor] Project payload:', JSON.stringify(projectPayload, null, 2));
    
    let created;
    try {
      created = await projectRepository.insertOne(projectPayload);
      console.log('[workflowExecutor] Insert result type:', typeof created, created ? 'has data' : 'null');
      
      if (!created) {
        throw new Error('Project creation failed - database returned null. This might be a permissions or schema issue.');
      }
      
      if (!created.id) {
        throw new Error('Project creation failed - no ID returned from database');
      }
      
      console.log('[workflowExecutor] ✓ Project created successfully in DB with ID:', created.id);
      console.log('[workflowExecutor] Project data:', JSON.stringify(created, null, 2));
    } catch (dbError) {
      console.error('[workflowExecutor] ✗ Database error creating project:', dbError);
      console.error('[workflowExecutor] Error details:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
        stack: dbError.stack
      });
      throw dbError;
    }
    
    // Create project member (owner) for the creator
    try {
      const projectMember = await projectMemberRepository.insertOne({
        project_id: created.id,
        user_id: userId,
        role: PROJECT_MEMBER_ROLE?.OWNER || 'owner'
      });
      console.log('[workflowExecutor] ✓ Project member created:', projectMember?.id);
    } catch (memberError) {
      console.error('[workflowExecutor] ✗ Error creating project member:', memberError);
      // Don't fail the whole operation if member creation fails
      console.warn('[workflowExecutor] Continuing despite project member creation error');
    }
    
    // Add team members if specified
    if (teamMembersList.length > 0) {
      console.log('[workflowExecutor] Adding team members:', teamMembersList);
      
      for (const memberIdentifier of teamMembersList) {
        try {
          const memberUser = await findUser(memberIdentifier);
          if (!memberUser) {
            console.warn(`[workflowExecutor] Could not find user: ${memberIdentifier}`);
            continue;
          }
          
          // Skip if it's the creator (already added as owner)
          if (String(memberUser.id) === userId) {
            continue;
          }
          
          // Check if already a member
          const existingMember = await projectMemberRepository.findOne({
            project_id: created.id,
            user_id: String(memberUser.id)
          });
          
          if (!existingMember) {
            await projectMemberRepository.insertOne({
              project_id: created.id,
              user_id: String(memberUser.id),
              role: PROJECT_MEMBER_ROLE?.MEMBER || 'member'
            });
            console.log(`[workflowExecutor] ✓ Added team member: ${memberUser.name}`);
          } else {
            console.log(`[workflowExecutor] Team member already exists: ${memberUser.name}`);
          }
        } catch (err) {
          console.warn(`[workflowExecutor] Failed to add team member ${memberIdentifier}:`, err.message);
        }
      }
    }
    
    // If team lead is specified and different from creator, add them
    if (teamLeadUser && String(teamLeadUser.id) !== userId) {
      try {
        const existingMember = await projectMemberRepository.findOne({
          project_id: created.id,
          user_id: String(teamLeadUser.id)
        });
        
        if (!existingMember) {
          await projectMemberRepository.insertOne({
            project_id: created.id,
            user_id: String(teamLeadUser.id),
            role: PROJECT_MEMBER_ROLE?.MEMBER || 'member'
          });
          console.log('[workflowExecutor] ✓ Team lead added as member');
        }
      } catch (err) {
        console.warn('[workflowExecutor] Failed to add team lead as member:', err.message);
      }
    }
    
    console.log('[workflowExecutor] ===== PROJECT CREATION COMPLETE =====');
    
    return { 
      message: `Project "${name}" created successfully`, 
      data: created 
    };
  } catch (error) {
    console.error('[workflowExecutor] ===== PROJECT CREATION FAILED =====');
    console.error('[workflowExecutor] Error:', error);
    
    // Handle validation errors from Zod
    if (error.issues && Array.isArray(error.issues)) {
      const missingFields = error.issues
        .filter(issue => issue.code === 'invalid_type' || issue.code === 'required')
        .map(issue => issue.path.join('.') || 'required field');
      
      if (missingFields.length > 0) {
        const question = `I need some more information to create the project. Could you please provide: ${missingFields.join(', ')}?`;
        const validationError = new Error(question);
        validationError.isQuestion = true;
        validationError.missingFields = missingFields;
        throw validationError;
      }
    }
    
    // Handle Supabase errors
    if (error.code === '23503') { // Foreign key violation
      const question = 'It looks like one of the references is invalid. Could you please check the project name, organization, or team lead and try again?';
      const refError = new Error(question);
      refError.isQuestion = true;
      throw refError;
    }
    
    if (error.code === '23505') { // Unique violation
      const question = `A project with the name "${name}" already exists. Would you like to use a different name?`;
      const uniqueError = new Error(question);
      uniqueError.isQuestion = true;
      throw uniqueError;
    }
    
    // If it's already a question, rethrow
    if (error.isQuestion) {
      throw error;
    }
    
    // Generic error - convert to question
    const question = `I encountered an issue creating the project: ${error.message}. Could you please provide more details or try again?`;
    const genericError = new Error(question);
    genericError.isQuestion = true;
    throw genericError;
  }
}

/**
 * Get provided fields for context (excluding null/empty values)
 */
function getProvidedFields(action) {
  const provided = {};
  
  if (action.data) {
    for (const [key, value] of Object.entries(action.data)) {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          provided[key] = value;
        } else if (!Array.isArray(value)) {
          provided[key] = value;
        }
      }
    }
  }
  
  if (action.filters) {
    for (const [key, value] of Object.entries(action.filters)) {
      if (value !== null && value !== undefined && value !== '') {
        provided[`filter_${key}`] = value;
      }
    }
  }
  
  return provided;
}

/**
 * Validate and get missing fields for create_task
 */
function validateCreateTask(action) {
  const { title, project } = action.data || {};
  const missing = [];
  
  if (!title || !String(title).trim()) {
    missing.push('task title');
  }
  
  if (!project || !String(project).trim()) {
    missing.push('project name');
  }
  
  return missing;
}

/**
 * Validate and get missing fields for update_task
 */
function validateUpdateTask(action) {
  const { title } = action.filters || {};
  const missing = [];
  
  if (!title || !String(title).trim()) {
    missing.push('task title (to identify which task to update)');
  }
  
  return missing;
}

/**
 * Execute create_task action
 */
async function executeCreateTask(action, req) {
  const { title, project, assignee, priority, due_date, orgId } = action.data || {};
  
  // Validate required fields
  const missing = validateCreateTask(action);
  if (missing.length > 0) {
    // Get what's already been provided for context
    const provided = getProvidedFields(action);
    const providedInfo = Object.keys(provided).length > 0 
      ? ` (I already have: ${Object.keys(provided).join(', ')})`
      : '';
    
    const question = `I need some more information to create the task${providedInfo}. Could you please provide: ${missing.join(', ')}?`;
    const error = new Error(question);
    error.isQuestion = true;
    error.missingFields = missing;
    error.providedFields = provided; // Include what's already provided
    throw error;
  }
  
  // Ensure req.user is set
  if (!req.user || !req.user.id) {
    const error = new Error('I need you to be logged in to create a task. Please log in and try again.');
    error.isQuestion = true;
    throw error;
  }
  
  const userId = String(req.user.id);
  const projectObj = project ? await findProjectByName(project, orgId || req.orgId) : null;
  if (!projectObj) {
    const question = `I couldn't find a project named "${project}". Could you please check the project name or create the project first?`;
    const error = new Error(question);
    error.isQuestion = true;
    throw error;
  }
  
  // Find assignee - search within project members first if assignee is specified
  let assigneeUser = null;
  if (assignee) {
    console.log('[workflowExecutor] Looking for assignee by first name:', assignee, 'in project:', projectObj.id);
    
    // First, get all project members to search within
    const projectMembers = await projectMemberRepository.findMany({ project_id: String(projectObj.id) });
    console.log('[workflowExecutor] Project has', projectMembers.length, 'members');
    
    if (projectMembers.length > 0) {
      // Get user IDs from project members
      const userIds = projectMembers.map(pm => pm.user_id).filter(Boolean);
      
      // Search users by first name within project members
      const { data: projectUsers } = await db
        .from('users')
        .select('id,email,name,profile_image_url')
        .in('id', userIds);
      
      if (projectUsers && projectUsers.length > 0) {
        // Try exact first name match first
        const firstNameMatch = projectUsers.find(u => {
          const firstName = u.name?.split(' ')[0]?.toLowerCase();
          return firstName === String(assignee).toLowerCase().trim();
        });
        
        if (firstNameMatch) {
          assigneeUser = firstNameMatch;
          console.log('[workflowExecutor] ✓ Found assignee by first name in project:', assigneeUser.name);
        } else {
          // Try partial match
          const partialMatch = projectUsers.find(u => {
            const name = u.name?.toLowerCase() || '';
            const searchName = String(assignee).toLowerCase().trim();
            return name.includes(searchName) || name.split(' ')[0]?.includes(searchName);
          });
          
          if (partialMatch) {
            assigneeUser = partialMatch;
            console.log('[workflowExecutor] ✓ Found assignee by partial name in project:', assigneeUser.name);
          }
        }
      }
    }
    
    // If not found in project members, search all users but warn
    if (!assigneeUser) {
      console.log('[workflowExecutor] Assignee not found in project members, searching all users...');
      assigneeUser = await findUser(assignee);
      
      if (assigneeUser) {
        console.log('[workflowExecutor] Found user outside project:', assigneeUser.name);
        // Automatically add them to the project
        try {
          const existingMember = await projectMemberRepository.findOne({
            project_id: String(projectObj.id),
            user_id: String(assigneeUser.id)
          });
          
          if (!existingMember) {
            await projectMemberRepository.insertOne({
              project_id: String(projectObj.id),
              user_id: String(assigneeUser.id),
              role: PROJECT_MEMBER_ROLE?.MEMBER || 'member'
            });
            console.log('[workflowExecutor] ✓ Added assignee to project automatically');
          }
        } catch (memberError) {
          console.warn('[workflowExecutor] Could not add assignee to project:', memberError);
        }
      }
    }
    
    if (!assigneeUser) {
      const question = `I couldn't find a team member named "${assignee}" in the project "${project}". Could you please check the name or add them to the project first?`;
      const error = new Error(question);
      error.isQuestion = true;
      throw error;
    }
    
    console.log('[workflowExecutor] ✓ Assignee confirmed:', assigneeUser.name, assigneeUser.id);
  }
  
  const normalizedPriority = normalizePriority(priority);
  const dueDate = due_date ? parseRelativeDate(due_date) : null;
  
  try {
    console.log('[workflowExecutor] ===== CREATING TASK =====');
    console.log('[workflowExecutor] Input:', { 
      title, 
      project: projectObj.name, 
      projectId: projectObj.id, 
      assignee, 
      assigneeId: assigneeUser?.id,
      assigneeName: assigneeUser?.name,
      userId 
    });
    
    // Create task directly using repository
    const taskPayload = {
      title: String(title).trim(),
      description: null,
      status: TASK_STATUS.TODO,
      priority: normalizedPriority || TASK_PRIORITY.MEDIUM,
      due_date: dueDate,
      project_id: String(projectObj.id),
      assignee_id: assigneeUser ? String(assigneeUser.id) : null,
      assigner_id: userId,
      completed_at: null
    };
    
    console.log('[workflowExecutor] Task payload:', JSON.stringify(taskPayload, null, 2));
    
    let created;
    try {
      created = await taskRepository.insertOne(taskPayload);
      console.log('[workflowExecutor] Insert result type:', typeof created, created ? 'has data' : 'null');
      
      if (!created) {
        throw new Error('Task creation failed - database returned null. This might be a permissions or schema issue.');
      }
      
      if (!created.id) {
        throw new Error('Task creation failed - no ID returned from database');
      }
      
      console.log('[workflowExecutor] ✓ Task created successfully in DB with ID:', created.id);
      console.log('[workflowExecutor] Task data:', JSON.stringify(created, null, 2));
    } catch (dbError) {
      console.error('[workflowExecutor] ✗ Database error creating task:', dbError);
      console.error('[workflowExecutor] Error details:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
        stack: dbError.stack
      });
      throw dbError;
    }
    
    console.log('[workflowExecutor] ===== TASK CREATION COMPLETE =====');
    
    // Build success message with assignee info
    let successMessage = `Task "${title}" created successfully in project "${project}"`;
    if (assigneeUser) {
      successMessage += ` and assigned to ${assigneeUser.name}`;
    }
    
    return { 
      message: successMessage, 
      data: created 
    };
  } catch (error) {
    console.error('[workflowExecutor] ===== TASK CREATION FAILED =====');
    console.error('[workflowExecutor] Error:', error);
    
    // Handle validation errors from Zod
    if (error.issues && Array.isArray(error.issues)) {
      const missingFields = error.issues
        .filter(issue => issue.code === 'invalid_type' || issue.code === 'required')
        .map(issue => issue.path.join('.') || 'required field');
      
      if (missingFields.length > 0) {
        const question = `I need some more information to create the task. Could you please provide: ${missingFields.join(', ')}?`;
        const validationError = new Error(question);
        validationError.isQuestion = true;
        validationError.missingFields = missingFields;
        throw validationError;
      }
    }
    
    // Handle Supabase errors
    if (error.code === '23503') { // Foreign key violation
      const question = 'It looks like the project or assignee reference is invalid. Could you please check and try again?';
      const refError = new Error(question);
      refError.isQuestion = true;
      throw refError;
    }
    
    // If assignee is not a project member
    if (error.message && error.message.includes('not a member')) {
      throw error; // Already a question
    }
    
    // If it's already a question, rethrow
    if (error.isQuestion) {
      throw error;
    }
    
    // Generic error - convert to question
    const question = `I encountered an issue creating the task: ${error.message}. Could you please provide more details or try again?`;
    const genericError = new Error(question);
    genericError.isQuestion = true;
    throw genericError;
  }
}

/**
 * Execute update_project action
 */
async function executeUpdateProject(action, req) {
  const { name } = action.filters || {};
  const updates = action.update || {};
  const orgId = req.orgId;
  
  if (!name) {
    throw new Error('Project name is required for filtering');
  }
  
  // Ensure req.user is set
  if (!req.user || !req.user.id) {
    throw new Error('User authentication required');
  }
  
  const project = await findProjectByName(name, orgId);
  if (!project) {
    throw new Error(`Project "${name}" not found`);
  }
  
  try {
    const updatePayload = {};
    if (updates.priority) updatePayload.priority = normalizePriority(updates.priority);
    if (updates.status) updatePayload.status = String(updates.status).toLowerCase();
    
    if (Object.keys(updatePayload).length === 0) {
      throw new Error('No valid update fields provided');
    }
    
    console.log('[workflowExecutor] Updating project:', project.id, updatePayload);
    const updated = await projectRepository.updateById(project.id, updatePayload);
    console.log('[workflowExecutor] Project updated in DB:', updated.id);
    
    return { 
      message: `Project "${name}" updated successfully`, 
      data: updated 
    };
  } catch (error) {
    console.error('[workflowExecutor] Error updating project:', error);
    throw error;
  }
}

/**
 * Execute update_task action
 */
async function executeUpdateTask(action, req) {
  const { title } = action.filters || {};
  const updates = action.update || {};
  const projectId = updates.project_id || null;
  
  // Validate required fields
  const missing = validateUpdateTask(action);
  if (missing.length > 0) {
    const question = `I need some more information to update the task. Could you please provide: ${missing.join(', ')}?`;
    const error = new Error(question);
    error.isQuestion = true;
    error.missingFields = missing;
    throw error;
  }
  
  // Ensure req.user is set
  if (!req.user || !req.user.id) {
    throw new Error('User authentication required');
  }
  
  const task = await findTaskByTitle(title, projectId);
  if (!task) {
    const question = `I couldn't find a task named "${title}". Could you please check the task name or provide the correct task title?`;
    const error = new Error(question);
    error.isQuestion = true;
    throw error;
  }
  
  try {
    console.log('[workflowExecutor] ===== UPDATING TASK =====');
    console.log('[workflowExecutor] Task found:', task.id, task.title);
    console.log('[workflowExecutor] Updates to apply:', updates);
    
    const updatePayload = {};
    if (updates.status) updatePayload.status = normalizeStatus(updates.status);
    if (updates.due_date) updatePayload.due_date = parseRelativeDate(updates.due_date);
    if (updates.priority) updatePayload.priority = normalizePriority(updates.priority);
    if (updates.assignee) {
      // Find assignee user - search within project members first
      console.log('[workflowExecutor] Looking for assignee by first name:', updates.assignee, 'in project:', task.project_id);
      
      // First, get all project members to search within
      const projectMembers = await projectMemberRepository.findMany({ project_id: String(task.project_id) });
      console.log('[workflowExecutor] Project has', projectMembers.length, 'members');
      
      let assigneeUser = null;
      
      if (projectMembers.length > 0) {
        // Get user IDs from project members
        const userIds = projectMembers.map(pm => pm.user_id).filter(Boolean);
        
        // Search users by first name within project members
        const { data: projectUsers } = await db
          .from('users')
          .select('id,email,name,profile_image_url')
          .in('id', userIds);
        
        if (projectUsers && projectUsers.length > 0) {
          // Try exact first name match first
          const firstNameMatch = projectUsers.find(u => {
            const firstName = u.name?.split(' ')[0]?.toLowerCase();
            return firstName === String(updates.assignee).toLowerCase().trim();
          });
          
          if (firstNameMatch) {
            assigneeUser = firstNameMatch;
            console.log('[workflowExecutor] ✓ Found assignee by first name in project:', assigneeUser.name);
          } else {
            // Try partial match
            const partialMatch = projectUsers.find(u => {
              const name = u.name?.toLowerCase() || '';
              const searchName = String(updates.assignee).toLowerCase().trim();
              return name.includes(searchName) || name.split(' ')[0]?.includes(searchName);
            });
            
            if (partialMatch) {
              assigneeUser = partialMatch;
              console.log('[workflowExecutor] ✓ Found assignee by partial name in project:', assigneeUser.name);
            }
          }
        }
      }
      
      // If not found in project members, search all users
      if (!assigneeUser) {
        console.log('[workflowExecutor] Assignee not found in project members, searching all users...');
        assigneeUser = await findUser(updates.assignee);
        
        if (assigneeUser) {
          console.log('[workflowExecutor] Found user outside project:', assigneeUser.name);
          // Automatically add them to the project
          try {
            const existingMember = await projectMemberRepository.findOne({
              project_id: String(task.project_id),
              user_id: String(assigneeUser.id)
            });
            
            if (!existingMember) {
              await projectMemberRepository.insertOne({
                project_id: String(task.project_id),
                user_id: String(assigneeUser.id),
                role: PROJECT_MEMBER_ROLE?.MEMBER || 'member'
              });
              console.log('[workflowExecutor] ✓ Added assignee to project automatically');
            }
          } catch (memberError) {
            console.warn('[workflowExecutor] Could not add assignee to project:', memberError);
          }
        }
      }
      
      if (!assigneeUser) {
        const question = `I couldn't find a team member named "${updates.assignee}" for this task. Could you please check the name?`;
        const error = new Error(question);
        error.isQuestion = true;
        throw error;
      }
      
      updatePayload.assignee_id = String(assigneeUser.id);
      updatePayload.assigner_id = String(req.user.id);
      console.log('[workflowExecutor] ✓ Assignee confirmed:', assigneeUser.name, assigneeUser.id);
    }
    
    if (Object.keys(updatePayload).length === 0) {
      const question = 'I need to know what to update. Could you please specify what field to update (status, priority, due date, or assignee)?';
      const error = new Error(question);
      error.isQuestion = true;
      throw error;
    }
    
    console.log('[workflowExecutor] Update payload:', updatePayload);
    
    // Store assignee name for success message (if assignee was updated)
    let assigneeName = null;
    if (updates.assignee && updatePayload.assignee_id) {
      // We already found the assignee above, but need to get the name for the message
      // The assigneeUser variable is in the if block scope, so we'll query again
      const { data: assigneeData } = await db
        .from('users')
        .select('name')
        .eq('id', updatePayload.assignee_id)
        .maybeSingle();
      if (assigneeData) {
        assigneeName = assigneeData.name;
      }
    }
    
    const updated = await taskRepository.updateById(task.id, updatePayload);
    console.log('[workflowExecutor] ✓ Task updated in DB:', updated.id);
    console.log('[workflowExecutor] Updated task data:', JSON.stringify(updated, null, 2));
    
    // Build success message with update details
    const updateDetails = [];
    if (updates.status) updateDetails.push(`status: ${updates.status}`);
    if (updates.priority) updateDetails.push(`priority: ${updates.priority}`);
    if (updates.due_date) updateDetails.push(`due date: ${updates.due_date}`);
    if (assigneeName) updateDetails.push(`assigned to: ${assigneeName}`);
    
    const detailsStr = updateDetails.length > 0 ? ` (${updateDetails.join(', ')})` : '';
    
    return { 
      message: `Task "${title}" updated successfully${detailsStr}`, 
      data: updated 
    };
  } catch (error) {
    console.error('[workflowExecutor] ===== TASK UPDATE FAILED =====');
    console.error('[workflowExecutor] Error:', error);
    
    // If it's already a question, rethrow
    if (error.isQuestion) {
      throw error;
    }
    
    // Convert to question
    const question = `I encountered an issue updating the task: ${error.message}. Could you please try again or provide more details?`;
    const genericError = new Error(question);
    genericError.isQuestion = true;
    throw genericError;
  }
}

/**
 * Execute add_project_member action
 */
async function executeAddProjectMember(action, req) {
  const { project, user } = action.data || {};
  
  // Validate required fields
  if (!project || !String(project).trim()) {
    const question = 'I need to know which project to add the member to. Could you please provide the project name?';
    const error = new Error(question);
    error.isQuestion = true;
    error.missingFields = ['project'];
    throw error;
  }
  
  if (!user || !String(user).trim()) {
    const question = 'I need to know which member to add. Could you please provide the member name?';
    const error = new Error(question);
    error.isQuestion = true;
    error.missingFields = ['user'];
    throw error;
  }
  
  // Ensure req.user is set
  if (!req.user || !req.user.id) {
    const error = new Error('I need you to be logged in to add project members. Please log in and try again.');
    error.isQuestion = true;
    throw error;
  }
  
  try {
    console.log('[workflowExecutor] ===== ADDING PROJECT MEMBER =====');
    console.log('[workflowExecutor] Project:', project, 'User:', user);
    
    // Find project
    const projectObj = await findProjectByName(project, req.orgId);
    if (!projectObj) {
      const question = `I couldn't find a project named "${project}". Could you please check the project name?`;
      const error = new Error(question);
      error.isQuestion = true;
      throw error;
    }
    
    // Find user by name
    const memberUser = await findUser(user, projectObj.id);
    if (!memberUser) {
      const question = `I couldn't find a user named "${user}". Could you please check the name?`;
      const error = new Error(question);
      error.isQuestion = true;
      throw error;
    }
    
    // Check if already a member
    const existingMember = await projectMemberRepository.findOne({
      project_id: String(projectObj.id),
      user_id: String(memberUser.id)
    });
    
    if (existingMember) {
      return {
        message: `${memberUser.name} is already a member of the "${project}" project`,
        data: existingMember
      };
    }
    
    // Add member
    const newMember = await projectMemberRepository.insertOne({
      project_id: String(projectObj.id),
      user_id: String(memberUser.id),
      role: PROJECT_MEMBER_ROLE?.MEMBER || 'member'
    });
    
    console.log('[workflowExecutor] ✓ Project member added:', newMember.id);
    console.log('[workflowExecutor] ===== PROJECT MEMBER ADDITION COMPLETE =====');
    
    return {
      message: `Successfully added ${memberUser.name} to the "${project}" project`,
      data: newMember
    };
  } catch (error) {
    console.error('[workflowExecutor] ===== PROJECT MEMBER ADDITION FAILED =====');
    console.error('[workflowExecutor] Error:', error);
    
    if (error.isQuestion) {
      throw error;
    }
    
    const question = `I encountered an issue adding the project member: ${error.message}. Could you please try again or provide more details?`;
    const genericError = new Error(question);
    genericError.isQuestion = true;
    throw genericError;
  }
}

/**
 * Execute assign action
 */
async function executeAssign(action, req) {
  const { assignee, due_date } = action.update || {};
  const filters = action.filters || {};
  
  if (!assignee) {
    const question = 'I need to know who to assign the task to. Could you please provide the assignee name?';
    const error = new Error(question);
    error.isQuestion = true;
    error.missingFields = ['assignee'];
    throw error;
  }
  
  const assigneeUser = await findUser(assignee);
  if (!assigneeUser) {
    throw new Error(`User "${assignee}" not found`);
  }
  
  // Find tasks based on filters
  let query = db.from('tasks').select('*');
  
  if (filters.team) {
    // Filter by project team (would need project lookup)
    // For now, skip team filtering
  }
  
  if (filters.status) {
    const status = normalizeStatus(filters.status);
    if (status) {
      query = query.eq('status', status);
    }
  }
  
  const { data: tasks, error: queryError } = await query;
  
  if (queryError) {
    throw new Error(`Failed to query tasks: ${queryError.message}`);
  }
  
  if (!tasks || tasks.length === 0) {
    return { message: 'No tasks found matching the criteria' };
  }
  
  // Ensure req.user is set
  if (!req.user || !req.user.id) {
    throw new Error('User authentication required');
  }
  
  const dueDate = due_date ? parseRelativeDate(due_date) : null;
  const assigneeId = String(assigneeUser.id);
  
  try {
    console.log('[workflowExecutor] Assigning tasks:', { count: tasks.length, assigneeId, dueDate });
    
    const results = [];
    for (const task of tasks) {
      const updatePayload = {
        assignee_id: assigneeId,
        assigner_id: String(req.user.id)
      };
      if (dueDate) {
        updatePayload.due_date = dueDate;
      }
      
      const updated = await taskRepository.updateById(task.id, updatePayload);
      results.push(updated);
    }
    
    console.log('[workflowExecutor] Assigned', results.length, 'tasks');
    
    return { 
      message: `Assigned ${tasks.length} task(s) to ${assignee}`, 
      data: results 
    };
  } catch (error) {
    console.error('[workflowExecutor] Error assigning tasks:', error);
    throw error;
  }
}

/**
 * Execute comment action
 */
async function executeComment(action, req) {
  const { title } = action.filters || {};
  const { body } = action.data || {};
  
  if (!title) {
    throw new Error('Task title is required for filtering');
  }
  
  if (!body) {
    throw new Error('Comment body is required');
  }
  
  // Ensure req.user is set
  if (!req.user || !req.user.id) {
    throw new Error('User authentication required');
  }
  
  const task = await findTaskByTitle(title);
  if (!task) {
    throw new Error(`Task "${title}" not found`);
  }
  
  try {
    const userId = String(req.user.id);
    console.log('[workflowExecutor] Adding comment to task:', task.id, 'by user:', userId);
    
    const commentPayload = {
      task_id: task.id,
      author_id: userId,
      body: String(body)
    };
    
    const created = await commentRepository.insertOne(commentPayload);
    console.log('[workflowExecutor] Comment created in DB:', created.id);
    
    return { 
      message: `Comment added to task "${title}"`, 
      data: created 
    };
  } catch (error) {
    console.error('[workflowExecutor] Error adding comment:', error);
    throw error;
  }
}

/**
 * Execute notify action
 */
async function executeNotify(action, req) {
  const { user, title, message } = action.data || {};
  
  if (!user) {
    throw new Error('User is required for notification');
  }
  
  if (!message) {
    throw new Error('Notification message is required');
  }
  
  const targetUser = await findUser(user);
  if (!targetUser) {
    throw new Error(`User "${user}" not found`);
  }
  
  try {
    console.log('[workflowExecutor] Creating notification for user:', targetUser.id);
    
    const notification = await notificationRepository.insertOne({
      user_id: targetUser.id,
      title: title || 'Notification',
      message: String(message),
      type: 'info'
    });
    
    console.log('[workflowExecutor] Notification created in DB:', notification.id);
    
    return { 
      message: `Notification sent to ${user}`, 
      data: notification 
    };
  } catch (error) {
    console.error('[workflowExecutor] Error creating notification:', error);
    throw error;
  }
}

/**
 * Execute action based on parsed AI output
 */
async function executeAction(action, req) {
  if (!action || !action.action) {
    throw new Error('Invalid action structure');
  }
  
  const actionType = String(action.action).toLowerCase();
  console.log('[workflowExecutor] Executing action type:', actionType);
  
  switch (actionType) {
    case 'create_project':
      return await executeCreateProject(action, req);
    case 'create_task':
      return await executeCreateTask(action, req);
    case 'update_project':
      return await executeUpdateProject(action, req);
    case 'update_task':
      return await executeUpdateTask(action, req);
    case 'assign':
      return await executeAssign(action, req);
    case 'add_project_member':
      return await executeAddProjectMember(action, req);
    case 'comment':
      return await executeComment(action, req);
    case 'notify':
      return await executeNotify(action, req);
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

module.exports = {
  executeAction
};
