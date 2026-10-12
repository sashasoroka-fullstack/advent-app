import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    StreamableFile,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { PrivilegedOnly } from 'src/auth/privileged-only.decorator';
import { Public } from 'src/auth/public.decorator';
import { resolveCreatedBy, type AuthUser } from 'src/auth/auth-user';
import { MediaResponseDto } from './dto/media-response.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaService } from './media.service';
import { MediaUploadInterceptor } from './media-upload.interceptor';

@ApiTags('media')
@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'List uploaded media' })
    @ApiOkResponse({ type: MediaResponseDto, isArray: true })
    findAll() {
        return this.mediaService.findAll();
    }

    @Public()
    @Get(':id/file')
    @ApiOperation({
        summary: 'Download a media file',
        description:
            'SVG is served as an attachment to avoid inline script execution.',
    })
    @ApiOkResponse({
        description: 'File bytes',
        schema: { type: 'string', format: 'binary' },
    })
    @ApiNotFoundResponse({ description: 'Media not found' })
    async streamFile(@Param('id', ParseUUIDPipe) id: string) {
        const media = await this.mediaService.findOneEntity(id);
        const file = this.mediaService.openFileStream(media);
        return new StreamableFile(file.stream, {
            type: file.contentType,
            disposition: file.disposition,
        });
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get media metadata' })
    @ApiOkResponse({ type: MediaResponseDto })
    @ApiNotFoundResponse({ description: 'Media not found' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.mediaService.findOne(id);
    }

    @Post()
    @PrivilegedOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Upload a media file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: { type: 'string', format: 'binary' },
                altText: { type: 'string', maxLength: 2000 },
            },
        },
    })
    @ApiCreatedResponse({ type: MediaResponseDto })
    @ApiUnauthorizedResponse()
    @ApiForbiddenResponse({ description: 'Privileged role required' })
    @UseInterceptors(MediaUploadInterceptor)
    upload(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: UploadMediaDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.mediaService.createFromUploadedFile(
            file,
            body.altText,
            resolveCreatedBy(user),
        );
    }

    @Patch(':id')
    @PrivilegedOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update media metadata' })
    @ApiOkResponse({ type: MediaResponseDto })
    @ApiNotFoundResponse({ description: 'Media not found' })
    @ApiUnauthorizedResponse()
    @ApiForbiddenResponse({ description: 'Privileged role required' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: UpdateMediaDto,
    ) {
        return this.mediaService.update(id, body);
    }

    @Delete(':id')
    @PrivilegedOnly()
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a media file' })
    @ApiNoContentResponse()
    @ApiNotFoundResponse({ description: 'Media not found' })
    @ApiUnauthorizedResponse()
    @ApiForbiddenResponse({ description: 'Privileged role required' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.mediaService.remove(id);
    }
}
