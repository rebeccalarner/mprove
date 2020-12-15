import { Type } from 'class-transformer';
import { IsEnum, IsString, ValidateNested } from 'class-validator';
import * as apiObjects from '../objects/_index';
import * as apiEnums from '../enums/_index';

export class SpecialRebuildStructRequestPayload {
  @IsString()
  readonly organizationId: string;

  @IsString()
  readonly projectId: string;

  @IsString()
  readonly repoId: string;

  @IsString()
  readonly branch: string;

  @IsString()
  readonly structId: string;

  @IsEnum(apiEnums.ProjectWeekStartEnum)
  readonly weekStart: apiEnums.ProjectWeekStartEnum;

  // @ValidateNested()
  // @Type(() => apiObjects.File)
  // readonly files: apiObjects.File[];

  @ValidateNested()
  @Type(() => apiObjects.ProjectConnection)
  readonly connections: apiObjects.ProjectConnection[];
}

export class SpecialRebuildStructRequest {
  @ValidateNested()
  @Type(() => apiObjects.SpecialRequestInfo)
  readonly info: apiObjects.SpecialRequestInfo;

  @ValidateNested()
  @Type(() => SpecialRebuildStructRequestPayload)
  readonly payload: SpecialRebuildStructRequestPayload;
}
