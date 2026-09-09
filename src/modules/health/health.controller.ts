import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from 'src/common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @Public() // Bypass JWT auth
  @SkipThrottle() // Bypass Rate limiting
  @HealthCheck()
  check() {
    return this.health.check([
      // 1. Verify PostgreSQL Database Connection
      () => this.db.pingCheck('database', { timeout: 5000 }),

      // 2. Verify Heap Memory (Alert if exceeds 250MB)
      () => this.memory.checkHeap('memory_heap', 250 * 1024 * 1024),

      // 3. Verify Storage / Disk Space (Alert if > 90% used)
      () =>
        this.disk.checkStorage('storage', {
          thresholdPercent: 0.9,
          path: process.platform === 'win32' ? 'C:\\' : '/',
        }),
    ]);
  }
}
