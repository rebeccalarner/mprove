import { z } from 'zod';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { zMember } from '#common/zod/backend/member';
import { zRole } from '#common/zod/backend/role';
import { zMyResponse } from '#common/zod/to/my-response';
import { zResponseInfo } from '#common/zod/to/response-info';
import { zToBackendRequest } from '#common/zod/to-backend/to-backend-request';
import { zToBackendRequestInfo } from '#common/zod/to-backend/to-backend-request-info';

export let zToBackendEditRoleGivenRequestPayload = z
  .object({
    projectId: z.string(),
    roleId: z.string(),
    givenId: z.string(),
    values: z.array(z.string())
  })
  .meta({ id: 'ToBackendEditRoleGivenRequestPayload' });

export let zToBackendEditRoleGivenRequestInfo = zToBackendRequestInfo
  .extend({
    name: z.literal(ToBackendRequestInfoNameEnum.ToBackendEditRoleGiven)
  })
  .meta({ id: 'ToBackendEditRoleGivenRequestInfo' });

export let zToBackendEditRoleGivenRequest = zToBackendRequest
  .extend({
    info: zToBackendEditRoleGivenRequestInfo,
    payload: zToBackendEditRoleGivenRequestPayload
  })
  .meta({ id: 'ToBackendEditRoleGivenRequest' });

export let zToBackendEditRoleGivenResponsePayload = z
  .object({
    userMember: zMember,
    roles: z.array(zRole)
  })
  .meta({ id: 'ToBackendEditRoleGivenResponsePayload' });

export let zToBackendEditRoleGivenResponseInfo = zResponseInfo
  .extend({
    path: z.literal(`/${ToBackendRequestInfoNameEnum.ToBackendEditRoleGiven}`),
    method: z.literal('POST')
  })
  .meta({ id: 'ToBackendEditRoleGivenResponseInfo' });

export let zToBackendEditRoleGivenResponse = zMyResponse
  .extend({
    info: zToBackendEditRoleGivenResponseInfo,
    payload: zToBackendEditRoleGivenResponsePayload
  })
  .meta({ id: 'ToBackendEditRoleGivenResponse' });

export type ToBackendEditRoleGivenRequestPayload = z.infer<
  typeof zToBackendEditRoleGivenRequestPayload
>;
export type ToBackendEditRoleGivenRequest = z.infer<
  typeof zToBackendEditRoleGivenRequest
>;
export type ToBackendEditRoleGivenResponsePayload = z.infer<
  typeof zToBackendEditRoleGivenResponsePayload
>;
export type ToBackendEditRoleGivenResponse = z.infer<
  typeof zToBackendEditRoleGivenResponse
>;
