/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assets from "../assets.js";
import type * as http from "../http.js";
import type * as internal_projects from "../internal/projects.js";
import type * as lib_assetKinds from "../lib/assetKinds.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_legacyProject from "../lib/legacyProject.js";
import type * as lib_r2Config from "../lib/r2Config.js";
import type * as lib_r2Keys from "../lib/r2Keys.js";
import type * as lib_userProfile from "../lib/userProfile.js";
import type * as projects from "../projects.js";
import type * as r2 from "../r2.js";
import type * as renderJobs from "../renderJobs.js";
import type * as userProfiles from "../userProfiles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  http: typeof http;
  "internal/projects": typeof internal_projects;
  "lib/assetKinds": typeof lib_assetKinds;
  "lib/auth": typeof lib_auth;
  "lib/constants": typeof lib_constants;
  "lib/legacyProject": typeof lib_legacyProject;
  "lib/r2Config": typeof lib_r2Config;
  "lib/r2Keys": typeof lib_r2Keys;
  "lib/userProfile": typeof lib_userProfile;
  projects: typeof projects;
  r2: typeof r2;
  renderJobs: typeof renderJobs;
  userProfiles: typeof userProfiles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
