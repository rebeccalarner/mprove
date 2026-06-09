import { z } from 'zod';
import { zBaseProject } from '#common/zod/backend/base-project';
import { zDiskCatalogFile } from '#common/zod/disk/disk-catalog-file';
import { zDiskCatalogNode } from '#common/zod/disk/disk-catalog-node';
import { zDiskFileChange } from '#common/zod/disk/disk-file-change';
import { zDiskSyncFile } from '#common/zod/disk/disk-sync-file';
import { zRepo } from '#common/zod/disk/repo';
import type { MyResponse } from '#common/zod/to/my-response';
import { zMyResponse } from '#common/zod/to/my-response';
import { zToDiskRequest } from '#common/zod/to-disk/to-disk-request';

export let zToDiskSyncRepoBaseRequestPayload = z.object({
  orgId: z.string(),
  baseProject: zBaseProject,
  repoId: z.string(),
  branch: z.string(),
  lastCommit: z.string(),
  getRepo: z.boolean().nullish(),
  getRepoNodes: z.boolean().nullish()
});

export let zToDiskSyncRepoRepo = zRepo
  .omit({ nodes: true, changesToCommit: true, changesToPush: true })
  .extend({
    nodes: z.array(zDiskCatalogNode).nullish()
  })
  .meta({ id: 'ToDiskSyncRepoRepo' });

export let zToDiskSyncRepoToServerRequestPayload =
  zToDiskSyncRepoBaseRequestPayload.extend({
    direction: z.literal('to-server'),
    changedFiles: z.array(zDiskSyncFile),
    deletedFiles: z.array(zDiskSyncFile)
  });

export let zToDiskSyncRepoFromServerRequestPayload =
  zToDiskSyncRepoBaseRequestPayload.extend({
    direction: z.literal('from-server')
  });

export let zToDiskSyncRepoRequestPayload = z
  .discriminatedUnion('direction', [
    zToDiskSyncRepoToServerRequestPayload,
    zToDiskSyncRepoFromServerRequestPayload
  ])
  .meta({ id: 'ToDiskSyncRepoRequestPayload' });

export let zToDiskSyncRepoRequest = zToDiskRequest
  .extend({
    payload: zToDiskSyncRepoRequestPayload
  })
  .meta({ id: 'ToDiskSyncRepoRequest' });

export let zToDiskSyncRepoBaseResponsePayload = z.object({
  files: z.array(zDiskCatalogFile),
  mproveDir: z.string(),
  devChangesToCommit: z.array(zDiskFileChange),
  repo: zToDiskSyncRepoRepo.nullish()
});

export let zToDiskSyncRepoToServerResponsePayload =
  zToDiskSyncRepoBaseResponsePayload.extend({
    direction: z.literal('to-server'),
    appliedChangesOnServer: z.array(z.string())
  });

export let zToDiskSyncRepoFromServerResponsePayload =
  zToDiskSyncRepoBaseResponsePayload.extend({
    direction: z.literal('from-server'),
    changedFiles: z.array(zDiskSyncFile),
    deletedFiles: z.array(zDiskSyncFile)
  });

export let zToDiskSyncRepoResponsePayload = z
  .discriminatedUnion('direction', [
    zToDiskSyncRepoToServerResponsePayload,
    zToDiskSyncRepoFromServerResponsePayload
  ])
  .meta({ id: 'ToDiskSyncRepoResponsePayload' });

export let zToDiskSyncRepoResponse = zMyResponse
  .extend({
    payload: zToDiskSyncRepoResponsePayload
  })
  .meta({ id: 'ToDiskSyncRepoResponse' });

export type ToDiskSyncRepoRequestPayload = z.infer<
  typeof zToDiskSyncRepoRequestPayload
>;
export type ToDiskSyncRepoRequest = z.infer<typeof zToDiskSyncRepoRequest>;
export type ToDiskSyncRepoResponsePayload = z.infer<
  typeof zToDiskSyncRepoResponsePayload
>;
export type ToDiskSyncRepoResponse = MyResponse & {
  payload: ToDiskSyncRepoResponsePayload;
};
