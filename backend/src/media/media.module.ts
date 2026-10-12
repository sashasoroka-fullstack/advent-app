import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MediaUploadInterceptor } from './media-upload.interceptor';
@Module({
    imports: [TypeOrmModule.forFeature([Media])],
    controllers: [MediaController],
    providers: [MediaService, MediaUploadInterceptor],
    exports: [MediaService],
})
export class MediaModule {
}
