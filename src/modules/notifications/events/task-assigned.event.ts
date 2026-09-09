export class TaskAssignedEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly projectId: string,
    public readonly workspaceId: string,
    public readonly assigneeId: string,
    public readonly actorId: string,
    public readonly actorName: string,
  ) {}
}
