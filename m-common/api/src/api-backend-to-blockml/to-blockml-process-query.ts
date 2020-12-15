import { Type } from 'class-transformer';
import { IsEnum, IsString, ValidateNested } from 'class-validator';
import * as apiObjects from '../objects/_index';
import * as apiEnums from '../enums/_index';

export class ToBlockmlProcessQueryRequestPayload {
  @IsString()
  readonly structId: string;

  @IsEnum(apiEnums.ProjectWeekStartEnum)
  readonly weekStart: apiEnums.ProjectWeekStartEnum;

  @ValidateNested()
  @Type(() => apiObjects.UdfsDict)
  readonly udfsDict: apiObjects.UdfsDict;

  @ValidateNested()
  @Type(() => apiObjects.Mconfig)
  readonly mconfig: apiObjects.Mconfig;

  readonly modelContent: any;
}

export class ToBlockmlProcessQueryRequest {
  @ValidateNested()
  @Type(() => apiObjects.ToBlockmlRequestInfo)
  readonly info: apiObjects.ToBlockmlRequestInfo;

  @ValidateNested()
  @Type(() => ToBlockmlProcessQueryRequestPayload)
  readonly payload: ToBlockmlProcessQueryRequestPayload;
}

export class ToBlockmlProcessQueryResponsePayload {
  @ValidateNested()
  @Type(() => apiObjects.Query)
  readonly query: apiObjects.Query;

  @ValidateNested()
  @Type(() => apiObjects.Mconfig)
  readonly mconfig: apiObjects.Mconfig;
}

export class ToBlockmlProcessQueryResponse {
  @ValidateNested()
  @Type(() => apiObjects.ResponseInfo)
  readonly info: apiObjects.ResponseInfo;

  @ValidateNested()
  @Type(() => ToBlockmlProcessQueryResponsePayload)
  readonly payload: ToBlockmlProcessQueryResponsePayload;
}
