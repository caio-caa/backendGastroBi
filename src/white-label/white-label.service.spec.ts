import { Test, TestingModule } from '@nestjs/testing';
import { WhiteLabelService } from './white-label.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('WhiteLabelService', () => {
  let service: WhiteLabelService;
  let prisma: PrismaService;

  const mockConfig = {
    id: '1',
    clientName: 'test-client',
    brandName: 'Test Brand',
    domain: 'test.example.com',
    logo: null,
    favicon: null,
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    accentColor: '#10b981',
    features: {},
    customCSS: null,
    customJS: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhiteLabelService,
        {
          provide: PrismaService,
          useValue: {
            whiteLabelConfig: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogsService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<WhiteLabelService>(WhiteLabelService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new white label config', async () => {
      jest.spyOn(prisma.whiteLabelConfig, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.whiteLabelConfig, 'create').mockResolvedValue(mockConfig);

      const result = await service.create({
        clientName: 'test-client',
        brandName: 'Test Brand',
        domain: 'test.example.com',
      }, 'admin-id');

      expect(result.brandName).toBe('Test Brand');
    });

    it('should throw ConflictException if domain exists', async () => {
      jest.spyOn(prisma.whiteLabelConfig, 'findUnique').mockResolvedValue(mockConfig);

      await expect(service.create({
        clientName: 'test-client',
        brandName: 'Test Brand',
        domain: 'test.example.com',
      }, 'admin-id')).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all white label configs', async () => {
      jest.spyOn(prisma.whiteLabelConfig, 'findMany').mockResolvedValue([mockConfig]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a config by id', async () => {
      jest.spyOn(prisma.whiteLabelConfig, 'findUnique').mockResolvedValue(mockConfig);

      const result = await service.findOne('1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException', async () => {
      jest.spyOn(prisma.whiteLabelConfig, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByDomain', () => {
    it('should return a config by domain', async () => {
      jest.spyOn(prisma.whiteLabelConfig, 'findUnique').mockResolvedValue(mockConfig);

      const result = await service.findByDomain('test.example.com');

      expect(result.domain).toBe('test.example.com');
    });
  });

  describe('update', () => {
    it('should update a config', async () => {
      jest.spyOn(prisma.whiteLabelConfig, 'findUnique').mockResolvedValue(mockConfig);
      jest.spyOn(prisma.whiteLabelConfig, 'update').mockResolvedValue({
        ...mockConfig,
        brandName: 'Updated Brand',
      });

      const result = await service.update('1', { brandName: 'Updated Brand' }, 'admin-id');

      expect(result.brandName).toBe('Updated Brand');
    });
  });

  describe('remove', () => {
    it('should delete a config', async () => {
      jest.spyOn(prisma.whiteLabelConfig, 'findUnique').mockResolvedValue(mockConfig);
      jest.spyOn(prisma.whiteLabelConfig, 'delete').mockResolvedValue(mockConfig);

      await service.remove('1', 'admin-id');

      expect(prisma.whiteLabelConfig.delete).toHaveBeenCalled();
    });
  });
});
