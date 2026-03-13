export type JobStatus = 'pending' | 'processing' | 'succeeded' | 'failed';

export type JobName =
  | 'orders.after_place'
  | 'orders.after_cancel'
  | 'auth.audit_login';

export type JobRow = {
  id: string;
  name: JobName;
  payload: unknown;
  runAt: string;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  lockedAt: string | null;
  lockedBy: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobHandler = (job: JobRow) => Promise<void>;
