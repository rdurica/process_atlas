import type { AdminUserItem, CreateUserPayload } from '@/shared/api/processAtlasApi';

export type UserItem = AdminUserItem;

export type UserFormState = CreateUserPayload;

export const ALL_ROLES = ['admin', 'process_owner', 'user'];
