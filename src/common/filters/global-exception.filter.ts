// import {
//   ExceptionFilter,
//   Catch,
//   ArgumentsHost,
//   HttpException,
// } from '@nestjs/common';

// @Catch(HttpException)
// export class HttpExceptionFilter implements ExceptionFilter {
//   catch(exception: HttpException, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse();

//     const status = exception.getStatus();
//     const message = exception.getResponse();

//     response.status(status).json({
//       success: false,
//       statusCode: status,
//       message: message['message'],
//       error: message['error'],
//     });
//   }
// }

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    /**
     * HTTP Exceptions
     */
    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        message = (exceptionResponse as any).message || exceptionResponse;

        error = (exceptionResponse as any).error || exception.name;
      }
    } else if (exception instanceof QueryFailedError) {

    /**
     * TypeORM Errors
     */
      status = HttpStatus.BAD_REQUEST;

      const driverError = (exception as any).driverError;

      error = 'Database Error';

      // PostgreSQL error codes
      switch (driverError.code) {
        case '23505':
          message = 'Duplicate field value already exists';
          status = HttpStatus.CONFLICT;
          break;

        case '23503':
          message = 'Related resource does not exist';
          break;

        default:
          message = driverError.detail || exception.message;
      }
    } else if (exception instanceof Error) {

    /**
     * Unknown Errors
     */
      message = exception.message;
      error = exception.name;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error,
    });
  }
}
