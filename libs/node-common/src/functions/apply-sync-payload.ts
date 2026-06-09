import path from 'node:path';
import fse from 'fs-extra';
import pIteration from 'p-iteration';

const { forEachSeries } = pIteration;

import { ErEnum } from '#common/enums/er.enum';
import { ServerError } from '#common/models/server-error';
import type { DiskSyncFile } from '#common/zod/disk/disk-sync-file';
import { validatePathUnderDir } from './validate-path-under-dir';

export async function applySyncPayload(item: {
  repoDir: string;
  changedFiles: DiskSyncFile[];
  deletedFiles: DiskSyncFile[];
}) {
  let { repoDir, changedFiles, deletedFiles } = item;

  await forEachSeries(deletedFiles, async (deletedFile: DiskSyncFile) => {
    let filePath = validatePathUnderDir({
      fullPath: path.resolve(repoDir, deletedFile.path),
      allowedDir: repoDir,
      displayPath: deletedFile.path
    });

    await fse.remove(filePath);
  });

  await forEachSeries(changedFiles, async (changedFile: DiskSyncFile) => {
    let filePath = validatePathUnderDir({
      fullPath: path.resolve(repoDir, changedFile.path),
      allowedDir: repoDir,
      displayPath: changedFile.path
    });
    let stat: fse.Stats | undefined;

    try {
      stat = await fse.lstat(filePath);
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }

    if (stat?.isSymbolicLink() === true) {
      throw new ServerError({ message: ErEnum.FILE_IS_SYMLINK });
    }

    if (stat?.isDirectory() === true) {
      await fse.remove(filePath);
    }

    let parentPath = filePath.split('/').slice(0, -1).join('/');
    await fse.ensureDir(parentPath);
    await fse.writeFile(filePath, changedFile.content ?? '');
  });
}
