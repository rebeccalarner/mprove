import { z } from 'zod';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { zMember } from '#common/zod/backend/member';
import { zRole } from '#common/zod/backend/role';
import { zMyResponse } from '#common/zod/to/my-response';
import { zResponseInfo } from '#common/zod/to/response-info';
import { zToBackendRequest } from '#common/zod/to-backend/to-backend-request';
import { zToBackendRequestInfo } from '#common/zod/to-backend/to-backend-request-info';

export let zToBackendGetRolesRequestPayload = z
  .object({
    projectId: z.string()
  })
  .meta({ id: 'ToBackendGetRolesRequestPayload' });

export let zToBackendGetRolesRequestInfo = zToBackendRequestInfo
  .extend({
    name: z.literal(ToBackendRequestInfoNameEnum.ToBackendGetRoles)
  })
  .meta({ id: 'ToBackendGetRolesRequestInfo' });

export let zToBackendGetRolesRequest = zToBackendRequest
  .extend({
    info: zToBackendGetRolesRequestInfo,
    payload: zToBackendGetRolesRequestPayload
  })
  .meta({ id: 'ToBackendGetRolesRequest' });

export let zToBackendGetRolesResponsePayload = z
  .object({
    userMember: zMember,
    roles: z.array(zRole)
  })
  .meta({ id: 'ToBackendGetRolesResponsePayload' });

export let zToBackendGetRolesResponseInfo = zResponseInfo
  .extend({
    path: z.literal(`/${ToBackendRequestInfoNameEnum.ToBackendGetRoles}`),
    method: z.literal('POST')
  })
  .meta({ id: 'ToBackendGetRolesResponseInfo' });

export let zToBackendGetRolesResponse = zMyResponse
  .extend({
    info: zToBackendGetRolesResponseInfo,
    payload: zToBackendGetRolesResponsePayload
  })
  .meta({ id: 'ToBackendGetRolesResponse' });

export type ToBackendGetRolesRequestPayload = z.infer<
  typeof zToBackendGetRolesRequestPayload
>;
export type ToBackendGetRolesRequest = z.infer<
  typeof zToBackendGetRolesRequest
>;
export type ToBackendGetRolesResponsePayload = z.infer<
  typeof zToBackendGetRolesResponsePayload
>;
export type ToBackendGetRolesResponse = z.infer<
  typeof zToBackendGetRolesResponse
>;
