/**
 * Lead Applications Service
 * Handles rental application submission and processing for leads
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class LeadApplicationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Submit a rental application
   */
  async submitApplication(data: any) {
    const application = await this.prisma.leadApplication.create({
      data: {
        ...data,
        submittedAt: new Date(),
      },
      include: {
        lead: true,
        property: true,
        unit: true,
      },
    });

    // Send confirmation email to lead
    if (application.lead.email) {
      await this.emailService.sendApplicationReceivedEmail(
        application,
        application.lead,
        application.property,
      ).catch(err => console.error('Failed to send application confirmation:', err));
    }

    return application;
  }

  /**
   * Get application by ID
   */
  async getApplicationById(id: string) {
    return this.prisma.leadApplication.findUnique({
      where: { id },
      include: {
        lead: true,
        property: true,
        unit: true,
        reviewedBy: true,
      },
    });
  }

  /**
   * Get applications for a lead
   */
  async getApplicationsForLead(leadId: string) {
    return this.prisma.leadApplication.findMany({
      where: { leadId },
      include: {
        property: true,
        unit: true,
        reviewedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all applications with filtering
   */
  async getApplications(filters?: {
    propertyId?: number;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.propertyId) {
      where.propertyId = filters.propertyId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.submittedAt = {};
      if (filters.dateFrom) where.submittedAt.gte = filters.dateFrom;
      if (filters.dateTo) where.submittedAt.lte = filters.dateTo;
    }

    const [applications, total] = await Promise.all([
      this.prisma.leadApplication.findMany({
        where,
        include: {
          lead: true,
          property: true,
          unit: true,
          reviewedBy: true,
        },
        orderBy: { submittedAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.leadApplication.count({ where }),
    ]);

    return { applications, total };
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    id: string,
    status: string,
    reviewedById?: number,
    reviewNotes?: string,
  ) {
    const updates: any = { status };

    if (status === 'APPROVED') {
      updates.approvedAt = new Date();
    }

    if (status === 'DENIED') {
      updates.rejectedAt = new Date();
    }

    if (reviewedById) {
      updates.reviewedById = reviewedById;
      updates.reviewedAt = new Date();
    }

    if (reviewNotes) {
      updates.reviewNotes = reviewNotes;
    }

    const application = await this.prisma.leadApplication.update({
      where: { id },
      data: updates,
      include: {
        lead: true,
        property: true,
      },
    });

    // Send status update email for major status changes
    if (application.lead.email && ['APPROVED', 'CONDITIONALLY_APPROVED', 'DENIED'].includes(status)) {
      await this.emailService.sendApplicationStatusEmail(
        application,
        application.lead,
        application.property,
        status as 'APPROVED' | 'CONDITIONALLY_APPROVED' | 'DENIED',
      ).catch(err => console.error('Failed to send application status email:', err));
    }

    return application;
  }

  /**
   * Update application screening results
   */
  async updateScreeningResults(
    id: string,
    creditScore?: number,
    backgroundCheckStatus?: string,
    creditCheckStatus?: string,
  ) {
    const updates: any = {};

    if (creditScore !== undefined) updates.creditScore = creditScore;
    if (backgroundCheckStatus) updates.backgroundCheckStatus = backgroundCheckStatus;
    if (creditCheckStatus) updates.creditCheckStatus = creditCheckStatus;

    return this.prisma.leadApplication.update({
      where: { id },
      data: updates,
    });
  }

  /**
   * Record application fee payment
   */
  async recordFeePayment(id: string, amount: number) {
    return this.prisma.leadApplication.update({
      where: { id },
      data: {
        applicationFee: amount,
        feePaid: true,
        feePaidAt: new Date(),
      },
    });
  }
}
