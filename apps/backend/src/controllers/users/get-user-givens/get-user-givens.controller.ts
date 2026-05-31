import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  ToBackendGetUserGivensRequestDto,
  ToBackendGetUserGivensResponseDto
} from '#backend/controllers/users/get-user-givens/get-user-givens.dto';
import { AttachUser } from '#backend/decorators/attach-user.decorator';
import type { UserTab } from '#backend/drizzle/postgres/schema/_tabs';
import { ThrottlerUserIdGuard } from '#backend/guards/throttler-user-id.guard';
import { GivensService } from '#backend/services/db/givens.service';
import { MembersService } from '#backend/services/db/members.service';
import { UsersService } from '#backend/services/db/users.service';
import { THROTTLE_CUSTOM } from '#common/constants/top-backend';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import type { ToBackendGetUserGivensResponsePayload } from '#common/zod/to-backend/users/to-backend-get-user-givens';

@ApiTags('Users')
@UseGuards(ThrottlerUserIdGuard)
@Throttle(THROTTLE_CUSTOM)
@Controller()
export class GetUserGivensController {
  constructor(
    private givensService: GivensService,
    private membersService: MembersService,
    private usersService: UsersService
  ) {}

  @Post(ToBackendRequestInfoNameEnum.ToBackendGetUserGivens)
  @ApiOperation({
    summary: 'GetUserGivens',
    description:
      "Get the current user's normalized selected givens and effective member givens"
  })
  @ApiOkResponse({
    type: ToBackendGetUserGivensResponseDto
  })
  async getUserGivens(
    @AttachUser() user: UserTab,
    @Body() body: ToBackendGetUserGivensRequestDto
  ) {
    let { projectId } = body.payload;

    let member = await this.membersService.getMemberCheckExists({
      memberId: user.userId,
      projectId: projectId
    });

    await this.usersService.selectUnselectedGivens({
      user: user,
      projectId: projectId
    });

    let memberGivens = await this.givensService.getMemberGivensForSelection({
      projectId: projectId,
      roles: member.roles
    });

    let payload: ToBackendGetUserGivensResponsePayload = {
      user: this.usersService.tabToApi({ user: user }),
      memberGivens: memberGivens
    };

    return payload;
  }
}
