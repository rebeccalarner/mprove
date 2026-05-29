import { z } from 'zod';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { zMember } from '#common/zod/backend/member';
import { zRole } from '#common/zod/backend/role';
import { zMyResponse } from '#common/zod/to/my-response';
import { zResponseInfo } from '#common/zod/to/response-info';
import { zToBackendRequest } from '#common/zod/to-backend/to-backend-request';
import { zToBackendRequestInfo } from '#common/zod/to-backend/to-backend-request-info';

export let zToBackendDeleteRoleRequestPayload = z
  .object({
    projectId: z.string(),
    roleId: z.string()
  })
  .meta({ id: 'ToBackendDeleteRoleRequestPayload' });

export let zToBackendDeleteRoleRequestInfo = zToBackendRequestInfo
  .extend({
    name: z.literal(ToBackendRequestInfoNameEnum.ToBackendDeleteRole)
  })
  .meta({ id: 'ToBackendDeleteRoleRequestInfo' });

export let zToBackendDeleteRoleRequest = zToBackendRequest
  .extend({
    info: zToBackendDeleteRoleRequestInfo,
    payload: zToBackendDeleteRoleRequestPayload
  })
  .meta({ id: 'ToBackendDeleteRoleRequest' });

export let zToBackendDeleteRoleResponsePayload = z
  .object({
    userMember: zMember,
    roles: z.array(zRole)
  })
  .meta({ id: 'ToBackendDeleteRoleResponsePayload' });

export let zToBackendDeleteRoleResponseInfo = zResponseInfo
  .extend({
    path: z.literal(`/${ToBackendRequestInfoNameEnum.ToBackendDeleteRole}`),
    method: z.literal('POST')
  })
  .meta({ id: 'ToBackendDeleteRoleResponseInfo' });

export let zToBackendDeleteRoleResponse = zMyResponse
  .extend({
    info: zToBackendDeleteRoleResponseInfo,
    payload: zToBackendDeleteRoleResponsePayload
  })
  .meta({ id: 'ToBackendDeleteRoleResponse' });

export type ToBackendDeleteRoleRequestPayload = z.infer<
  typeof zToBackendDeleteRoleRequestPayload
>;
export type ToBackendDeleteRoleRequest = z.infer<
  typeof zToBackendDeleteRoleRequest
>;
export type ToBackendDeleteRoleResponsePayload = z.infer<
  typeof zToBackendDeleteRoleResponsePayload
>;
export type ToBackendDeleteRoleResponse = z.infer<
  typeof zToBackendDeleteRoleResponse
>;
