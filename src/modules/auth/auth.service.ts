import {
  BadRequestException,
  Body,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, User } from '../users/entities/user.entity';
import { OAuth2Client } from 'google-auth-library';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

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

    const { accessToken, refreshToken, refreshUser } =
      await this.generateTokens(user);

    // const { password, ...result } = refreshUser;

    return {
      accessToken,
      refreshToken,
      user: {
        id: refreshUser.id,
        fullName: refreshUser.fullName,
        email: refreshUser.email,
        phone: refreshUser.phone,
        provider: refreshUser.provider,
        role: refreshUser.role,
        isActive: refreshUser.isActive,
        isEmailVerified: refreshUser.isEmailVerified,
        lastLoginAt: refreshUser.lastLoginAt,
      },
    };
  }

  async googleLogin(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: undefined,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedException('Invalid Google token payload');
    }
    const { email, email_verified, name } = payload;

    if (!email || !email_verified) {
      throw new UnauthorizedException('Google account not verified');
    }
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.createGoogleUser({
        fullName: name || 'Google User',
        email,
      });
    }
    const { accessToken, refreshToken, refreshUser } =
      await this.generateTokens(user);
    return {
      accessToken,
      refreshToken,
      user: refreshUser,
    };
  }

  async logout(userId: string) {
    await this.usersService.update(userId, { hashedRefreshToken: null });
    return {
      message: 'Logged out successfully',
    };
  }

  async refreshTokens(id: string, refreshToken: string) {
    const user = await this.usersService.findOne(id);

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException();
    }

    const tokenToCompare = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const isRefreshTokenMatch = tokenToCompare === user.hashedRefreshToken;

    if (!isRefreshTokenMatch) {
      // Possible token reuse attack — wipe the token family
      await this.usersService.update(id, { hashedRefreshToken: null });
      throw new UnauthorizedException();
    }

    // Invalidate old token before issuing new ones
    await this.usersService.update(id, { hashedRefreshToken: null });

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(user);
    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const passwordResetToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const passwordResetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await this.usersService.update(user.id, {
      passwordResetToken,
      passwordResetExpiry,
    });
    console.log(
      `Password reset token for ${user.email}: ${passwordResetToken}`,
    );
    return {
      message: 'Password reset token sent to your email',
    };
  }

  async verifyResetToken(email: string, token: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.passwordResetToken !== token) {
      throw new BadRequestException('Invalid token');
    }
    if (user.passwordResetExpiry! < new Date()) {
      throw new BadRequestException('Token expired');
    }

    return {
      message: 'Token verified',
    };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.passwordResetToken !== token) {
      throw new BadRequestException('Invalid token');
    }
    if (user.passwordResetExpiry! < new Date()) {
      throw new BadRequestException('Token expired');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await this.usersService.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    });
    return {
      message: 'Password reset successfully',
    };
  }

  async generateTokens(user: User) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        type: 'refresh',
        jti: uuidv4(),
      },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      },
    );

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const refreshUser = await this.usersService.update(user.id, {
      hashedRefreshToken: refreshTokenHash,
      lastLoginAt: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      refreshUser,
    };
  }
}
