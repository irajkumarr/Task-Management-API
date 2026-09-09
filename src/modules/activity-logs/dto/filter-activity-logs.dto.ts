import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ActivityAction,
  ActivityEntityType,
} from '../entities/activity-log.entity';

export class FilterActivityLogsDto {
  @ApiPropertyOptional({ enum: ActivityAction })
  @IsEnum(ActivityAction)
  @IsOptional()
  action?: ActivityAction;

  @ApiPropertyOptional({ enum: ActivityEntityType })
  @IsEnum(ActivityEntityType)
  @IsOptional()
  entityType?: ActivityEntityType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 20;
}
