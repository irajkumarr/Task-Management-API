import {
  BadRequestException,
  Body,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import bcrypt from 'bcryptjs';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.findByEmail(createUserDto.email);
    if (user) {
      throw new ConflictException('User already exists');
    }

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password!, salt);
    createUserDto.password = hashedPassword;

    // verification token
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log(
      `Verification token for ${createUserDto.email}: ${verificationToken}`,
    );
    return await this.usersService.create({
      ...createUserDto,
      verificationToken,
      verificationTokenExpiry,
    });
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, token } = verifyEmailDto;
    const isVerified = await this.usersService.verifyEmail(email, token);

    if (!isVerified) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    return {
      message: 'Email successfully verified',
    };
  }
}
