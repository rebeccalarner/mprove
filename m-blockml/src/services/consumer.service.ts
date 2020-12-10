import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { api } from '../barrels/api';
import { StructService } from './struct.service';

@Injectable()
export class ConsumerService {
  constructor(private readonly structService: StructService) {}

  @RabbitRPC({
    exchange: api.RabbitExchangesEnum.MBlockml.toString(),
    routingKey: api.RabbitBlockmlRoutingEnum.ProcessDashboard.toString(),
    queue: api.RabbitBlockmlRoutingEnum.ProcessDashboard.toString()
  })
  async processDashboard(
    request: api.ToBlockmlProcessDashboardRequest,
    context: any
  ) {
    try {
      if (
        request.info?.name !==
        api.ToBlockmlRequestInfoNameEnum.ToBlockmlProcessDashboard
      ) {
        throw new api.ServerError({
          message: api.ErEnum.M_BLOCKML_WRONG_REQUEST_INFO_NAME
        });
      }

      let requestValid = await api.transformValid({
        classType: api.ToBlockmlProcessDashboardRequest,
        object: request,
        errorMessage: api.ErEnum.M_BLOCKML_WRONG_REQUEST_PARAMS
      });

      let response = requestValid.payload.structId;

      return response;
    } catch (e) {
      return api.makeErrorResponse({ request: request, e: e });
    }
  }

  @RabbitRPC({
    exchange: api.RabbitExchangesEnum.MBlockml.toString(),
    routingKey: api.RabbitBlockmlRoutingEnum.ProcessQuery.toString(),
    queue: api.RabbitBlockmlRoutingEnum.ProcessQuery.toString()
  })
  async processQuery(request: api.ToBlockmlProcessQueryRequest, context: any) {
    try {
      if (
        request.info?.name !==
        api.ToBlockmlRequestInfoNameEnum.ToBlockmlProcessQuery
      ) {
        throw new api.ServerError({
          message: api.ErEnum.M_BLOCKML_WRONG_REQUEST_INFO_NAME
        });
      }

      let requestValid = await api.transformValid({
        classType: api.ToBlockmlProcessQueryRequest,
        object: request,
        errorMessage: api.ErEnum.M_BLOCKML_WRONG_REQUEST_PARAMS
      });

      let response = requestValid.payload.structId;

      return response;
    } catch (e) {
      return api.makeErrorResponse({ request: request, e: e });
    }
  }

  @RabbitRPC({
    exchange: api.RabbitExchangesEnum.MBlockml.toString(),
    routingKey: api.RabbitBlockmlRoutingEnum.RebuildStruct.toString(),
    queue: api.RabbitBlockmlRoutingEnum.RebuildStruct.toString()
  })
  async rebuildStruct(
    request: api.ToBlockmlRebuildStructRequest,
    context: any
  ) {
    try {
      if (
        request.info?.name !==
        api.ToBlockmlRequestInfoNameEnum.ToBlockmlRebuildStruct
      ) {
        throw new api.ServerError({
          message: api.ErEnum.M_BLOCKML_WRONG_REQUEST_INFO_NAME
        });
      }

      let requestValid = await api.transformValid({
        classType: api.ToBlockmlRebuildStructRequest,
        object: request,
        errorMessage: api.ErEnum.M_BLOCKML_WRONG_REQUEST_PARAMS
      });

      let { traceId } = requestValid.info;
      let {
        structId,
        projectId,
        repoId,
        weekStart,
        files,
        connections
      } = requestValid.payload;

      let payload = await this.structService.wrapStruct({
        structId: structId,
        projectId: projectId,
        repoId: repoId,
        weekStart: weekStart,
        files: files,
        connections: connections
      });

      let response: api.ToBlockmlRebuildStructResponse = {
        info: {
          status: api.ResponseInfoStatusEnum.Ok,
          traceId: traceId
        },
        payload: payload
      };

      return response;
    } catch (e) {
      return api.makeErrorResponse({ request: request, e: e });
    }
  }
}
