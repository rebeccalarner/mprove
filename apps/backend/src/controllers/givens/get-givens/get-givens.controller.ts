import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ToBackendGetGivensRequestDto,
  ToBackendGetGivensResponseDto
} from '#backend/controllers/givens/get-givens/get-givens.dto';
import { AttachUser } from '#backend/decorators/attach-user.decorator';
import type { UserTab } from '#backend/drizzle/postgres/schema/_tabs';
import { ThrottlerUserIdGuard } from '#backend/guards/throttler-user-id.guard';
import { GivensService } from '#backend/services/db/givens.service';
import { MembersService } from '#backend/services/db/members.service';
import { ProjectsService } from '#backend/services/db/projects.service';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import type { ToBackendGetGivensResponsePayload } from '#common/zod/to-backend/givens/to-backend-get-givens';

@ApiTags('Givens')
@UseGuards(ThrottlerUserIdGuard)
@Controller()
export class GetGivensController {
  constructor(
    private projectsService: ProjectsService,
    private membersService: MembersService,
    private givensService: GivensService
  ) {}

  @Post(ToBackendRequestInfoNameEnum.ToBackendGetGivens)
  @ApiOperation({
    summary: 'GetGivens',
    description: 'Get project givens'
  })
  @ApiOkResponse({
    type: ToBackendGetGivensResponseDto
  })
  async getGivens(
    @AttachUser() user: UserTab,
    @Body() body: ToBackendGetGivensRequestDto
  ) {
    let { projectId } = body.payload;

    await this.projectsService.getProjectCheckExists({
      projectId: projectId
    });

    let userMember = await this.membersService.getMemberCheckIsAdmin({
      projectId: projectId,
      memberId: user.userId
    });

    let apiGivens = await this.givensService.getApiGivens({
      projectId: projectId
    });

    let payload: ToBackendGetGivensResponsePayload = {
      userMember: this.membersService.tabToApi({ member: userMember }),
      givens: apiGivens
    };

    return payload;
  }
}
