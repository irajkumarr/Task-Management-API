export class TaskStatusChangedEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly projectId: string,
    public readonly workspaceId: string,
    public readonly recipientId: string, // task creator or assignee
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}
