import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotFoundException } from '@nestjs/common';
import { CampaignType, CampaignStatus } from '@prisma/client';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let prisma: PrismaService;

  const mockCampaign = {
    id: '1',
    restaurantId: 'r1',
    name: 'Test Campaign',
    type: CampaignType.WHATSAPP,
    status: CampaignStatus.DRAFT,
    message: 'Test message',
    segmentation: {},
    scheduledFor: null,
    sentAt: null,
    metrics: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: PrismaService,
          useValue: {
            campaign: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogsService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new campaign', async () => {
      jest.spyOn(prisma.campaign, 'create').mockResolvedValue(mockCampaign);

      const result = await service.create({
        name: 'Test Campaign',
        type: CampaignType.WHATSAPP,
        message: 'Test message',
      }, 'r1');

      expect(result.name).toBe('Test Campaign');
    });

    it('should create scheduled campaign', async () => {
      const scheduledCampaign = {
        ...mockCampaign,
        status: CampaignStatus.SCHEDULED,
        scheduledFor: new Date(),
      };
      jest.spyOn(prisma.campaign, 'create').mockResolvedValue(scheduledCampaign);

      const result = await service.create({
        name: 'Test Campaign',
        type: CampaignType.WHATSAPP,
        message: 'Test message',
        scheduledFor: new Date(),
      }, 'r1');

      expect(result.status).toBe(CampaignStatus.SCHEDULED);
    });
  });

  describe('findAll', () => {
    it('should return paginated campaigns', async () => {
      jest.spyOn(prisma.campaign, 'findMany').mockResolvedValue([mockCampaign]);
      jest.spyOn(prisma.campaign, 'count').mockResolvedValue(1);

      const result = await service.findAll('r1', {});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      jest.spyOn(prisma.campaign, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.campaign, 'count').mockResolvedValue(0);

      await service.findAll('r1', { status: CampaignStatus.ACTIVE });

      expect(prisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: CampaignStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should filter by type', async () => {
      jest.spyOn(prisma.campaign, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.campaign, 'count').mockResolvedValue(0);

      await service.findAll('r1', { type: CampaignType.EMAIL });

      expect(prisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: CampaignType.EMAIL,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a campaign by id', async () => {
      jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(mockCampaign);

      const result = await service.findOne('1', 'r1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException', async () => {
      jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne('x', 'r1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a campaign', async () => {
      jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(mockCampaign);
      jest.spyOn(prisma.campaign, 'update').mockResolvedValue({
        ...mockCampaign,
        name: 'Updated Campaign',
      });

      const result = await service.update('1', 'r1', { name: 'Updated Campaign' });

      expect(result.name).toBe('Updated Campaign');
    });
  });

  describe('remove', () => {
    it('should delete a campaign', async () => {
      jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(mockCampaign);
      jest.spyOn(prisma.campaign, 'delete').mockResolvedValue(mockCampaign);

      await service.remove('1', 'r1');

      expect(prisma.campaign.delete).toHaveBeenCalled();
    });
  });

  describe('schedule', () => {
    it('should schedule a campaign', async () => {
      jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(mockCampaign);
      jest.spyOn(prisma.campaign, 'update').mockResolvedValue({
        ...mockCampaign,
        status: CampaignStatus.SCHEDULED,
        scheduledFor: new Date(),
      });

      const result = await service.schedule('1', 'r1', new Date());

      expect(result.status).toBe(CampaignStatus.SCHEDULED);
    });
  });

  describe('pause', () => {
    it('should pause a campaign', async () => {
      jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue(mockCampaign);
      jest.spyOn(prisma.campaign, 'update').mockResolvedValue({
        ...mockCampaign,
        status: CampaignStatus.PAUSED,
      });

      const result = await service.pause('1', 'r1');

      expect(result.status).toBe(CampaignStatus.PAUSED);
    });
  });

  describe('getMetrics', () => {
    it('should return campaign metrics', async () => {
      jest.spyOn(prisma.campaign, 'findFirst').mockResolvedValue({
        ...mockCampaign,
        metrics: { sent: 100, opened: 50 },
      });

      const result = await service.getMetrics('1', 'r1');

      expect(result).toEqual({ sent: 100, opened: 50 });
    });
  });
});
