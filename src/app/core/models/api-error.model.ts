export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
  code?: string;
}
