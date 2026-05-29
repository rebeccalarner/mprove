import { z } from 'zod';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { zMember } from '#common/zod/backend/member';
import { zRole } from '#common/zod/backend/role';
import { zMyResponse } from '#common/zod/to/my-response';
import { zResponseInfo } from '#common/zod/to/response-info';
import { zToBackendRequest } from '#common/zod/to-backend/to-backend-request';
import { zToBackendRequestInfo } from '#common/zod/to-backend/to-backend-request-info';

export let zToBackendCreateRoleGivenRequestPayload = z
  .object({
    projectId: z.string(),
    roleId: z.string(),
    givenId: z.string(),
    values: z.array(z.string())
  })
  .meta({ id: 'ToBackendCreateRoleGivenRequestPayload' });

export let zToBackendCreateRoleGivenRequestInfo = zToBackendRequestInfo
  .extend({
    name: z.literal(ToBackendRequestInfoNameEnum.ToBackendCreateRoleGiven)
  })
  .meta({ id: 'ToBackendCreateRoleGivenRequestInfo' });

export let zToBackendCreateRoleGivenRequest = zToBackendRequest
  .extend({
    info: zToBackendCreateRoleGivenRequestInfo,
    payload: zToBackendCreateRoleGivenRequestPayload
  })
  .meta({ id: 'ToBackendCreateRoleGivenRequest' });

export let zToBackendCreateRoleGivenResponsePayload = z
  .object({
    userMember: zMember,
    roles: z.array(zRole)
  })
  .meta({ id: 'ToBackendCreateRoleGivenResponsePayload' });

export let zToBackendCreateRoleGivenResponseInfo = zResponseInfo
  .extend({
    path: z.literal(
      `/${ToBackendRequestInfoNameEnum.ToBackendCreateRoleGiven}`
    ),
    method: z.literal('POST')
  })
  .meta({ id: 'ToBackendCreateRoleGivenResponseInfo' });

export let zToBackendCreateRoleGivenResponse = zMyResponse
  .extend({
    info: zToBackendCreateRoleGivenResponseInfo,
    payload: zToBackendCreateRoleGivenResponsePayload
  })
  .meta({ id: 'ToBackendCreateRoleGivenResponse' });

export type ToBackendCreateRoleGivenRequestPayload = z.infer<
  typeof zToBackendCreateRoleGivenRequestPayload
>;
export type ToBackendCreateRoleGivenRequest = z.infer<
  typeof zToBackendCreateRoleGivenRequest
>;
export type ToBackendCreateRoleGivenResponsePayload = z.infer<
  typeof zToBackendCreateRoleGivenResponsePayload
>;
export type ToBackendCreateRoleGivenResponse = z.infer<
  typeof zToBackendCreateRoleGivenResponse
>;
