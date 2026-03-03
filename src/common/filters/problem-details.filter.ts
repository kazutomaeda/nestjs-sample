import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const detail =
      exception instanceof HttpException
        ? exception.message
        : 'Internal Server Error';

    const body: Record<string, unknown> = {
      type: `https://httpstatuses.com/${status}`,
      title: HttpStatus[status],
      status,
      detail,
      instance: request.url,
    };

    // exceptionFactory から渡されたバリデーションエラーを errors フィールドに変換
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'errors' in exceptionResponse &&
      Array.isArray((exceptionResponse as Record<string, unknown>).errors)
    ) {
      body.errors = (exceptionResponse as Record<string, unknown>).errors;
      body.detail = 'Validation failed';
    }

    response
      .status(status)
      .header('Content-Type', 'application/problem+json')
      .json(body);
  }
}
