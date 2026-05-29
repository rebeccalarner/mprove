import { z } from 'zod';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { zMember } from '#common/zod/backend/member';
import { zRole } from '#common/zod/backend/role';
import { zMyResponse } from '#common/zod/to/my-response';
import { zResponseInfo } from '#common/zod/to/response-info';
import { zToBackendRequest } from '#common/zod/to-backend/to-backend-request';
import { zToBackendRequestInfo } from '#common/zod/to-backend/to-backend-request-info';

export let zToBackendDeleteRoleGivenRequestPayload = z
  .object({
    projectId: z.string(),
    roleId: z.string(),
    givenId: z.string()
  })
  .meta({ id: 'ToBackendDeleteRoleGivenRequestPayload' });

export let zToBackendDeleteRoleGivenRequestInfo = zToBackendRequestInfo
  .extend({
    name: z.literal(ToBackendRequestInfoNameEnum.ToBackendDeleteRoleGiven)
  })
  .meta({ id: 'ToBackendDeleteRoleGivenRequestInfo' });

export let zToBackendDeleteRoleGivenRequest = zToBackendRequest
  .extend({
    info: zToBackendDeleteRoleGivenRequestInfo,
    payload: zToBackendDeleteRoleGivenRequestPayload
  })
  .meta({ id: 'ToBackendDeleteRoleGivenRequest' });

export let zToBackendDeleteRoleGivenResponsePayload = z
  .object({
    userMember: zMember,
    roles: z.array(zRole)
  })
  .meta({ id: 'ToBackendDeleteRoleGivenResponsePayload' });

export let zToBackendDeleteRoleGivenResponseInfo = zResponseInfo
  .extend({
    path: z.literal(
      `/${ToBackendRequestInfoNameEnum.ToBackendDeleteRoleGiven}`
    ),
    method: z.literal('POST')
  })
  .meta({ id: 'ToBackendDeleteRoleGivenResponseInfo' });

export let zToBackendDeleteRoleGivenResponse = zMyResponse
  .extend({
    info: zToBackendDeleteRoleGivenResponseInfo,
    payload: zToBackendDeleteRoleGivenResponsePayload
  })
  .meta({ id: 'ToBackendDeleteRoleGivenResponse' });

export type ToBackendDeleteRoleGivenRequestPayload = z.infer<
  typeof zToBackendDeleteRoleGivenRequestPayload
>;
export type ToBackendDeleteRoleGivenRequest = z.infer<
  typeof zToBackendDeleteRoleGivenRequest
>;
export type ToBackendDeleteRoleGivenResponsePayload = z.infer<
  typeof zToBackendDeleteRoleGivenResponsePayload
>;
export type ToBackendDeleteRoleGivenResponse = z.infer<
  typeof zToBackendDeleteRoleGivenResponse
>;
