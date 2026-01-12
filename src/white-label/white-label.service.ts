import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, UserType } from '@prisma/client';

@Injectable()
export class WhiteLabelService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(dto: {
    clientName: string;
    brandName: string;
    domain: string;
    logo?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    features?: unknown;
    customCSS?: string;
    customJS?: string;
  }, adminId: string) {
    const existing = await this.prisma.whiteLabelConfig.findUnique({
      where: { domain: dto.domain },
    });

    if (existing) {
      throw new ConflictException('Domain already exists');
    }

    const config = await this.prisma.whiteLabelConfig.create({
      data: {
        clientName: dto.clientName,
        brandName: dto.brandName,
        domain: dto.domain,
        logo: dto.logo,
        favicon: dto.favicon,
        primaryColor: dto.primaryColor || '#3b82f6',
        secondaryColor: dto.secondaryColor || '#1e40af',
        accentColor: dto.accentColor || '#10b981',
        features: dto.features ? structuredClone(dto.features) : {},
        customCSS: dto.customCSS,
        customJS: dto.customJS,
      },
    });

    await this.auditLogsService.create({
      userId: adminId,
      userType: UserType.ADMIN,
      action: AuditAction.CREATE,
      entity: 'WhiteLabelConfig',
      entityId: config.id,
      newValue: { clientName: config.clientName, domain: config.domain },
    });

    return config;
  }

  async findAll() {
    return this.prisma.whiteLabelConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const config = await this.prisma.whiteLabelConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('White label config not found');
    }

    return config;
  }

  async findByDomain(domain: string) {
    const config = await this.prisma.whiteLabelConfig.findUnique({
      where: { domain },
    });

    if (!config) {
      throw new NotFoundException('White label config not found');
    }

    return config;
  }

  async update(id: string, dto: Partial<{
    brandName: string;
    logo: string;
    favicon: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    features: unknown;
    customCSS: string;
    customJS: string;
  }>, adminId: string) {
    await this.findOne(id);

    const updated = await this.prisma.whiteLabelConfig.update({
      where: { id },
      data: {
        ...dto,
        features: dto.features ? JSON.parse(JSON.stringify(dto.features)) : undefined,
      },
    });

    await this.auditLogsService.create({
      userId: adminId,
      userType: UserType.ADMIN,
      action: AuditAction.UPDATE,
      entity: 'WhiteLabelConfig',
      entityId: id,
      newValue: { brandName: updated.brandName },
    });

    return updated;
  }

  async remove(id: string, adminId: string) {
    const config = await this.findOne(id);

    await this.prisma.whiteLabelConfig.delete({ where: { id } });

    await this.auditLogsService.create({
      userId: adminId,
      userType: UserType.ADMIN,
      action: AuditAction.DELETE,
      entity: 'WhiteLabelConfig',
      entityId: id,
      oldValue: { clientName: config.clientName },
    });
  }
}
