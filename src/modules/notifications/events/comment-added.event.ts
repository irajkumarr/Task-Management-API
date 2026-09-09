export class CommentAddedEvent {
  constructor(
    public readonly commentId: string,
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly projectId: string,
    public readonly workspaceId: string,
    public readonly recipientId: string, // task assignee or creator
    public readonly authorId: string,
    public readonly authorName: string,
  ) {}
}
