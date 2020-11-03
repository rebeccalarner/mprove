import { Body, Controller, Get, Post } from '@nestjs/common';
import { makeRoutingKeyToDisk } from '../../../helper/make-routing-key-to-disk';
import { RabbitService } from '../../../services/rabbit.service';
import { api } from '../../../barrels/api';

@Controller()
export class ToDiskDeleteDevRepoController {
  constructor(private readonly rabbitService: RabbitService) {}

  @Post('toDiskDeleteDevRepo')
  async toDiskDeleteDevRepo(
    @Body() body: api.ToDiskDeleteDevRepoRequest
  ): Promise<any> {
    try {
      let { organizationId, projectId } = body.payload;

      let routingKey = makeRoutingKeyToDisk({
        organizationId: organizationId,
        projectId: projectId
      });

      let message = body;

      let response = await this.rabbitService.sendToDisk({
        routingKey: routingKey,
        message: message
      });

      return (response as unknown) as api.ToDiskDeleteDevRepoResponse;
    } catch (e) {
      return api.makeErrorResponse({ request: body, e: e });
    }
  }
}
