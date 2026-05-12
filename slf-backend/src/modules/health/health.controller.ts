import { Controller, Get, HttpCode, HttpStatus, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { Public } from '@shared/decorators/public-route.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { CloudinaryService } from '@core/cloudinary/cloudinary.service';

// ─── HealthController ─────────────────────────────────────────────────────────
//
// Deux endpoints séparés selon la convention Kubernetes / Render :
//
//   GET /health        → LIVENESS  : "le process est-il vivant ?"
//                        → ne touche RIEN. Si répond 200, l'app n'a pas crashé.
//                        → utilisé par l'orchestrateur pour décider de redémarrer.
//
//   GET /health/ready  → READINESS : "le service peut-il traiter du trafic ?"
//                        → ping Mongo + Cloudinary. Si une dép est down,
//                          renvoie 503 → l'orchestrateur retire l'instance
//                          du load balancer sans la tuer.
//
// La séparation évite de redémarrer le pod uniquement parce qu'une dépendance
// externe (Cloudinary) est momentanément lente.

interface DependencyCheckResult {
  ok:     boolean;
  detail: string;
}

interface ReadinessResponse {
  status:       'ok' | 'degraded';
  dependencies: Record<string, DependencyCheckResult>;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    @InjectConnection() private readonly mongooseConnection: Connection,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ─── GET /health (alias /health/live) ────────────────────────────────────
  // Liveness — pas de DB call, pas d'auth. Si l'event loop répond, on est OK.
  @Public()
  @SkipThrottle()
  @Get()
  getLiveness(): { status: 'ok'; uptimeSeconds: number; timestamp: string } {
    return {
      status:        'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp:     new Date().toISOString(),
    };
  }

  @Public()
  @SkipThrottle()
  @Get('live')
  getLivenessAlias(): { status: 'ok'; uptimeSeconds: number; timestamp: string } {
    return this.getLiveness();
  }

  // ─── GET /health/ready ───────────────────────────────────────────────────
  //
  // Readiness probe — vérifie que les dépendances externes critiques répondent.
  // Renvoie 503 si une dépendance est down (l'orchestrateur retire l'instance
  // du LB) mais l'app reste vivante.
  //
  // Stream Chat n'est PAS check ici parce qu'il est traité comme best-effort
  // côté code (échecs Stream ne bloquent jamais une requête HTTP). Ajouter un
  // check Stream rendrait notre disponibilité dépendante de la leur, ce qu'on
  // veut éviter — sauf si on veut explicitement mettre l'app en degraded mode.
  @Public()
  @SkipThrottle()
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async getReadiness(): Promise<ReadinessResponse> {
    const [mongoCheck, cloudinaryCheck] = await Promise.all([
      this.checkMongoConnectivity(),
      this.checkCloudinaryConnectivity(),
    ]);

    const dependencies: Record<string, DependencyCheckResult> = {
      mongo:      mongoCheck,
      cloudinary: cloudinaryCheck,
    };

    const allHealthy = Object.values(dependencies).every((dep) => dep.ok);

    if (!allHealthy) {
      // 503 Service Unavailable — signale au load balancer que cette instance
      // ne devrait pas recevoir de trafic. Le body détaille les dépendances
      // pour les dashboards / Datadog.
      throw new ServiceUnavailableException({
        status: 'degraded',
        dependencies,
      });
    }

    return { status: 'ok', dependencies };
  }

  // ─── Private — vérifications individuelles ───────────────────────────────

  private checkMongoConnectivity(): Promise<DependencyCheckResult> {
    return Promise.resolve(this.evaluateMongoReadiness());
  }

  private evaluateMongoReadiness(): DependencyCheckResult {
    // mongoose readyState : 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const state = this.mongooseConnection.readyState;
    if (state === 1) {
      return { ok: true, detail: 'connected' };
    }
    return {
      ok:     false,
      detail: `readyState=${state} (0=disconnected, 2=connecting, 3=disconnecting)`,
    };
  }

  private async checkCloudinaryConnectivity(): Promise<DependencyCheckResult> {
    try {
      const isPingOk = await this.cloudinaryService.healthCheck();
      return isPingOk
        ? { ok: true,  detail: 'ping ok' }
        : { ok: false, detail: 'ping returned non-ok status' };
    } catch (pingError) {
      this.logger.warn('Cloudinary readiness check threw', pingError);
      return { ok: false, detail: 'ping threw exception' };
    }
  }
}
