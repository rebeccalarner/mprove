import { api } from '../../../barrels/api';
import { helper } from '../../../barrels/helper';

let testId = 't-6-to-disk-delete-folder';

let traceId = '123';
let organizationId = testId;
let projectId = 'p1';

test(testId, async () => {
  let resp: api.ToDiskDeleteFolderResponse;

  try {
    let { messageService } = await helper.prepareTest(organizationId);

    let createOrganizationRequest: api.ToDiskCreateOrganizationRequest = {
      info: {
        name: api.ToDiskRequestInfoNameEnum.ToDiskCreateOrganization,
        traceId: traceId
      },
      payload: {
        organizationId: organizationId
      }
    };

    let createProjectRequest: api.ToDiskCreateProjectRequest = {
      info: {
        name: api.ToDiskRequestInfoNameEnum.ToDiskCreateProject,
        traceId: traceId
      },
      payload: {
        organizationId: organizationId,
        projectId: projectId,
        devRepoId: 'r1',
        userAlias: 'r1'
      }
    };

    let createFolderRequest: api.ToDiskCreateFolderRequest = {
      info: {
        name: api.ToDiskRequestInfoNameEnum.ToDiskCreateFolder,
        traceId: traceId
      },
      payload: {
        organizationId: organizationId,
        projectId: projectId,
        repoId: 'r1',
        branch: 'master',
        parentNodeId: `${projectId}/`,
        folderName: 'fo1'
      }
    };

    let deleteFolderRequest: api.ToDiskDeleteFolderRequest = {
      info: {
        name: api.ToDiskRequestInfoNameEnum.ToDiskDeleteFolder,
        traceId: traceId
      },
      payload: {
        organizationId: organizationId,
        projectId: projectId,
        repoId: 'r1',
        branch: 'master',
        folderNodeId: `${projectId}/fo1`
      }
    };

    let commitRepoRequest: api.ToDiskCommitRepoRequest = {
      info: {
        name: api.ToDiskRequestInfoNameEnum.ToDiskCommitRepo,
        traceId: traceId
      },
      payload: {
        organizationId: organizationId,
        projectId: projectId,
        repoId: 'r1',
        branch: 'master',
        userAlias: 'r1',
        commitMessage: 'commitMessage-1'
      }
    };

    await messageService.processRequest(createOrganizationRequest);
    await messageService.processRequest(createProjectRequest);

    await messageService.processRequest(createFolderRequest);
    await messageService.processRequest(commitRepoRequest);

    resp = await messageService.processRequest(deleteFolderRequest);
  } catch (e) {
    api.logToConsole(e);
  }

  expect(resp.payload.repoStatus).toBe(api.RepoStatusEnum.NeedCommit);
});
