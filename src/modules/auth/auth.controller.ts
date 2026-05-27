import {
  Body,
  Controller,
  HttpStatus,
  Post,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshJwtGuard } from 'src/common/guards/refresh-token.guard';

import { Public } from 'src/common/decorators/public.decorator';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh-tokens')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Req() req, @Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(
      req.user.id,
      refreshTokenDto.refreshToken,
    );
  }
}
