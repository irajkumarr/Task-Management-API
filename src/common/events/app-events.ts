export class TaskCreatedEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly projectId: string,
    public readonly workspaceId: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class TaskUpdatedEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly projectId: string,
    public readonly workspaceId: string,
    public readonly actorId: string,
    public readonly actorName: string,
    public readonly changes?: Record<string, any>,
  ) {}
}

export class TaskMovedEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly projectId: string,
    public readonly workspaceId: string,
    public readonly status: string,
    public readonly position: number,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class TaskDeletedEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly projectId: string,
    public readonly workspaceId: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class TaskAttachmentUploadedEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly projectId: string,
    public readonly workspaceId: string,
    public readonly fileCount: number,
    public readonly actorId: string,
    public readonly actorName: string,
    public readonly recipientId?: string,
  ) {}
}

export class TaskAttachmentDeletedEvent {
  constructor(
    public readonly taskId: string,
    public readonly attachmentId: string,
    public readonly originalName: string,
    public readonly projectId: string,
    public readonly workspaceId: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class CommentDeletedEvent {
  constructor(
    public readonly commentId: string,
    public readonly taskId: string,
    public readonly projectId: string,
    public readonly workspaceId: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class ProjectCreatedEvent {
  constructor(
    public readonly projectId: string,
    public readonly projectName: string,
    public readonly workspaceId: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class ProjectUpdatedEvent {
  constructor(
    public readonly projectId: string,
    public readonly projectName: string,
    public readonly workspaceId: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class ProjectDeletedEvent {
  constructor(
    public readonly projectId: string,
    public readonly projectName: string,
    public readonly workspaceId: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class MemberJoinedEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly role: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class MemberRoleChangedEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly oldRole: string,
    public readonly newRole: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}

export class MemberRemovedEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}
