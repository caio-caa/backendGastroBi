import { Test, TestingModule } from '@nestjs/testing';
import { TablesService } from './tables.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotFoundException } from '@nestjs/common';
import { TableStatus } from '@prisma/client';

describe('TablesService', () => {
  let service: TablesService;
  let prisma: PrismaService;

  const mockTable = {
    id: '1',
    restaurantId: 'r1',
    number: '01',
    capacity: 4,
    qrCodeUrl: null,
    status: TableStatus.AVAILABLE,
    currentOrder: null,
    waiter: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TablesService,
        {
          provide: PrismaService,
          useValue: {
            table: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            restaurant: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogsService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new table', async () => {
      jest.spyOn(prisma.table, 'create').mockResolvedValue(mockTable);

      const result = await service.create({ number: '01' }, 'r1');

      expect(result.number).toBe('01');
    });
  });

  describe('findAll', () => {
    it('should return tables', async () => {
      jest.spyOn(prisma.table, 'findMany').mockResolvedValue([mockTable]);

      const result = await service.findAll('r1');

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a table by id', async () => {
      jest.spyOn(prisma.table, 'findFirst').mockResolvedValue(mockTable);

      const result = await service.findOne('1', 'r1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException', async () => {
      jest.spyOn(prisma.table, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne('x', 'r1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a table', async () => {
      jest.spyOn(prisma.table, 'findFirst').mockResolvedValue(mockTable);
      jest.spyOn(prisma.table, 'update').mockResolvedValue({
        ...mockTable,
        capacity: 6,
      });

      const result = await service.update('1', 'r1', { capacity: 6 });

      expect(result.capacity).toBe(6);
    });
  });

  describe('remove', () => {
    it('should delete a table', async () => {
      jest.spyOn(prisma.table, 'findFirst').mockResolvedValue(mockTable);
      jest.spyOn(prisma.table, 'delete').mockResolvedValue(mockTable);

      await service.remove('1', 'r1');

      expect(prisma.table.delete).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update table status', async () => {
      jest.spyOn(prisma.table, 'findFirst').mockResolvedValue(mockTable);
      jest.spyOn(prisma.table, 'update').mockResolvedValue({
        ...mockTable,
        status: TableStatus.OCCUPIED,
      });

      const result = await service.updateStatus('1', 'r1', TableStatus.OCCUPIED);

      expect(result.status).toBe(TableStatus.OCCUPIED);
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code URL', async () => {
      jest.spyOn(prisma.table, 'findFirst').mockResolvedValue(mockTable);
      jest.spyOn(prisma.restaurant, 'findUnique').mockResolvedValue({
        id: 'r1',
        slug: 'test-restaurant',
      } as any);
      jest.spyOn(prisma.table, 'update').mockResolvedValue({
        ...mockTable,
        qrCodeUrl: 'http://localhost/menu/test-restaurant?table=01',
      });

      const result = await service.generateQRCode('1', 'r1', 'http://localhost');

      expect(result.qrCodeUrl).toContain('test-restaurant');
    });
  });
});
