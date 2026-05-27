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
import { LoginDto } from './dto/login.dto';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

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

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );
    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password!,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }
    if (!user.isActive) {
      throw new BadRequestException('User is not active');
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException('User is not verified');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      payload,
    );

    const { password, ...result } = user;

    return {
      accessToken,
      refreshToken,
      user: result,
    };
  }

  async generateTokens(id: string, payload: object) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.usersService.update(id, {
      hashedRefreshToken: refreshTokenHash,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  
}
