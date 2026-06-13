import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  /**
   * GET /health
   * Check system status: database connection and memory usage.
   * Returns 200 if all healthy, 503 if any indicator fails.
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'System health check (DB + Memory)' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      // Warning if heap exceeds 256MB
      () => this.memory.checkHeap('memory_heap', 256 * 1024 * 1024),
    ]);
  }
}
