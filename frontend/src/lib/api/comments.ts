import { api } from './index';

// Types
export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface Comment {
  id: string;
  content: string;
  projectId: string | null;
  taskId: string | null;
  parentId: string | null;
  author: CommentAuthor;
  replies?: Comment[];
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommentListParams {
  projectId?: string;
  taskId?: string;
  page?: number;
  limit?: number;
}

export interface CreateCommentInput {
  content: string;
  projectId?: string;
  taskId?: string;
  parentId?: string;
}

export interface UpdateCommentInput {
  content: string;
}

// API functions
export const commentsApi = {
  // List comments
  list: async (params: CommentListParams): Promise<CommentListResponse> => {
    const searchParams = new URLSearchParams();
    if (params.projectId) searchParams.set('projectId', params.projectId);
    if (params.taskId) searchParams.set('taskId', params.taskId);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    const response = await api.get(`/comments?${searchParams}`);
    return response.data;
  },

  // Create comment
  create: async (input: CreateCommentInput): Promise<Comment> => {
    const response = await api.post('/comments', input);
    return response.data;
  },

  // Update comment
  update: async (id: string, input: UpdateCommentInput): Promise<Comment> => {
    const response = await api.patch(`/comments/${id}`, input);
    return response.data;
  },

  // Delete comment
  delete: async (id: string): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },
};

// Helper type for parsed mention parts
export interface MentionPart {
  type: 'mention' | 'text';
  value: string;
  key: number;
}

// Helper to parse mentions for display
export function parseMentionsForDisplay(content: string): MentionPart[] {
  const parts = content.split(/(@[a-zA-Z0-9._-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return { type: 'mention', value: part, key: i };
    }
    return { type: 'text', value: part, key: i };
  });
}
