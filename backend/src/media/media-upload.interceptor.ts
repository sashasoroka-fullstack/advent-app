import { CallHandler, ExecutionContext, Injectable, NestInterceptor, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import { createMediaMulterOptions } from './media-multer.config';
@Injectable()
export class MediaUploadInterceptor implements NestInterceptor {
    private readonly delegate: NestInterceptor;
    constructor(private readonly configService: ConfigService) {
        const Interceptor = FileInterceptor('file', createMediaMulterOptions(this.configService));
        this.delegate = new Interceptor();
    }
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> | Promise<Observable<unknown>> {
        return this.delegate.intercept(context, next);
    }
}
