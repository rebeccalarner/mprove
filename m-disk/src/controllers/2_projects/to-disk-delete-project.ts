import { api } from '../../barrels/api';
import { disk } from '../../barrels/disk';
import { git } from '../../barrels/git';
import { constants } from '../../barrels/constants';
import { transformAndValidate } from 'class-transformer-validator';

export async function ToDiskDeleteProject(
  request: api.ToDiskDeleteProjectRequest
): Promise<api.ToDiskDeleteProjectResponse> {
  let requestValid = await transformAndValidate(
    api.ToDiskDeleteProjectRequest,
    request
  );
  let { traceId } = requestValid.info;
  let { organizationId, projectId } = requestValid.payload;

  let orgDir = `${constants.ORGANIZATIONS_PATH}/${organizationId}`;
  let projectDir = `${orgDir}/${projectId}`;

  //

  let isOrgExist = await disk.isPathExist(orgDir);
  if (isOrgExist === false) {
    throw Error(api.ErEnum.M_DISK_ORGANIZATION_IS_NOT_EXIST);
  }

  let isProjectExist = await disk.isPathExist(projectDir);
  if (isProjectExist === false) {
    throw Error(api.ErEnum.M_DISK_PROJECT_IS_NOT_EXIST);
  }

  //

  await disk.removePath(projectDir);

  let response: api.ToDiskDeleteProjectResponse = {
    info: {
      status: api.ToDiskResponseInfoStatusEnum.Ok,
      traceId: traceId
    },
    payload: {
      organizationId: organizationId,
      deletedProjectId: projectId
    }
  };

  return response;
}
