import { z } from 'zod';
import { GivenTypeEnum } from '#common/enums/given-type.enum';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { zMyResponse } from '#common/zod/to/my-response';
import { zResponseInfo } from '#common/zod/to/response-info';
import { zToBackendRequest } from '#common/zod/to-backend/to-backend-request';
import { zToBackendRequestInfo } from '#common/zod/to-backend/to-backend-request-info';

export let zMemberGivenValue = z
  .object({
    value: z.string(),
    isProjectDefault: z.boolean(),
    roleIds: z.array(z.string())
  })
  .meta({ id: 'MemberGivenValue' });

export let zMemberGiven = z
  .object({
    givenId: z.string(),
    type: z.enum(GivenTypeEnum),
    isMultiple: z.boolean(),
    memberGivenValues: z.array(zMemberGivenValue)
  })
  .meta({ id: 'MemberGiven' });

export let zToBackendGetMemberGivensRequestPayload = z
  .object({
    projectId: z.string(),
    memberId: z.string()
  })
  .meta({ id: 'ToBackendGetMemberGivensRequestPayload' });

export let zToBackendGetMemberGivensRequestInfo = zToBackendRequestInfo
  .extend({
    name: z.literal(ToBackendRequestInfoNameEnum.ToBackendGetMemberGivens)
  })
  .meta({ id: 'ToBackendGetMemberGivensRequestInfo' });

export let zToBackendGetMemberGivensRequest = zToBackendRequest
  .extend({
    info: zToBackendGetMemberGivensRequestInfo,
    payload: zToBackendGetMemberGivensRequestPayload
  })
  .meta({ id: 'ToBackendGetMemberGivensRequest' });

export let zToBackendGetMemberGivensResponsePayload = z
  .object({
    memberGivens: z.array(zMemberGiven)
  })
  .meta({ id: 'ToBackendGetMemberGivensResponsePayload' });

export let zToBackendGetMemberGivensResponseInfo = zResponseInfo
  .extend({
    path: z.literal(
      `/${ToBackendRequestInfoNameEnum.ToBackendGetMemberGivens}`
    ),
    method: z.literal('POST')
  })
  .meta({ id: 'ToBackendGetMemberGivensResponseInfo' });

export let zToBackendGetMemberGivensResponse = zMyResponse
  .extend({
    info: zToBackendGetMemberGivensResponseInfo,
    payload: zToBackendGetMemberGivensResponsePayload
  })
  .meta({ id: 'ToBackendGetMemberGivensResponse' });

export type MemberGivenValue = z.infer<typeof zMemberGivenValue>;
export type MemberGiven = z.infer<typeof zMemberGiven>;
export type ToBackendGetMemberGivensRequestPayload = z.infer<
  typeof zToBackendGetMemberGivensRequestPayload
>;
export type ToBackendGetMemberGivensRequest = z.infer<
  typeof zToBackendGetMemberGivensRequest
>;
export type ToBackendGetMemberGivensResponsePayload = z.infer<
  typeof zToBackendGetMemberGivensResponsePayload
>;
export type ToBackendGetMemberGivensResponse = z.infer<
  typeof zToBackendGetMemberGivensResponse
>;
