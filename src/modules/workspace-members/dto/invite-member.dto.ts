import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { WorkspaceRole } from 'src/modules/workspace-members/entities/workspace-member.entity';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole = WorkspaceRole.MEMBER;
}
