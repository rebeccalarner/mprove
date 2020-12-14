import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';
import { Report } from './report';

export class Viz {
  @IsString()
  organizationId: string;

  @IsString()
  projectId: string;

  @IsString()
  repoId: string;

  @IsString()
  structId: string;

  @IsString()
  vizId: string;

  @IsString({ each: true })
  accessUsers: string[];

  @IsOptional()
  @IsString()
  gr?: string;

  @IsBoolean()
  hidden: boolean;

  @ValidateNested()
  @Type(() => Report)
  reports: Report[];

  @IsBoolean()
  temp: boolean;

  @IsInt()
  serverTs: number;
}
