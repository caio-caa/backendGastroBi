import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService } from './audit-logs.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditAction, UserType } from '@prisma/client';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let prisma: PrismaService;

  const mockAuditLog = {
    id: '1',
    userId: 'user-1',
    userType: UserType.ADMIN,
    action: AuditAction.CREATE,
    entity: 'User',
    entityId: 'entity-1',
    oldValue: null,
    newValue: { name: 'Test' },
    ip: '127.0.0.1',
    userAgent: 'Jest',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an audit log', async () => {
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue(mockAuditLog);

      const result = await service.create({
        userId: 'user-1',
        userType: UserType.ADMIN,
        action: AuditAction.CREATE,
        entity: 'User',
        entityId: 'entity-1',
        newValue: { name: 'Test' },
      });

      expect(result.action).toBe(AuditAction.CREATE);
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([mockAuditLog]);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by userId', async () => {
      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(0);

      await service.findAll({ userId: 'user-1' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
          }),
        }),
      );
    });

    it('should filter by action', async () => {
      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(0);

      await service.findAll({ action: AuditAction.DELETE });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: AuditAction.DELETE,
          }),
        }),
      );
    });

    it('should filter by entity', async () => {
      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(0);

      await service.findAll({ entity: 'User' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entity: 'User',
          }),
        }),
      );
    });
  });

  describe('getStats', () => {
    it('should return audit log statistics', async () => {
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValueOnce(100);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValueOnce(10);
      jest.spyOn(prisma.auditLog, 'groupBy').mockResolvedValue([
        { action: AuditAction.CREATE, _count: 50 },
        { action: AuditAction.UPDATE, _count: 30 },
        { action: AuditAction.DELETE, _count: 20 },
      ] as any);

      const result = await service.getStats();

      expect(result.totalLogs).toBe(100);
      expect(result.todayLogs).toBe(10);
      expect(result.actionCounts).toHaveProperty('CREATE');
    });
  });
});
