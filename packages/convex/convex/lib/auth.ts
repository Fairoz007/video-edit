import type { MutationCtx, QueryCtx } from '../_generated/server';
import { APP_USER_ID } from './constants';

export function getAppUserId() {
  return APP_USER_ID;
}

export async function requireUserId(_ctx: QueryCtx | MutationCtx) {
  return APP_USER_ID;
}
