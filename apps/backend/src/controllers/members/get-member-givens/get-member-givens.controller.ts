import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ToBackendGetMemberGivensRequestDto,
  ToBackendGetMemberGivensResponseDto
} from '#backend/controllers/members/get-member-givens/get-member-givens.dto';
import { AttachUser } from '#backend/decorators/attach-user.decorator';
import type { UserTab } from '#backend/drizzle/postgres/schema/_tabs';
import { ThrottlerUserIdGuard } from '#backend/guards/throttler-user-id.guard';
import { GivensService } from '#backend/services/db/givens.service';
import { MembersService } from '#backend/services/db/members.service';
import { ProjectsService } from '#backend/services/db/projects.service';
import { RolesService } from '#backend/services/db/roles.service';
import type { GivenTypeEnum } from '#common/enums/given-type.enum';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import type {
  MemberGiven,
  MemberGivenValue,
  ToBackendGetMemberGivensResponsePayload
} from '#common/zod/to-backend/members/to-backend-get-member-givens';

@ApiTags('Members')
@UseGuards(ThrottlerUserIdGuard)
@Controller()
export class GetMemberGivensController {
  constructor(
    private projectsService: ProjectsService,
    private membersService: MembersService,
    private rolesService: RolesService,
    private givensService: GivensService
  ) {}

  @Post(ToBackendRequestInfoNameEnum.ToBackendGetMemberGivens)
  @ApiOperation({
    summary: 'GetMemberGivens',
    description: 'Get effective given values available to a project member'
  })
  @ApiOkResponse({
    type: ToBackendGetMemberGivensResponseDto
  })
  async getMemberGivens(
    @AttachUser() user: UserTab,
    @Body() body: ToBackendGetMemberGivensRequestDto
  ) {
    let { projectId, memberId } = body.payload;

    await this.projectsService.getProjectCheckExists({
      projectId: projectId
    });

    let userMember = await this.membersService.getMemberCheckExists({
      memberId: user.userId,
      projectId: projectId
    });

    let member = await this.membersService.getMemberCheckExists({
      memberId: memberId,
      projectId: projectId
    });

    let apiGivens = await this.givensService.getApiGivens({
      projectId: projectId
    });

    let apiRoles = await this.rolesService.getApiRoles({
      projectId: projectId
    });

    let memberRoles = apiRoles.filter(
      role => member.roles.indexOf(role.roleId) > -1
    );

    let valueSourcesByGivenId: Record<
      string,
      Record<string, { isProjectDefault: boolean; roleIds: string[] }>
    > = {};
    let typeByGivenId: Record<string, GivenTypeEnum> = {};

    apiGivens.forEach(given => {
      valueSourcesByGivenId[given.givenId] = {};
      typeByGivenId[given.givenId] = given.type;

      given.values.forEach(value => {
        valueSourcesByGivenId[given.givenId][value] = {
          isProjectDefault: true,
          roleIds: []
        };
      });
    });

    memberRoles.forEach(role => {
      role.gvs.forEach(gv => {
        let isGivenMissing = !valueSourcesByGivenId[gv.givenId];
        if (isGivenMissing) {
          valueSourcesByGivenId[gv.givenId] = {};
        }

        gv.values.forEach(value => {
          let isValueMissing = !valueSourcesByGivenId[gv.givenId][value];
          if (isValueMissing) {
            valueSourcesByGivenId[gv.givenId][value] = {
              isProjectDefault: false,
              roleIds: []
            };
          }

          valueSourcesByGivenId[gv.givenId][value].roleIds.push(role.roleId);
        });
      });
    });

    let memberGivens: MemberGiven[] = Object.keys(valueSourcesByGivenId)
      .sort((a, b) => (a > b ? 1 : b > a ? -1 : 0))
      .map(givenId => {
        let valueSources = valueSourcesByGivenId[givenId];

        let memberGivenValues: MemberGivenValue[] = Object.keys(valueSources)
          .sort((a, b) => (a > b ? 1 : b > a ? -1 : 0))
          .map(value => ({
            value: value,
            isProjectDefault: valueSources[value].isProjectDefault,
            roleIds: valueSources[value].roleIds
          }));

        let memberGiven: MemberGiven = {
          givenId: givenId,
          type: typeByGivenId[givenId],
          memberGivenValues: memberGivenValues
        };

        return memberGiven;
      });

    let payload: ToBackendGetMemberGivensResponsePayload = {
      memberGivens: memberGivens
    };

    return payload;
  }
}
