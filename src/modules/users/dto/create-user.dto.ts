import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  password!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  verificationToken?: string;

  @IsOptional()
  verificationTokenExpiry?: Date;
}
