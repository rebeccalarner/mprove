import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ToBackendGetRolesRequestDto,
  ToBackendGetRolesResponseDto
} from '#backend/controllers/roles/get-roles/get-roles.dto';
import { AttachUser } from '#backend/decorators/attach-user.decorator';
import type { UserTab } from '#backend/drizzle/postgres/schema/_tabs';
import { ThrottlerUserIdGuard } from '#backend/guards/throttler-user-id.guard';
import { MembersService } from '#backend/services/db/members.service';
import { ProjectsService } from '#backend/services/db/projects.service';
import { RolesService } from '#backend/services/db/roles.service';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import type { ToBackendGetRolesResponsePayload } from '#common/zod/to-backend/roles/to-backend-get-roles';

@ApiTags('Roles')
@UseGuards(ThrottlerUserIdGuard)
@Controller()
export class GetRolesController {
  constructor(
    private projectsService: ProjectsService,
    private membersService: MembersService,
    private rolesService: RolesService
  ) {}

  @Post(ToBackendRequestInfoNameEnum.ToBackendGetRoles)
  @ApiOperation({
    summary: 'GetRoles',
    description: 'Get project roles'
  })
  @ApiOkResponse({
    type: ToBackendGetRolesResponseDto
  })
  async getRoles(
    @AttachUser() user: UserTab,
    @Body() body: ToBackendGetRolesRequestDto
  ) {
    let { projectId } = body.payload;

    await this.projectsService.getProjectCheckExists({
      projectId: projectId
    });

    let userMember = await this.membersService.getMemberCheckExists({
      projectId: projectId,
      memberId: user.userId
    });

    let apiRoles = await this.rolesService.getApiRoles({
      projectId: projectId
    });

    let payload: ToBackendGetRolesResponsePayload = {
      userMember: this.membersService.tabToApi({ member: userMember }),
      roles: apiRoles
    };

    return payload;
  }
}
