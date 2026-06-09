import path from 'node:path';
import fse from 'fs-extra';
import pIteration from 'p-iteration';
import type { StatusResult } from 'simple-git';

const { forEachSeries } = pIteration;

import type { DiskSyncFile } from '#common/zod/disk/disk-sync-file';
import { readFileCheckSize } from './read-file-check-size';
import { validatePathUnderDir } from './validate-path-under-dir';

let statusOrder = {
  deleted: 1,
  modified: 2,
  new: 3
};

export async function getSyncAppliedChanges(item: {
  repoDir: string;
  changedFiles: DiskSyncFile[];
  deletedFiles: DiskSyncFile[];
  statusResult: StatusResult;
}) {
  let { repoDir, changedFiles, deletedFiles, statusResult } = item;

  let changes: { status: keyof typeof statusOrder; path: string }[] = [];

  let payloadPaths = new Set<string>([
    ...changedFiles.map(file => file.path),
    ...deletedFiles.map(file => file.path)
  ]);

  await forEachSeries(deletedFiles, async (deletedFile: DiskSyncFile) => {
    let filePath = validatePathUnderDir({
      fullPath: path.resolve(repoDir, deletedFile.path),
      allowedDir: repoDir,
      displayPath: deletedFile.path
    });

    let pathExists = await fse.pathExists(filePath);

    if (pathExists === true) {
      changes.push({
        status: 'deleted',
        path: deletedFile.path
      });
    }
  });

  await forEachSeries(changedFiles, async (changedFile: DiskSyncFile) => {
    let filePath = validatePathUnderDir({
      fullPath: path.resolve(repoDir, changedFile.path),
      allowedDir: repoDir,
      displayPath: changedFile.path
    });

    let stat: fse.Stats;

    try {
      stat = await fse.lstat(filePath);
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }

    if (stat === undefined) {
      changes.push({
        status: 'new',
        path: changedFile.path
      });
      return;
    }

    if (stat.isFile() === false) {
      changes.push({
        status: 'modified',
        path: changedFile.path
      });
      return;
    }

    let { content } = await readFileCheckSize({
      filePath: filePath,
      getStat: false
    });

    if (content !== changedFile.content) {
      changes.push({
        status: 'modified',
        path: changedFile.path
      });
    }
  });

  let destinationOnlyChanges = getDestinationOnlyChanges({
    statusResult: statusResult,
    payloadPaths: payloadPaths
  });

  destinationOnlyChanges.forEach(change => {
    changes.push(change);
  });

  let uniqueChanges = new Map<
    string,
    { status: keyof typeof statusOrder; path: string }
  >();

  changes.forEach(change => {
    uniqueChanges.set(`${change.status}:${change.path}`, change);
  });

  let sortedChanges = [...uniqueChanges.values()];

  sortedChanges.sort((a, b) => {
    let statusDiff = statusOrder[a.status] - statusOrder[b.status];

    if (statusDiff !== 0) {
      return statusDiff;
    }

    return a.path.localeCompare(b.path);
  });

  return sortedChanges.map(change => `(${change.status}) ${change.path}`);
}

function getDestinationOnlyChanges(item: {
  statusResult: StatusResult;
  payloadPaths: Set<string>;
}) {
  let { statusResult, payloadPaths } = item;

  let changes: { status: keyof typeof statusOrder; path: string }[] = [];

  let addChange = (change: {
    status: keyof typeof statusOrder;
    path: string;
  }) => {
    if (payloadPaths.has(change.path) === false) {
      changes.push(change);
    }
  };

  statusResult.not_added.forEach(path => {
    addChange({ status: 'deleted', path: path });
  });
  statusResult.created.forEach(path => {
    addChange({ status: 'deleted', path: path });
  });
  statusResult.deleted.forEach(path => {
    addChange({ status: 'new', path: path });
  });
  statusResult.modified.forEach(path => {
    addChange({ status: 'modified', path: path });
  });
  statusResult.renamed.forEach(file => {
    addChange({ status: 'new', path: file.from });
    addChange({ status: 'deleted', path: file.to });
  });
  statusResult.conflicted.forEach(path => {
    addChange({ status: 'modified', path: path });
  });

  return changes;
}
