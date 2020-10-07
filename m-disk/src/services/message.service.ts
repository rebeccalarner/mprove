import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { delay } from '../helper/delay';
import { ConsumerService } from './consumer.service';

@Injectable()
export class MessageService {
  constructor(private readonly consumerService: ConsumerService) {}

  @RabbitRPC({
    exchange: 'm-disk',
    routingKey: 'organizations_abcdefghijklmnopqrstuvwxyz_projects_',
    queue: 'organizations_abcdefghijklmnopqrstuvwxyz_projects_'
  })
  public async consumer1(payload: any, context: any) {
    await delay(0);
    return this.consumerService.do();
  }

  @RabbitRPC({
    exchange: 'm-disk',
    routingKey:
      'organizations_abcdefghijklmnopqrstuvwxyz_projects_abcdefghijklm',
    queue: 'organizations_abcdefghijklmnopqrstuvwxyz_projects_abcdefghijklm'
  })
  public async consumer2(payload: any, context: any) {
    await delay(1000);
    return this.consumerService.do();
  }

  @RabbitRPC({
    exchange: 'm-disk',
    routingKey:
      'organizations_abcdefghijklmnopqrstuvwxyz_projects_nopqrstuvwxyz',
    queue: 'organizations_abcdefghijklmnopqrstuvwxyz_projects_nopqrstuvwxyz'
  })
  public async consumer3(payload: any, context: any) {
    await delay(2000);
    return this.consumerService.do();
  }
}