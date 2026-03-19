export const ROLES = ['customer', 'admin', 'motoboy'] as const;
export type Role = (typeof ROLES)[number];
