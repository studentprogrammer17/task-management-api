export interface Comment {
  id: string;
  text: string;
  taskId: string;
  createdAt: string;
}

export interface CreateCommentDto {
  text: string;
  taskId: string;
}

export interface UpdateCommentDto {
  text: string;
}
