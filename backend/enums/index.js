'use strict';

// Enums copied from Supabase enum definitions (see database screenshot)

const ATTACHMENT_ENTITY_TYPE = Object.freeze({
  TASK: 'task',
  COMMENT: 'comment',
  PROJECT: 'project',
  ORGANISATION: 'organisation',
  USER: 'user'
});

const NOTIFICATION_ENTITY_TYPE = Object.freeze({
  PROJECT: 'project',
  TASK: 'task'
});

const NOTIFICATION_TYPE = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  TASK_UPDATE: 'task_update',
  COMMENT: 'comment',
  INVITE: 'invite',
  SYSTEM: 'system'
});

const ORG_SIZE = Object.freeze({
  SMALL_1_10: '1 - 10',
  SMALL_11_50: '11 - 50',
  MEDIUM_51_200: '51 - 200',
  LARGE_200_500: '200 - 500'
});

const PROJECT_MEMBER_ROLE = Object.freeze({
  VIEWER: 'viewer',
  MEMBER: 'member',
  MANAGER: 'manager',
  OWNER: 'owner'
});

const PROJECT_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
});

const PROJECT_STATUS = Object.freeze({
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
});

const TASK_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
});

const TASK_STATUS = Object.freeze({
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  DONE: 'done'
});

const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  INVITED: 'invited',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
});

module.exports = {
  ATTACHMENT_ENTITY_TYPE,
  NOTIFICATION_ENTITY_TYPE,
  NOTIFICATION_TYPE,
  ORG_SIZE,
  PROJECT_MEMBER_ROLE,
  PROJECT_PRIORITY,
  PROJECT_STATUS,
  TASK_PRIORITY,
  TASK_STATUS,
  USER_STATUS
};


