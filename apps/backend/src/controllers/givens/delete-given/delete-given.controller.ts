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
  ToBackendDeleteGivenRequestDto,
  ToBackendDeleteGivenResponseDto
} from '#backend/controllers/givens/delete-given/delete-given.dto';
import { AttachUser } from '#backend/decorators/attach-user.decorator';
import type { Db } from '#backend/drizzle/drizzle.module';
import { DRIZZLE } from '#backend/drizzle/drizzle.module';
import type { UserTab } from '#backend/drizzle/postgres/schema/_tabs';
import { givensTable } from '#backend/drizzle/postgres/schema/givens';
import { getRetryOption } from '#backend/functions/get-retry-option';
import { ThrottlerUserIdGuard } from '#backend/guards/throttler-user-id.guard';
import { GivensService } from '#backend/services/db/givens.service';
import { MembersService } from '#backend/services/db/members.service';
import { ProjectsService } from '#backend/services/db/projects.service';
import { THROTTLE_CUSTOM } from '#common/constants/top-backend';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import type { ToBackendDeleteGivenResponsePayload } from '#common/zod/to-backend/givens/to-backend-delete-given';

@ApiTags('Givens')
@UseGuards(ThrottlerUserIdGuard)
@Throttle(THROTTLE_CUSTOM)
@Controller()
export class DeleteGivenController {
  constructor(
    private projectsService: ProjectsService,
    private membersService: MembersService,
    private givensService: GivensService,
    private cs: ConfigService<BackendConfig>,
    private logger: Logger,
    @Inject(DRIZZLE) private db: Db
  ) {}

  @Post(ToBackendRequestInfoNameEnum.ToBackendDeleteGiven)
  @ApiOperation({
    summary: 'DeleteGiven',
    description: 'Delete a project given'
  })
  @ApiOkResponse({
    type: ToBackendDeleteGivenResponseDto
  })
  async deleteGiven(
    @AttachUser() user: UserTab,
    @Body() body: ToBackendDeleteGivenRequestDto
  ) {
    let { projectId, givenId } = body.payload;

    await this.projectsService.getProjectCheckExists({
      projectId: projectId
    });

    let userMember = await this.membersService.getMemberCheckIsAdmin({
      memberId: user.userId,
      projectId: projectId
    });

    await this.givensService.getGivenCheckExists({
      projectId: projectId,
      givenId: givenId
    });

    await retry(
      async () =>
        await this.db.drizzle.transaction(async tx => {
          await tx
            .delete(givensTable)
            .where(
              and(
                eq(givensTable.projectId, projectId),
                eq(givensTable.givenId, givenId)
              )
            );
        }),
      getRetryOption(this.cs, this.logger)
    );

    let apiGivens = await this.givensService.getApiGivens({
      projectId: projectId
    });

    let payload: ToBackendDeleteGivenResponsePayload = {
      userMember: this.membersService.tabToApi({ member: userMember }),
      givens: apiGivens
    };

    return payload;
  }
}
