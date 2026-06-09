import pIteration from 'p-iteration';
import type { StatusResult } from 'simple-git';

const { forEachSeries } = pIteration;

import { FileStatusEnum } from '#common/enums/file-status.enum';
import type { DiskSyncFile } from '#common/zod/disk/disk-sync-file';
import type { FileWithStatusType } from '#common/zod/disk/git-file-status-type';
import { readFileCheckSize } from './read-file-check-size';

export async function getSyncFiles(item: {
  statusResult: StatusResult;
  repoDir: string;
}) {
  let { statusResult, repoDir } = item;

  return await getWorkingTreePayload({
    statusResult: statusResult,
    repoDir: repoDir
  });
}

export async function getWorkingTreePayload(item: {
  statusResult: StatusResult;
  repoDir: string;
}) {
  let { statusResult, repoDir } = item;

  let changedFiles: DiskSyncFile[] = [];
  let deletedFiles: DiskSyncFile[] = [];

  let allFiles: FileWithStatusType[] = [
    ...statusResult.not_added.map(path => ({
      path,
      type: 'not_added' as const
    })),
    ...statusResult.created.map(path => ({ path, type: 'created' as const })),
    ...statusResult.deleted.map(path => ({ path, type: 'deleted' as const })),
    ...statusResult.modified.map(path => ({ path, type: 'modified' as const })),
    ...statusResult.renamed.flatMap(r => [
      { path: r.from, type: 'deleted' as const },
      { path: r.to, type: 'created' as const }
    ]),
    ...statusResult.conflicted.map(path => ({
      path,
      type: 'conflicted' as const
    }))
  ];

  let uniquePaths = new Set<string>();
  let files: FileWithStatusType[] = [];
  allFiles.forEach(file => {
    if (!uniquePaths.has(file.path)) {
      uniquePaths.add(file.path);
      files.push(file);
    }
  });
  files.sort((a, b) => a.path.localeCompare(b.path));

  await forEachSeries(files, async (x: FileWithStatusType) => {
    let path = x.path;

    let status: FileStatusEnum =
      x.type === 'not_added' || x.type === 'created'
        ? FileStatusEnum.New
        : x.type === 'deleted'
          ? FileStatusEnum.Deleted
          : x.type === 'modified'
            ? FileStatusEnum.Modified
            : x.type === 'conflicted'
              ? FileStatusEnum.Conflicted
              : undefined;

    let content: string;
    if (status !== FileStatusEnum.Deleted) {
      let fullPath = `${repoDir}/${path}`;

      let { content: cont } = await readFileCheckSize({
        filePath: fullPath,
        getStat: false
      });

      content = cont;
    }

    let file: DiskSyncFile = {
      path: path,
      status: status,
      content: content
    };

    if (file.status === FileStatusEnum.Deleted) {
      deletedFiles.push(file);
    } else {
      changedFiles.push(file);
    }
  });

  return {
    changedFiles: changedFiles,
    deletedFiles: deletedFiles
  };
}
