import { api } from '../../barrels/api';
import { disk } from '../../barrels/disk';
import { constants } from '../../barrels/constants';
import { git } from '../../barrels/git';
import { transformAndValidate } from 'class-transformer-validator';
import { interfaces } from '../../barrels/interfaces';

export async function ToDiskDeleteBranch(
  request: api.ToDiskDeleteBranchRequest
): Promise<api.ToDiskDeleteBranchResponse> {
  let requestValid = await transformAndValidate(
    api.ToDiskDeleteBranchRequest,
    request
  );
  let { traceId } = requestValid.info;
  let { organizationId, projectId, repoId, branch } = requestValid.payload;

  let orgDir = `${constants.ORGANIZATIONS_PATH}/${organizationId}`;
  let projectDir = `${orgDir}/${projectId}`;
  let repoDir = `${projectDir}/${repoId}`;

  //

  let isOrgExist = await disk.isPathExist(orgDir);
  if (isOrgExist === false) {
    throw Error(api.ErEnum.M_DISK_ORGANIZATION_IS_NOT_EXIST);
  }

  let isProjectExist = await disk.isPathExist(projectDir);
  if (isProjectExist === false) {
    throw Error(api.ErEnum.M_DISK_PROJECT_IS_NOT_EXIST);
  }

  let isRepoExist = await disk.isPathExist(repoDir);
  if (isRepoExist === false) {
    throw Error(api.ErEnum.M_DISK_REPO_IS_NOT_EXIST);
  }

  if (repoId === constants.PROD_REPO_ID) {
    let isRemoteBranchExist = await git.isRemoteBranchExist({
      repoDir: repoDir,
      branch: branch
    });

    if (isRemoteBranchExist === true) {
      await git.deleteRemoteBranch({
        projectDir: projectDir,
        branch: branch
      });
    }
  }

  let isLocalBranchExist = await git.isLocalBranchExist({
    repoDir: repoDir,
    branch: branch
  });

  if (isLocalBranchExist === false) {
    throw Error(api.ErEnum.M_DISK_BRANCH_IS_NOT_EXIST);
  }

  await git.deleteLocalBranch({
    repoDir: repoDir,
    branch: branch
  });

  let { repoStatus, currentBranch, conflicts } = <interfaces.ItemStatus>(
    await git.getRepoStatus({
      projectId: projectId,
      projectDir: projectDir,
      repoId: repoId,
      repoDir: repoDir
    })
  );

  let response: api.ToDiskDeleteBranchResponse = {
    info: {
      status: api.ToDiskResponseInfoStatusEnum.Ok,
      traceId: traceId
    },
    payload: {
      organizationId: organizationId,
      projectId: projectId,
      repoId: repoId,
      deletedBranch: branch,
      repoStatus: repoStatus,
      currentBranch: currentBranch,
      conflicts: conflicts
    }
  };

  return response;
}
