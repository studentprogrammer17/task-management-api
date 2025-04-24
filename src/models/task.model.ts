export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  subtasks?: Task[];
  endTime?: string;
  createdAt: string;
  lat?: number;
  lng?: number;
  parentId?: string;
  categoryId?: string;
  userId: string;
  categoryName?: string;
  comments?: Comment[];
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  categoryId?: string;
  endTime?: string;
  lat?: number;
  lng?: number;
  status: TaskStatus;
  subtasks?: CreateTaskDto[];
  parentId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  lat?: number;
  lng?: number;
  endTime?: string;
  description?: string;
  categoryId?: string;
  status?: TaskStatus;
  subtasks?: CreateTaskDto[];
}
