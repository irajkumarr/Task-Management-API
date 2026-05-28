import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkspaceMembersService } from './workspace-members.service';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';

@Controller('workspace-members')
export class WorkspaceMembersController {
  constructor(private readonly workspaceMembersService: WorkspaceMembersService) {}

  @Post()
  create(@Body() createWorkspaceMemberDto: CreateWorkspaceMemberDto) {
    return this.workspaceMembersService.create(createWorkspaceMemberDto);
  }

  @Get()
  findAll() {
    return this.workspaceMembersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspaceMembersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkspaceMemberDto: UpdateWorkspaceMemberDto) {
    return this.workspaceMembersService.update(+id, updateWorkspaceMemberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workspaceMembersService.remove(+id);
  }
}
