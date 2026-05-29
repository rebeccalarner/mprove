import {
  Body,
  Controller,
  Inject,
  Logger,
  Post,
  UseGuards
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import retry from 'async-retry';
import { and, eq } from 'drizzle-orm';
import { BackendConfig } from '#backend/config/backend-config';
import {
  ToBackendDeleteRoleRequestDto,
  ToBackendDeleteRoleResponseDto
} from '#backend/controllers/roles/delete-role/delete-role.dto';
import { AttachUser } from '#backend/decorators/attach-user.decorator';
import type { Db } from '#backend/drizzle/drizzle.module';
import { DRIZZLE } from '#backend/drizzle/drizzle.module';
import type { UserTab } from '#backend/drizzle/postgres/schema/_tabs';
import { rolesTable } from '#backend/drizzle/postgres/schema/roles';
import { getRetryOption } from '#backend/functions/get-retry-option';
import { ThrottlerUserIdGuard } from '#backend/guards/throttler-user-id.guard';
import { MembersService } from '#backend/services/db/members.service';
import { ProjectsService } from '#backend/services/db/projects.service';
import { RolesService } from '#backend/services/db/roles.service';
import { THROTTLE_CUSTOM } from '#common/constants/top-backend';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import type { ToBackendDeleteRoleResponsePayload } from '#common/zod/to-backend/roles/to-backend-delete-role';

@ApiTags('Roles')
@UseGuards(ThrottlerUserIdGuard)
@Throttle(THROTTLE_CUSTOM)
@Controller()
export class DeleteRoleController {
  constructor(
    private projectsService: ProjectsService,
    private membersService: MembersService,
    private rolesService: RolesService,
    private cs: ConfigService<BackendConfig>,
    private logger: Logger,
    @Inject(DRIZZLE) private db: Db
  ) {}

  @Post(ToBackendRequestInfoNameEnum.ToBackendDeleteRole)
  @ApiOperation({
    summary: 'DeleteRole',
    description: 'Delete a project role'
  })
  @ApiOkResponse({
    type: ToBackendDeleteRoleResponseDto
  })
  async deleteRole(
    @AttachUser() user: UserTab,
    @Body() body: ToBackendDeleteRoleRequestDto
  ) {
    let { projectId, roleId } = body.payload;

    await this.projectsService.getProjectCheckExists({
      projectId: projectId
    });

    let userMember = await this.membersService.getMemberCheckIsAdmin({
      memberId: user.userId,
      projectId: projectId
    });

    await retry(
      async () =>
        await this.db.drizzle.transaction(async tx => {
          await tx
            .delete(rolesTable)
            .where(
              and(
                eq(rolesTable.projectId, projectId),
                eq(rolesTable.roleId, roleId)
              )
            );
        }),
      getRetryOption(this.cs, this.logger)
    );

    let apiRoles = await this.rolesService.getApiRoles({
      projectId: projectId
    });

    let payload: ToBackendDeleteRoleResponsePayload = {
      userMember: this.membersService.tabToApi({ member: userMember }),
      roles: apiRoles
    };

    return payload;
  }
}
