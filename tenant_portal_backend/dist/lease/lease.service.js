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
exports.LeaseService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const respond_renewal_offer_dto_1 = require("./dto/respond-renewal-offer.dto");
let LeaseService = class LeaseService {
    constructor(prisma) {
        this.prisma = prisma;
        this.leaseInclude = {
            tenant: { select: { id: true, username: true, role: true } },
            unit: { include: { property: true } },
            recurringSchedule: true,
            autopayEnrollment: {
                include: { paymentMethod: true },
            },
            history: {
                include: { actor: { select: { id: true, username: true } } },
                orderBy: { createdAt: 'desc' },
                take: 25,
            },
            renewalOffers: {
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
            notices: {
                orderBy: { sentAt: 'desc' },
                take: 10,
            },
        };
    }
    createLease(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const startDate = this.requireDate(dto.startDate, 'startDate');
            const endDate = this.requireDate(dto.endDate, 'endDate');
            if (startDate >= endDate) {
                throw new common_1.BadRequestException('Lease end date must be after start date.');
            }
            try {
                const lease = yield this.prisma.lease.create({
                    data: {
                        tenantId: dto.tenantId,
                        unitId: dto.unitId,
                        startDate,
                        endDate,
                        rentAmount: dto.rentAmount,
                        status: (_a = dto.status) !== null && _a !== void 0 ? _a : client_1.LeaseStatus.ACTIVE,
                        moveInAt: (_b = this.optionalDate(dto.moveInAt)) !== null && _b !== void 0 ? _b : startDate,
                        moveOutAt: this.optionalDate(dto.moveOutAt),
                        noticePeriodDays: (_c = dto.noticePeriodDays) !== null && _c !== void 0 ? _c : 30,
                        autoRenew: (_d = dto.autoRenew) !== null && _d !== void 0 ? _d : false,
                        autoRenewLeadDays: dto.autoRenewLeadDays,
                        depositAmount: (_e = dto.depositAmount) !== null && _e !== void 0 ? _e : 0,
                    },
                    include: this.leaseInclude,
                });
                yield this.logHistory(lease.id, undefined, {
                    toStatus: lease.status,
                    note: 'Lease created',
                    rentAmount: lease.rentAmount,
                    depositAmount: lease.depositAmount,
                });
                return lease;
            }
            catch (error) {
                this.handlePrismaError(error);
            }
        });
    }
    getAllLeases() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.lease.findMany({
                include: this.leaseInclude,
                orderBy: [{ status: 'asc' }, { endDate: 'asc' }],
            });
        });
    }
    getLeaseById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const lease = yield this.prisma.lease.findUnique({ where: { id }, include: this.leaseInclude });
            if (!lease) {
                throw new common_1.NotFoundException('Lease not found');
            }
            return lease;
        });
    }
    getLeaseHistory(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const lease = yield this.prisma.lease.findUnique({ where: { id } });
            if (!lease) {
                throw new common_1.NotFoundException('Lease not found');
            }
            return this.prisma.leaseHistory.findMany({
                where: { leaseId: id },
                include: { actor: { select: { id: true, username: true } } },
                orderBy: { createdAt: 'desc' },
            });
        });
    }
    getLeaseByTenantId(tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.lease.findUnique({ where: { tenantId }, include: this.leaseInclude });
        });
    }
    updateLease(id, dto, actorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const lease = yield this.ensureLease(id);
            const data = {};
            if (dto.startDate) {
                data.startDate = this.requireDate(dto.startDate, 'startDate');
            }
            if (dto.endDate) {
                data.endDate = this.requireDate(dto.endDate, 'endDate');
            }
            if (dto.moveInAt) {
                data.moveInAt = this.requireDate(dto.moveInAt, 'moveInAt');
            }
            if (dto.moveOutAt) {
                data.moveOutAt = this.requireDate(dto.moveOutAt, 'moveOutAt');
            }
            if (dto.rentAmount !== undefined) {
                data.rentAmount = dto.rentAmount;
            }
            if (dto.depositAmount !== undefined) {
                data.depositAmount = dto.depositAmount;
            }
            if (dto.noticePeriodDays !== undefined) {
                data.noticePeriodDays = dto.noticePeriodDays;
            }
            if (dto.autoRenew !== undefined) {
                data.autoRenew = dto.autoRenew;
            }
            if (dto.autoRenewLeadDays !== undefined) {
                data.autoRenewLeadDays = dto.autoRenewLeadDays;
            }
            if (dto.terminationReason !== undefined) {
                data.terminationReason = dto.terminationReason;
            }
            const updated = yield this.prisma.lease.update({
                where: { id },
                data,
                include: this.leaseInclude,
            });
            if (dto.rentAmount !== undefined || dto.depositAmount !== undefined) {
                yield this.logHistory(updated.id, actorId, {
                    fromStatus: lease.status,
                    toStatus: updated.status,
                    rentAmount: updated.rentAmount,
                    depositAmount: updated.depositAmount,
                    note: 'Lease details updated',
                });
            }
            return updated;
        });
    }
    updateLeaseStatus(id, dto, actorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const lease = yield this.ensureLease(id);
            const data = {
                status: dto.status,
            };
            if (dto.moveInAt) {
                data.moveInAt = this.requireDate(dto.moveInAt, 'moveInAt');
            }
            if (dto.moveOutAt) {
                data.moveOutAt = this.requireDate(dto.moveOutAt, 'moveOutAt');
            }
            if (dto.noticePeriodDays !== undefined) {
                data.noticePeriodDays = dto.noticePeriodDays;
            }
            if (dto.renewalDueAt) {
                data.renewalDueAt = this.requireDate(dto.renewalDueAt, 'renewalDueAt');
            }
            if (dto.renewalAcceptedAt) {
                data.renewalAcceptedAt = this.requireDate(dto.renewalAcceptedAt, 'renewalAcceptedAt');
            }
            if (dto.terminationEffectiveAt) {
                data.terminationEffectiveAt = this.requireDate(dto.terminationEffectiveAt, 'terminationEffectiveAt');
            }
            if (dto.terminationRequestedBy) {
                data.terminationRequestedBy = dto.terminationRequestedBy;
            }
            if (dto.terminationReason !== undefined) {
                data.terminationReason = dto.terminationReason;
            }
            if (dto.rentEscalationPercent !== undefined) {
                data.rentEscalationPercent = dto.rentEscalationPercent;
            }
            if (dto.rentEscalationEffectiveAt) {
                data.rentEscalationEffectiveAt = this.requireDate(dto.rentEscalationEffectiveAt, 'rentEscalationEffectiveAt');
            }
            if (dto.currentBalance !== undefined) {
                data.currentBalance = dto.currentBalance;
            }
            if (dto.autoRenew !== undefined) {
                data.autoRenew = dto.autoRenew;
            }
            const updated = yield this.prisma.lease.update({ where: { id }, data, include: this.leaseInclude });
            yield this.logHistory(updated.id, actorId, {
                fromStatus: lease.status,
                toStatus: updated.status,
                note: 'Lease status updated',
            });
            return updated;
        });
    }
    createRenewalOffer(id, dto, actorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const lease = yield this.ensureLease(id);
            const proposedStart = this.requireDate(dto.proposedStart, 'proposedStart');
            const proposedEnd = this.requireDate(dto.proposedEnd, 'proposedEnd');
            if (proposedStart >= proposedEnd) {
                throw new common_1.BadRequestException('Renewal offer start date must be before end date.');
            }
            yield this.prisma.leaseRenewalOffer.create({
                data: {
                    leaseId: id,
                    proposedRent: dto.proposedRent,
                    proposedStart,
                    proposedEnd,
                    escalationPercent: dto.escalationPercent,
                    message: dto.message,
                    status: client_1.LeaseRenewalStatus.OFFERED,
                    expiresAt: this.optionalDate(dto.expiresAt),
                    respondedById: actorId,
                },
            });
            const updated = yield this.prisma.lease.update({
                where: { id },
                data: {
                    status: client_1.LeaseStatus.RENEWAL_PENDING,
                    renewalOfferedAt: new Date(),
                    renewalDueAt: (_b = (_a = this.optionalDate(dto.expiresAt)) !== null && _a !== void 0 ? _a : lease.renewalDueAt) !== null && _b !== void 0 ? _b : this.addDays(lease.endDate, -30),
                },
                include: this.leaseInclude,
            });
            yield this.logHistory(updated.id, actorId, {
                fromStatus: lease.status,
                toStatus: updated.status,
                note: 'Renewal offer sent',
                rentAmount: dto.proposedRent,
            });
            return updated;
        });
    }
    recordLeaseNotice(id, dto, actorId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureLease(id);
            const notice = yield this.prisma.leaseNotice.create({
                data: {
                    lease: { connect: { id } },
                    type: dto.type,
                    deliveryMethod: dto.deliveryMethod,
                    message: dto.message,
                    acknowledgedAt: this.optionalDate(dto.acknowledgedAt),
                    createdBy: { connect: { id: actorId } },
                },
                include: {
                    lease: true,
                },
            });
            let updatedStatus;
            if (dto.type === client_1.LeaseNoticeType.MOVE_OUT) {
                updatedStatus = client_1.LeaseStatus.NOTICE_GIVEN;
                yield this.prisma.lease.update({
                    where: { id },
                    data: { status: updatedStatus },
                });
            }
            yield this.logHistory(id, actorId, {
                fromStatus: notice.lease.status,
                toStatus: updatedStatus !== null && updatedStatus !== void 0 ? updatedStatus : notice.lease.status,
                note: `Notice recorded (${dto.type})`,
            });
            return this.getLeaseById(id);
        });
    }
    respondToRenewalOffer(leaseId, offerId, dto, tenantUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const lease = yield this.ensureLease(leaseId);
            if (lease.tenantId !== tenantUserId) {
                throw new common_1.ForbiddenException('You are not authorized to respond to this renewal offer.');
            }
            const offer = yield this.prisma.leaseRenewalOffer.findUnique({ where: { id: offerId } });
            if (!offer || offer.leaseId !== leaseId) {
                throw new common_1.NotFoundException('Renewal offer not found.');
            }
            if (offer.status !== client_1.LeaseRenewalStatus.OFFERED) {
                throw new common_1.BadRequestException('This renewal offer is no longer actionable.');
            }
            const respondedAt = new Date();
            const decisionStatus = dto.decision === respond_renewal_offer_dto_1.RenewalDecision.ACCEPTED ? client_1.LeaseRenewalStatus.ACCEPTED : client_1.LeaseRenewalStatus.DECLINED;
            if (dto.decision === respond_renewal_offer_dto_1.RenewalDecision.ACCEPTED && offer.expiresAt && offer.expiresAt < respondedAt) {
                throw new common_1.BadRequestException('This renewal offer has already expired.');
            }
            const leaseUpdate = {};
            if (dto.decision === respond_renewal_offer_dto_1.RenewalDecision.ACCEPTED) {
                leaseUpdate.status = client_1.LeaseStatus.ACTIVE;
                leaseUpdate.renewalAcceptedAt = respondedAt;
                leaseUpdate.startDate = offer.proposedStart;
                leaseUpdate.endDate = offer.proposedEnd;
                leaseUpdate.rentAmount = offer.proposedRent;
                leaseUpdate.rentEscalationPercent = (_a = offer.escalationPercent) !== null && _a !== void 0 ? _a : lease.rentEscalationPercent;
                leaseUpdate.rentEscalationEffectiveAt = offer.proposedStart;
                leaseUpdate.renewalDueAt = null;
            }
            else {
                leaseUpdate.status = client_1.LeaseStatus.RENEWAL_PENDING;
                leaseUpdate.renewalAcceptedAt = null;
            }
            const [, updatedLease] = yield this.prisma.$transaction([
                this.prisma.leaseRenewalOffer.update({
                    where: { id: offerId },
                    data: {
                        status: decisionStatus,
                        respondedAt,
                        respondedBy: { connect: { id: tenantUserId } },
                    },
                }),
                this.prisma.lease.update({
                    where: { id: leaseId },
                    data: leaseUpdate,
                }),
            ]);
            const noteParts = [
                `Tenant ${dto.decision === respond_renewal_offer_dto_1.RenewalDecision.ACCEPTED ? 'accepted' : 'declined'} renewal offer #${offerId}.`,
            ];
            if ((_b = dto.message) === null || _b === void 0 ? void 0 : _b.trim()) {
                noteParts.push(`Message: ${dto.message.trim()}`);
            }
            const historyMetadata = {
                renewalOfferId: offerId,
                decision: dto.decision,
                respondedAt: respondedAt.toISOString(),
            };
            if ((_c = dto.message) === null || _c === void 0 ? void 0 : _c.trim()) {
                historyMetadata.message = dto.message.trim();
            }
            yield this.logHistory(leaseId, tenantUserId, {
                fromStatus: lease.status,
                toStatus: updatedLease.status,
                note: noteParts.join(' '),
                rentAmount: updatedLease.rentAmount,
                metadata: historyMetadata,
            });
            return this.getLeaseById(leaseId);
        });
    }
    submitTenantNotice(leaseId, dto, tenantUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const lease = yield this.ensureLease(leaseId);
            if (lease.tenantId !== tenantUserId) {
                throw new common_1.ForbiddenException('You are not authorized to update this lease.');
            }
            const moveOutAt = this.requireDate(dto.moveOutAt, 'moveOutAt');
            const updatedStatus = dto.type === client_1.LeaseNoticeType.MOVE_OUT ? client_1.LeaseStatus.NOTICE_GIVEN : lease.status;
            const [, updatedLease] = yield this.prisma.$transaction([
                this.prisma.leaseNotice.create({
                    data: {
                        lease: { connect: { id: leaseId } },
                        type: dto.type,
                        deliveryMethod: client_1.LeaseNoticeDeliveryMethod.PORTAL,
                        message: dto.message,
                        createdBy: { connect: { id: tenantUserId } },
                    },
                }),
                this.prisma.lease.update({
                    where: { id: leaseId },
                    data: {
                        moveOutAt: dto.type === client_1.LeaseNoticeType.MOVE_OUT ? moveOutAt : lease.moveOutAt,
                        status: updatedStatus,
                        terminationRequestedBy: client_1.LeaseTerminationParty.TENANT,
                    },
                }),
            ]);
            const noteParts = [`Tenant submitted ${dto.type.toLowerCase().replace('_', ' ')} notice via portal.`];
            if ((_a = dto.message) === null || _a === void 0 ? void 0 : _a.trim()) {
                noteParts.push(`Message: ${dto.message.trim()}`);
            }
            const metadata = {
                noticeType: dto.type,
                submittedAt: new Date().toISOString(),
            };
            if (dto.type === client_1.LeaseNoticeType.MOVE_OUT) {
                metadata.requestedMoveOut = moveOutAt.toISOString();
            }
            if ((_b = dto.message) === null || _b === void 0 ? void 0 : _b.trim()) {
                metadata.message = dto.message.trim();
            }
            yield this.logHistory(leaseId, tenantUserId, {
                fromStatus: lease.status,
                toStatus: updatedLease.status,
                note: noteParts.join(' '),
                metadata,
            });
            return this.getLeaseById(leaseId);
        });
    }
    ensureLease(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const lease = yield this.prisma.lease.findUnique({ where: { id }, include: this.leaseInclude });
            if (!lease) {
                throw new common_1.NotFoundException('Lease not found');
            }
            return lease;
        });
    }
    requireDate(value, field) {
        const date = this.optionalDate(value);
        if (!date) {
            throw new common_1.BadRequestException(`Invalid ${field} provided.`);
        }
        return date;
    }
    optionalDate(value) {
        if (!value) {
            return undefined;
        }
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            throw new common_1.BadRequestException('Invalid date value provided.');
        }
        return date;
    }
    handlePrismaError(error) {
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                throw new common_1.BadRequestException('A tenant or unit already has an active lease.');
            }
        }
        throw error;
    }
    logHistory(leaseId, actorId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prisma.leaseHistory.create({
                data: {
                    lease: { connect: { id: leaseId } },
                    actor: actorId ? { connect: { id: actorId } } : undefined,
                    fromStatus: data.fromStatus,
                    toStatus: data.toStatus,
                    note: data.note,
                    rentAmount: data.rentAmount,
                    depositAmount: data.depositAmount,
                    metadata: data.metadata,
                },
            });
        });
    }
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
};
exports.LeaseService = LeaseService;
exports.LeaseService = LeaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaseService);
