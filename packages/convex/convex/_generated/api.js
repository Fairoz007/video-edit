/**
 * Stub — replaced when you run `npm run dev -w @docuforge/convex` or `npx convex dev`.
 */
export const api = {
  userProfiles: {
    me: 'userProfiles:me',
    ensure: 'userProfiles:ensure',
  },
  projects: {
    list: 'projects:list',
    get: 'projects:get',
    getDocument: 'projects:getDocument',
    create: 'projects:create',
    update: 'projects:update',
    remove: 'projects:remove',
    importFromLegacy: 'projects:importFromLegacy',
    importFromLegacyBatch: 'projects:importFromLegacyBatch',
  },
  renderJobs: {
    enqueue: 'renderJobs:enqueue',
    getByProject: 'renderJobs:getByProject',
  },
  r2: {
    generateUploadUrl: 'r2:generateUploadUrl',
  },
  assets: {
    listByProject: 'assets:listByProject',
    get: 'assets:get',
    completeUpload: 'assets:completeUpload',
    remove: 'assets:remove',
  },
};

export const internal = {
  projects: {
    getIfOwned: 'internal/projects:getIfOwned',
  },
};
