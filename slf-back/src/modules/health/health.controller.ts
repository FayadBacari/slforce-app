import { Controller, Get } from '@nestjs/common';
import { Public } from '../../shared/decorators/public-route.decorator';

// Lightweight liveness endpoint. No DB call, no auth.
// Used by deployment platforms (Render, Fly, K8s) to know when the app is up.
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  getHealthStatus(): { status: 'ok'; uptimeSeconds: number; timestamp: string } {
    return {
      status:        'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp:     new Date().toISOString(),
    };
  }
}
