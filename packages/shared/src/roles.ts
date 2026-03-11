export const ROLES = ['customer', 'admin', 'courier'] as const;
export type Role = (typeof ROLES)[number];
