import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskCommentDto {
  @ApiProperty({
    example: 'Please check the latest updates on this task.',
    description: 'The comment text content',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
