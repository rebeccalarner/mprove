import path from 'node:path';
import fse from 'fs-extra';
import { ErEnum } from '#common/enums/er.enum';
import { ServerError } from '#common/models/server-error';

export async function resolveRepoFilePath(item: {
  repoDir: string;
  filePath: string;
}) {
  let { repoDir, filePath } = item;

  let repoRealPath = await fse.realpath(repoDir);
  let targetPath = path.resolve(repoRealPath, filePath);
  let isInsideRepo =
    targetPath === repoRealPath ||
    targetPath.startsWith(`${repoRealPath}${path.sep}`);

  if (isInsideRepo === false) {
    throw new ServerError({
      message: ErEnum.DISK_PATH_TRAVERSAL,
      displayData: {
        path: filePath
      }
    });
  }

  return targetPath;
}
