export class ClientProjectResponseDto {
  id!: string;
  name!: string;
  description!: string | null;
  status!: string;
  priority!: string;
  progress!: number;
  startDate!: string | null;
  endDate!: string | null;
  createdAt!: string;
  updatedAt!: string;
  taskStats!: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
}

export class ClientProjectDetailDto extends ClientProjectResponseDto {
  tasks!: ClientTaskDto[];
  files!: ClientFileDto[];
}

export class ClientTaskDto {
  id!: string;
  title!: string;
  status!: string;
  priority!: string;
  dueDate!: string | null;
  assignee!: {
    id: string;
    name: string;
  } | null;
}

export class ClientFileDto {
  id!: string;
  filename!: string;
  originalName!: string;
  mimeType!: string;
  size!: number;
  uploadedAt!: string;
  uploadedBy!: {
    id: string;
    name: string;
  };
}

export class ClientProjectListResponseDto {
  projects!: ClientProjectResponseDto[];
  total!: number;
}

export class ClientProgressDto {
  projectId!: string;
  totalTasks!: number;
  completedTasks!: number;
  progress!: number;
  recentActivity!: {
    type: string;
    description: string;
    date: string;
  }[];
}
