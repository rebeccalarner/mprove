import { z } from 'zod';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { zGiven } from '#common/zod/backend/given';
import { zMember } from '#common/zod/backend/member';
import { zMyResponse } from '#common/zod/to/my-response';
import { zResponseInfo } from '#common/zod/to/response-info';
import { zToBackendRequest } from '#common/zod/to-backend/to-backend-request';
import { zToBackendRequestInfo } from '#common/zod/to-backend/to-backend-request-info';

export let zToBackendDeleteGivenRequestPayload = z
  .object({
    projectId: z.string(),
    givenId: z.string()
  })
  .meta({ id: 'ToBackendDeleteGivenRequestPayload' });

export let zToBackendDeleteGivenRequestInfo = zToBackendRequestInfo
  .extend({
    name: z.literal(ToBackendRequestInfoNameEnum.ToBackendDeleteGiven)
  })
  .meta({ id: 'ToBackendDeleteGivenRequestInfo' });

export let zToBackendDeleteGivenRequest = zToBackendRequest
  .extend({
    info: zToBackendDeleteGivenRequestInfo,
    payload: zToBackendDeleteGivenRequestPayload
  })
  .meta({ id: 'ToBackendDeleteGivenRequest' });

export let zToBackendDeleteGivenResponsePayload = z
  .object({
    userMember: zMember,
    givens: z.array(zGiven)
  })
  .meta({ id: 'ToBackendDeleteGivenResponsePayload' });

export let zToBackendDeleteGivenResponseInfo = zResponseInfo
  .extend({
    path: z.literal(`/${ToBackendRequestInfoNameEnum.ToBackendDeleteGiven}`),
    method: z.literal('POST')
  })
  .meta({ id: 'ToBackendDeleteGivenResponseInfo' });

export let zToBackendDeleteGivenResponse = zMyResponse
  .extend({
    info: zToBackendDeleteGivenResponseInfo,
    payload: zToBackendDeleteGivenResponsePayload
  })
  .meta({ id: 'ToBackendDeleteGivenResponse' });

export type ToBackendDeleteGivenRequestPayload = z.infer<
  typeof zToBackendDeleteGivenRequestPayload
>;
export type ToBackendDeleteGivenRequest = z.infer<
  typeof zToBackendDeleteGivenRequest
>;
export type ToBackendDeleteGivenResponsePayload = z.infer<
  typeof zToBackendDeleteGivenResponsePayload
>;
export type ToBackendDeleteGivenResponse = z.infer<
  typeof zToBackendDeleteGivenResponse
>;
