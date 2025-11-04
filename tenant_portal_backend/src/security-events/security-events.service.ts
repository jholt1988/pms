import { Injectable } from '@nestjs/common';
import { Prisma, SecurityEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface LogEventParams {
  type: SecurityEventType;
  success: boolean;
  userId?: number | null;
  username?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}

interface ListEventsParams {
  limit?: number;
  offset?: number;
  userId?: number;
  username?: string;
  type?: SecurityEventType;
  from?: Date;
  to?: Date;
}

@Injectable()
export class SecurityEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async logEvent(params: LogEventParams) {
    return this.prisma.securityEvent.create({
      data: {
        type: params.type,
        success: params.success,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata ?? undefined,
        user: params.userId ? { connect: { id: params.userId } } : undefined,
        username: params.username ?? null,
      },
    });
  }

  async listEvents(params: ListEventsParams = {}) {
    const {
      limit = 100,
      offset = 0,
      userId,
      username,
      type,
      from,
      to,
    } = params;

    return this.prisma.securityEvent.findMany({
      where: {
        userId,
        username,
        type,
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Math.min(limit, 500),
    });
  }
}

