import {
  IsEnum,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { WorkspaceRole } from '../entities/workspace-member.entity';


export class CreateWorkspaceMemberDto {
  @IsUUID()
  @IsNotEmpty()
  workspaceId!: string;

  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole;
}