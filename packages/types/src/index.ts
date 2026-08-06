export * from './order';
export * from './transaction';
export * from './verification';
export * from './timeline';
export * from './webhook';
export * from './invoice';
export * from './notification';
export * from './rbac';

// Shared API response wrapper
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
