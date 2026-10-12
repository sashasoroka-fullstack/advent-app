import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/public.decorator';

export class HealthResponseDto {
    @ApiProperty({ example: 'ok' })
    status: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
    @Public()
    @Get()
    @ApiOperation({ summary: 'Liveness probe' })
    @ApiOkResponse({ type: HealthResponseDto })
    check(): HealthResponseDto {
        return { status: 'ok' };
    }
}
