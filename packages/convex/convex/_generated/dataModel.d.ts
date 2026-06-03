import type { GenericId } from 'convex/values';

export type Id<TableName extends string> = GenericId<TableName>;

export type DataModel = {
  users: { _id: Id<'users'> };
  userProfiles: { _id: Id<'userProfiles'> };
  projects: { _id: Id<'projects'> };
  assets: { _id: Id<'assets'> };
  renderJobs: { _id: Id<'renderJobs'> };
};
