export const AppEvents = {
  // Tasks
  TASK_CREATED: 'task.created',
  TASK_ASSIGNED: 'task.assigned',
  TASK_STATUS_CHANGED: 'task.status.changed',
  TASK_MOVED: 'task.moved',
  TASK_UPDATED: 'task.updated',
  TASK_DELETED: 'task.deleted',

  // Task Attachments
  TASK_ATTACHMENT_UPLOADED: 'task.attachment.uploaded',
  TASK_ATTACHMENT_DELETED: 'task.attachment.deleted',

  // Comments
  COMMENT_ADDED: 'comment.added',
  COMMENT_DELETED: 'comment.deleted',

  // Workspace & Members
  MEMBER_JOINED: 'workspace.member.joined',
  MEMBER_ROLE_CHANGED: 'workspace.member.role_changed',
  MEMBER_REMOVED: 'workspace.member.removed',

  // Projects
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_DELETED: 'project.deleted',
} as const;

export type AppEvent = (typeof AppEvents)[keyof typeof AppEvents];
