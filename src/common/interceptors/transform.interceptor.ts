import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        return {
          success: true,
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: data?.message || 'Request successful',
          data: data?.data ?? data,
          meta: data?.meta || undefined,
        };
      }),
    );
  }
}
