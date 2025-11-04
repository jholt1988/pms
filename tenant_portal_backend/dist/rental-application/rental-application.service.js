"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalApplicationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const security_events_service_1 = require("../security-events/security-events.service");
let RentalApplicationService = class RentalApplicationService {
    constructor(prisma, securityEvents) {
        this.prisma = prisma;
        this.securityEvents = securityEvents;
    }
    submitApplication(data, applicantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.rentalApplication.create({
                data: {
                    property: { connect: { id: data.propertyId } },
                    unit: { connect: { id: data.unitId } },
                    applicant: applicantId ? { connect: { id: applicantId } } : undefined,
                    fullName: data.fullName,
                    email: data.email,
                    phoneNumber: data.phoneNumber,
                    income: data.income,
                    employmentStatus: data.employmentStatus,
                    previousAddress: data.previousAddress,
                    creditScore: data.creditScore,
                    monthlyDebt: data.monthlyDebt,
                    bankruptcyFiledYear: data.bankruptcyFiledYear,
                    rentalHistoryComments: data.rentalHistoryComments,
                },
            });
        });
    }
    getAllApplications() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.rentalApplication.findMany({
                include: {
                    applicant: true,
                    property: true,
                    unit: true,
                    manualNotes: { include: { author: true }, orderBy: { createdAt: 'desc' } },
                },
                orderBy: { createdAt: 'desc' },
            });
        });
    }
    getApplicationsByApplicantId(applicantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.rentalApplication.findMany({
                where: { applicantId },
                include: { property: true, unit: true, manualNotes: true },
                orderBy: { createdAt: 'desc' },
            });
        });
    }
    getApplicationById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.rentalApplication.findUnique({
                where: { id },
                include: {
                    applicant: true,
                    property: true,
                    unit: true,
                    manualNotes: { include: { author: true }, orderBy: { createdAt: 'desc' } },
                },
            });
        });
    }
    updateApplicationStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.rentalApplication.update({
                where: { id },
                data: { status },
                include: {
                    applicant: true,
                    property: true,
                    unit: true,
                    manualNotes: { include: { author: true }, orderBy: { createdAt: 'desc' } },
                },
            });
        });
    }
    screenApplication(id, actor) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const application = yield this.prisma.rentalApplication.findUnique({
                where: { id },
                include: {
                    unit: {
                        include: {
                            lease: true,
                        },
                    },
                }, // Include lease to get rent amount
            });
            if (!application) {
                throw new Error('Rental application not found');
            }
            // Basic screening logic: income must be at least 3x rent
            const rentAmount = ((_a = application.unit.lease) === null || _a === void 0 ? void 0 : _a.rentAmount) || 0; // Assuming rent is part of an active lease
            const requiredIncome = rentAmount * 3;
            const evaluation = this.calculateScreening(application.income, rentAmount, {
                creditScore: (_b = application.creditScore) !== null && _b !== void 0 ? _b : undefined,
                monthlyDebt: (_c = application.monthlyDebt) !== null && _c !== void 0 ? _c : undefined,
                bankruptcyFiledYear: (_d = application.bankruptcyFiledYear) !== null && _d !== void 0 ? _d : undefined,
            });
            const updatedApplication = yield this.prisma.rentalApplication.update({
                where: { id },
                data: {
                    qualificationStatus: evaluation.qualificationStatus,
                    recommendation: evaluation.recommendation,
                    screeningDetails: evaluation.caption,
                    screeningScore: evaluation.score,
                    screeningReasons: evaluation.reasons,
                    screenedAt: new Date(),
                    screenedBy: { connect: { id: actor.userId } },
                },
                include: {
                    applicant: true,
                    property: true,
                    unit: true,
                    manualNotes: { include: { author: true }, orderBy: { createdAt: 'desc' } },
                },
            });
            yield this.securityEvents.logEvent({
                type: client_1.SecurityEventType.APPLICATION_SCREENED,
                success: true,
                userId: actor.userId,
                username: actor.username,
                metadata: {
                    applicationId: id,
                    score: evaluation.score,
                    recommendation: evaluation.recommendation,
                    qualificationStatus: evaluation.qualificationStatus,
                    income: application.income,
                    rentAmount,
                    creditScore: application.creditScore,
                },
            });
            return updatedApplication;
        });
    }
    calculateScreening(monthlyIncome, monthlyRent, extra) {
        const reasons = [];
        const incomeRatio = monthlyRent > 0 ? monthlyIncome / monthlyRent : 0;
        let score = 0;
        if (incomeRatio >= 3.5) {
            score += 35;
            reasons.push(`Income covers rent ${incomeRatio.toFixed(2)}x`);
        }
        else if (incomeRatio >= 3) {
            score += 30;
            reasons.push(`Income covers rent ${incomeRatio.toFixed(2)}x`);
        }
        else if (incomeRatio >= 2.5) {
            score += 20;
            reasons.push(`Income covers rent ${incomeRatio.toFixed(2)}x (below target)`);
        }
        else {
            score += 10;
            reasons.push(`Income covers rent only ${incomeRatio.toFixed(2)}x`);
        }
        if (extra.creditScore) {
            const normalized = Math.min(Math.max(extra.creditScore, 300), 850);
            const creditContribution = ((normalized - 300) / 550) * 35;
            score += creditContribution;
            reasons.push(`Credit score ${extra.creditScore}`);
        }
        else {
            reasons.push('No credit score provided');
            score += 10;
        }
        if (extra.monthlyDebt && monthlyIncome > 0) {
            const dti = extra.monthlyDebt / monthlyIncome;
            if (dti <= 0.3) {
                score += 15;
                reasons.push(`DTI ${(dti * 100).toFixed(0)}%`);
            }
            else if (dti <= 0.45) {
                score += 8;
                reasons.push(`DTI ${(dti * 100).toFixed(0)}% (moderate)`);
            }
            else {
                score += 3;
                reasons.push(`High DTI ${(dti * 100).toFixed(0)}%`);
            }
        }
        if (extra.bankruptcyFiledYear) {
            const currentYear = new Date().getFullYear();
            if (currentYear - extra.bankruptcyFiledYear <= 7) {
                score -= 10;
                reasons.push(`Bankruptcy reported in ${extra.bankruptcyFiledYear}`);
            }
        }
        score = Math.max(0, Math.min(100, score));
        let qualificationStatus = client_1.QualificationStatus.NOT_QUALIFIED;
        let recommendation = client_1.Recommendation.DO_NOT_RECOMMEND_RENT;
        if (score >= 70) {
            qualificationStatus = client_1.QualificationStatus.QUALIFIED;
            recommendation = client_1.Recommendation.RECOMMEND_RENT;
        }
        else if (score >= 55) {
            qualificationStatus = client_1.QualificationStatus.QUALIFIED;
            recommendation = client_1.Recommendation.RECOMMEND_RENT;
            reasons.push('Score indicates marginal but acceptable risk.');
        }
        else {
            reasons.push('Score below recommended threshold.');
        }
        const caption = `Score ${score.toFixed(0)}/100 — income ${incomeRatio.toFixed(2)}x rent. ${reasons.join(' ')}`;
        return { score, reasons, caption, qualificationStatus, recommendation };
    }
    addNote(applicationId, dto, actor) {
        return __awaiter(this, void 0, void 0, function* () {
            const note = yield this.prisma.rentalApplicationNote.create({
                data: {
                    application: { connect: { id: applicationId } },
                    author: { connect: { id: actor.userId } },
                    body: dto.body,
                },
                include: { author: true },
            });
            yield this.securityEvents.logEvent({
                type: client_1.SecurityEventType.APPLICATION_NOTE_CREATED,
                success: true,
                userId: actor.userId,
                username: actor.username,
                metadata: { applicationId },
            });
            return note;
        });
    }
};
exports.RentalApplicationService = RentalApplicationService;
exports.RentalApplicationService = RentalApplicationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        security_events_service_1.SecurityEventsService])
], RentalApplicationService);
