import { z } from 'zod';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { zUser } from '#common/zod/backend/user';
import { zMyResponse } from '#common/zod/to/my-response';
import { zResponseInfo } from '#common/zod/to/response-info';
import { zMemberGiven } from '#common/zod/to-backend/members/to-backend-get-member-givens';
import { zToBackendRequest } from '#common/zod/to-backend/to-backend-request';
import { zToBackendRequestInfo } from '#common/zod/to-backend/to-backend-request-info';

export let zToBackendGetUserGivensRequestPayload = z
  .object({
    projectId: z.string()
  })
  .meta({ id: 'ToBackendGetUserGivensRequestPayload' });

export let zToBackendGetUserGivensRequestInfo = zToBackendRequestInfo
  .extend({
    name: z.literal(ToBackendRequestInfoNameEnum.ToBackendGetUserGivens)
  })
  .meta({ id: 'ToBackendGetUserGivensRequestInfo' });

export let zToBackendGetUserGivensRequest = zToBackendRequest
  .extend({
    info: zToBackendGetUserGivensRequestInfo,
    payload: zToBackendGetUserGivensRequestPayload
  })
  .meta({ id: 'ToBackendGetUserGivensRequest' });

export let zToBackendGetUserGivensResponsePayload = z
  .object({
    user: zUser,
    memberGivens: z.array(zMemberGiven)
  })
  .meta({ id: 'ToBackendGetUserGivensResponsePayload' });

export let zToBackendGetUserGivensResponseInfo = zResponseInfo
  .extend({
    path: z.literal(`/${ToBackendRequestInfoNameEnum.ToBackendGetUserGivens}`),
    method: z.literal('POST')
  })
  .meta({ id: 'ToBackendGetUserGivensResponseInfo' });

export let zToBackendGetUserGivensResponse = zMyResponse
  .extend({
    info: zToBackendGetUserGivensResponseInfo,
    payload: zToBackendGetUserGivensResponsePayload
  })
  .meta({ id: 'ToBackendGetUserGivensResponse' });

export type ToBackendGetUserGivensRequestPayload = z.infer<
  typeof zToBackendGetUserGivensRequestPayload
>;
export type ToBackendGetUserGivensRequest = z.infer<
  typeof zToBackendGetUserGivensRequest
>;
export type ToBackendGetUserGivensResponsePayload = z.infer<
  typeof zToBackendGetUserGivensResponsePayload
>;
export type ToBackendGetUserGivensResponse = z.infer<
  typeof zToBackendGetUserGivensResponse
>;
