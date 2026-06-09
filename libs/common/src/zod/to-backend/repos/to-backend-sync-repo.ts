import { z } from 'zod';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { zBmlError } from '#common/zod/blockml/bml-error';
import { zDiskCatalogNode } from '#common/zod/disk/disk-catalog-node';
import { zDiskFileChange } from '#common/zod/disk/disk-file-change';
import { zDiskSyncFile } from '#common/zod/disk/disk-sync-file';
import { zRepo } from '#common/zod/disk/repo';
import type { MyResponse } from '#common/zod/to/my-response';
import { zMyResponse } from '#common/zod/to/my-response';
import { zResponseInfo } from '#common/zod/to/response-info';
import { zToBackendRequest } from '#common/zod/to-backend/to-backend-request';
import { zToBackendRequestInfo } from '#common/zod/to-backend/to-backend-request-info';

export let zToBackendSyncRepoBaseRequestPayload = z.object({
  projectId: z.string(),
  repoId: z.string(),
  branchId: z.string(),
  lastCommit: z.string(),
  envId: z.string(),
  getRepo: z.boolean().nullish(),
  getRepoNodes: z.boolean().nullish(),
  getErrors: z.boolean().nullish(),
  debug: z.boolean().nullish()
});

export let zToBackendSyncRepoRepo = zRepo
  .omit({ nodes: true, changesToCommit: true, changesToPush: true })
  .extend({
    nodes: z.array(zDiskCatalogNode).nullish()
  })
  .meta({ id: 'ToBackendSyncRepoRepo' });

export let zToBackendSyncRepoToServerRequestPayload =
  zToBackendSyncRepoBaseRequestPayload.extend({
    direction: z.literal('to-server'),
    changedFiles: z.array(zDiskSyncFile),
    deletedFiles: z.array(zDiskSyncFile)
  });

export let zToBackendSyncRepoFromServerRequestPayload =
  zToBackendSyncRepoBaseRequestPayload.extend({
    direction: z.literal('from-server')
  });

export let zToBackendSyncRepoRequestPayload = z
  .discriminatedUnion('direction', [
    zToBackendSyncRepoToServerRequestPayload,
    zToBackendSyncRepoFromServerRequestPayload
  ])
  .meta({ id: 'ToBackendSyncRepoRequestPayload' });

export let zToBackendSyncRepoRequestInfo = zToBackendRequestInfo
  .extend({
    name: z.literal(ToBackendRequestInfoNameEnum.ToBackendSyncRepo)
  })
  .meta({ id: 'ToBackendSyncRepoRequestInfo' });

export let zToBackendSyncRepoRequest = zToBackendRequest
  .extend({
    info: zToBackendSyncRepoRequestInfo,
    payload: zToBackendSyncRepoRequestPayload
  })
  .meta({ id: 'ToBackendSyncRepoRequest' });

export let zToBackendSyncRepoBaseResponsePayload = z.object({
  orgId: z.string(),
  repoId: z.string(),
  validationErrorsTotal: z.number(),
  validationErrors: z.array(zBmlError).nullish(),
  devChangesToCommit: z.array(zDiskFileChange),
  repo: zToBackendSyncRepoRepo.nullish(),
  needValidate: z.boolean().nullish(),
  structId: z.string().nullish()
});

export let zToBackendSyncRepoToServerResponsePayload =
  zToBackendSyncRepoBaseResponsePayload.extend({
    direction: z.literal('to-server'),
    appliedChangesOnServer: z.array(z.string())
  });

export let zToBackendSyncRepoFromServerResponsePayload =
  zToBackendSyncRepoBaseResponsePayload.extend({
    direction: z.literal('from-server'),
    changedFiles: z.array(zDiskSyncFile),
    deletedFiles: z.array(zDiskSyncFile)
  });

export let zToBackendSyncRepoResponsePayload = z
  .discriminatedUnion('direction', [
    zToBackendSyncRepoToServerResponsePayload,
    zToBackendSyncRepoFromServerResponsePayload
  ])
  .meta({ id: 'ToBackendSyncRepoResponsePayload' });

export let zToBackendSyncRepoResponseInfo = zResponseInfo
  .extend({
    path: z.literal(`/${ToBackendRequestInfoNameEnum.ToBackendSyncRepo}`),
    method: z.literal('POST')
  })
  .meta({ id: 'ToBackendSyncRepoResponseInfo' });

export let zToBackendSyncRepoResponse = zMyResponse
  .extend({
    info: zToBackendSyncRepoResponseInfo,
    payload: zToBackendSyncRepoResponsePayload
  })
  .meta({ id: 'ToBackendSyncRepoResponse' });

export type ToBackendSyncRepoRequestPayload = z.infer<
  typeof zToBackendSyncRepoRequestPayload
>;
export type ToBackendSyncRepoRequest = z.infer<
  typeof zToBackendSyncRepoRequest
>;
export type ToBackendSyncRepoResponsePayload = z.infer<
  typeof zToBackendSyncRepoResponsePayload
>;
export type ToBackendSyncRepoResponse = MyResponse & {
  payload: ToBackendSyncRepoResponsePayload;
};
