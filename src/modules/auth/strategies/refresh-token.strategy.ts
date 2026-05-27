import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';

import { Request } from 'express';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),

      ignoreExpiration: false,

      secretOrKey: process.env.JWT_REFRESH_SECRET!,

      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: any) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub,
      refreshToken: req.body.refreshToken,
    };
  }
}
