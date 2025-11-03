
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ApplicationStatus, QualificationStatus, Recommendation } from '@prisma/client';

@Injectable()
export class RentalApplicationService {
  constructor(private prisma: PrismaService) {}

  async submitApplication(
    applicantId: number,
    data: { propertyId: number; unitId: number; fullName: string; email: string; phoneNumber: string; income: number; employmentStatus: string; previousAddress: string },
  ) {
    return this.prisma.rentalApplication.create({
      data: {
        applicant: { connect: { id: applicantId } },
        property: { connect: { id: data.propertyId } },
        unit: { connect: { id: data.unitId } },
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        income: data.income,
        employmentStatus: data.employmentStatus,
        previousAddress: data.previousAddress,
      },
    });
  }

  async getAllApplications() {
    return this.prisma.rentalApplication.findMany({ include: { applicant: true, property: true, unit: true } });
  }

  async getApplicationsByApplicantId(applicantId: number) {
    return this.prisma.rentalApplication.findMany({ where: { applicantId }, include: { property: true, unit: true } });
  }

  async getApplicationById(id: number) {
    return this.prisma.rentalApplication.findUnique({ where: { id }, include: { applicant: true, property: true, unit: true } });
  }

  async updateApplicationStatus(id: number, status: ApplicationStatus) {
    return this.prisma.rentalApplication.update({ where: { id }, data: { status } });
  }

  async screenApplication(id: number) {
    const application = await this.prisma.rentalApplication.findUnique({
      where: { id },
      include: { unit: { include: { lease: true } } }, // Include lease to get rent amount
    });

    if (!application) {
      throw new Error('Rental application not found');
    }

    // Basic screening logic: income must be at least 3x rent
    const rentAmount = application.unit.lease?.rentAmount || 0; // Assuming rent is part of an active lease
    const requiredIncome = rentAmount * 3;

    let qualificationStatus: QualificationStatus;
    let recommendation: Recommendation;
    let screeningDetails: string = '';

    if (application.income >= requiredIncome) {
      qualificationStatus = QualificationStatus.QUALIFIED;
      recommendation = Recommendation.RECOMMEND_RENT;
      screeningDetails = `Applicant income ($${application.income}) meets or exceeds 3x rent ($${requiredIncome}).`;
    } else {
      qualificationStatus = QualificationStatus.NOT_QUALIFIED;
      recommendation = Recommendation.DO_NOT_RECOMMEND_RENT;
      screeningDetails = `Applicant income ($${application.income}) is less than 3x rent ($${requiredIncome}).`;
    }

    return this.prisma.rentalApplication.update({
      where: { id },
      data: {
        qualificationStatus,
        recommendation,
        screeningDetails,
      },
    });
  }
}
