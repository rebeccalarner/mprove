import { z } from 'zod';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { zGiven } from '#common/zod/backend/given';
import { zMember } from '#common/zod/backend/member';
import { zMyResponse } from '#common/zod/to/my-response';
import { zResponseInfo } from '#common/zod/to/response-info';
import { zToBackendRequest } from '#common/zod/to-backend/to-backend-request';
import { zToBackendRequestInfo } from '#common/zod/to-backend/to-backend-request-info';

export let zToBackendGetGivensRequestPayload = z
  .object({
    projectId: z.string()
  })
  .meta({ id: 'ToBackendGetGivensRequestPayload' });

export let zToBackendGetGivensRequestInfo = zToBackendRequestInfo
  .extend({
    name: z.literal(ToBackendRequestInfoNameEnum.ToBackendGetGivens)
  })
  .meta({ id: 'ToBackendGetGivensRequestInfo' });

export let zToBackendGetGivensRequest = zToBackendRequest
  .extend({
    info: zToBackendGetGivensRequestInfo,
    payload: zToBackendGetGivensRequestPayload
  })
  .meta({ id: 'ToBackendGetGivensRequest' });

export let zToBackendGetGivensResponsePayload = z
  .object({
    userMember: zMember,
    givens: z.array(zGiven)
  })
  .meta({ id: 'ToBackendGetGivensResponsePayload' });

export let zToBackendGetGivensResponseInfo = zResponseInfo
  .extend({
    path: z.literal(`/${ToBackendRequestInfoNameEnum.ToBackendGetGivens}`),
    method: z.literal('POST')
  })
  .meta({ id: 'ToBackendGetGivensResponseInfo' });

export let zToBackendGetGivensResponse = zMyResponse
  .extend({
    info: zToBackendGetGivensResponseInfo,
    payload: zToBackendGetGivensResponsePayload
  })
  .meta({ id: 'ToBackendGetGivensResponse' });

export type ToBackendGetGivensRequestPayload = z.infer<
  typeof zToBackendGetGivensRequestPayload
>;
export type ToBackendGetGivensRequest = z.infer<
  typeof zToBackendGetGivensRequest
>;
export type ToBackendGetGivensResponsePayload = z.infer<
  typeof zToBackendGetGivensResponsePayload
>;
export type ToBackendGetGivensResponse = z.infer<
  typeof zToBackendGetGivensResponse
>;
