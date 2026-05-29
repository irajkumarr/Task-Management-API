import { IsEnum } from 'class-validator';
import { WorkspaceRole } from '../entities/workspace-member.entity';

export class UpdateMemberRoleDto {
  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole;
}
