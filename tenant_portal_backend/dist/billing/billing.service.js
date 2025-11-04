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
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const payments_service_1 = require("../payments/payments.service");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const security_events_service_1 = require("../security-events/security-events.service");
let BillingService = BillingService_1 = class BillingService {
    constructor(prisma, paymentsService, securityEvents) {
        this.prisma = prisma;
        this.paymentsService = paymentsService;
        this.securityEvents = securityEvents;
        this.logger = new common_1.Logger(BillingService_1.name);
    }
    runDailyBillingCycle() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.generateRecurringInvoices();
            yield this.applyLateFees();
            yield this.processAutopayCharges();
        });
    }
    generateRecurringInvoices() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const schedules = yield this.prisma.recurringInvoiceSchedule.findMany({
                where: { active: true, nextRun: { lte: now } },
                include: { lease: true },
            });
            for (const schedule of schedules) {
                try {
                    const invoice = yield this.prisma.invoice.create({
                        data: {
                            description: schedule.description,
                            amount: schedule.amount,
                            dueDate: schedule.nextRun,
                            lease: { connect: { id: schedule.leaseId } },
                            schedule: { connect: { id: schedule.id } },
                        },
                    });
                    const nextRun = this.calculateNextRun(schedule.frequency, schedule);
                    yield this.prisma.recurringInvoiceSchedule.update({
                        where: { id: schedule.id },
                        data: { nextRun },
                    });
                    this.logger.log(`Generated invoice ${invoice.id} for lease ${schedule.leaseId}`);
                }
                catch (error) {
                    this.logger.error(`Failed to generate invoice for schedule ${schedule.id}`, error);
                }
            }
        });
    }
    applyLateFees() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const now = new Date();
            const overdueInvoices = yield this.prisma.invoice.findMany({
                where: {
                    status: 'UNPAID',
                    schedule: {
                        lateFeeAmount: { not: null },
                        lateFeeAfterDays: { not: null },
                    },
                },
                include: { schedule: true, lateFees: true },
            });
            for (const invoice of overdueInvoices) {
                if (!((_a = invoice.schedule) === null || _a === void 0 ? void 0 : _a.lateFeeAmount) || !invoice.schedule.lateFeeAfterDays) {
                    continue;
                }
                const assessDate = (0, date_fns_1.addDays)(invoice.dueDate, invoice.schedule.lateFeeAfterDays);
                const hasLateFee = invoice.lateFees.some((fee) => !fee.waived);
                if (assessDate <= now && !hasLateFee) {
                    yield this.prisma.lateFee.create({
                        data: {
                            invoice: { connect: { id: invoice.id } },
                            amount: invoice.schedule.lateFeeAmount,
                        },
                    });
                    yield this.prisma.invoice.update({
                        where: { id: invoice.id },
                        data: { amount: invoice.amount + invoice.schedule.lateFeeAmount },
                    });
                    this.logger.log(`Applied late fee to invoice ${invoice.id}`);
                }
            }
        });
    }
    processAutopayCharges() {
        return __awaiter(this, void 0, void 0, function* () {
            const today = new Date();
            const autopayEnrollments = yield this.prisma.autopayEnrollment.findMany({
                where: { active: true },
                include: {
                    lease: {
                        include: {
                            invoices: {
                                where: { status: 'UNPAID', dueDate: { lte: today } },
                            },
                            tenant: true,
                        },
                    },
                    paymentMethod: true,
                },
            });
            for (const enrollment of autopayEnrollments) {
                for (const invoice of enrollment.lease.invoices) {
                    if (enrollment.maxAmount && invoice.amount > enrollment.maxAmount) {
                        this.logger.warn(`Skipping autopay for invoice ${invoice.id}: amount ${invoice.amount} exceeds cap ${enrollment.maxAmount}`);
                        continue;
                    }
                    try {
                        yield this.paymentsService.recordPaymentForInvoice({
                            invoiceId: invoice.id,
                            amount: invoice.amount,
                            leaseId: enrollment.leaseId,
                            userId: enrollment.lease.tenantId,
                            paymentMethodId: enrollment.paymentMethodId,
                            initiatedBy: 'AUTOPAY',
                        });
                        this.logger.log(`Autopay succeeded for invoice ${invoice.id}`);
                    }
                    catch (error) {
                        this.logger.error(`Autopay failed for invoice ${invoice.id}`, error);
                    }
                }
            }
        });
    }
    calculateNextRun(frequency, schedule) {
        var _a;
        if (frequency === 'WEEKLY' && schedule.dayOfWeek != null) {
            return (0, date_fns_1.nextDay)(schedule.nextRun, schedule.dayOfWeek);
        }
        if (frequency === 'MONTHLY') {
            const day = (_a = schedule.dayOfMonth) !== null && _a !== void 0 ? _a : schedule.nextRun.getDate();
            const tentative = (0, date_fns_1.addMonths)(schedule.nextRun, 1);
            const result = new Date(tentative.getFullYear(), tentative.getMonth(), day, tentative.getHours(), tentative.getMinutes());
            return result;
        }
        return (0, date_fns_1.addMonths)(schedule.nextRun, 1);
    }
    manualRun() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runDailyBillingCycle();
            return { generated: 1 };
        });
    }
    listSchedules() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.recurringInvoiceSchedule.findMany({
                include: {
                    lease: {
                        include: {
                            tenant: true,
                            unit: { include: { property: true } },
                        },
                    },
                },
                orderBy: { leaseId: 'asc' },
            });
        });
    }
    upsertSchedule(actor, dto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const lease = yield this.prisma.lease.findUnique({
                where: { id: dto.leaseId },
                include: { tenant: true, unit: true },
            });
            if (!lease) {
                throw new common_1.NotFoundException('Lease not found');
            }
            if (dto.frequency === client_1.BillingFrequency.MONTHLY && !dto.dayOfMonth) {
                dto.dayOfMonth = lease.startDate.getDate();
            }
            if (dto.frequency === client_1.BillingFrequency.WEEKLY && dto.dayOfWeek == null) {
                dto.dayOfWeek = new Date().getDay();
            }
            const nextRun = dto.nextRun
                ? new Date(dto.nextRun)
                : this.computeInitialRun(dto, lease.startDate);
            const schedule = yield this.prisma.recurringInvoiceSchedule.upsert({
                where: { leaseId: dto.leaseId },
                create: {
                    leaseId: dto.leaseId,
                    amount: dto.amount,
                    description: (_a = dto.description) !== null && _a !== void 0 ? _a : 'Recurring Charge',
                    frequency: dto.frequency,
                    dayOfMonth: dto.dayOfMonth,
                    dayOfWeek: dto.dayOfWeek,
                    nextRun,
                    lateFeeAmount: dto.lateFeeAmount,
                    lateFeeAfterDays: dto.lateFeeAfterDays,
                    active: (_b = dto.active) !== null && _b !== void 0 ? _b : true,
                },
                update: {
                    amount: dto.amount,
                    description: (_c = dto.description) !== null && _c !== void 0 ? _c : 'Recurring Charge',
                    frequency: dto.frequency,
                    dayOfMonth: dto.dayOfMonth,
                    dayOfWeek: dto.dayOfWeek,
                    nextRun,
                    lateFeeAmount: dto.lateFeeAmount,
                    lateFeeAfterDays: dto.lateFeeAfterDays,
                    active: (_d = dto.active) !== null && _d !== void 0 ? _d : true,
                },
                include: {
                    lease: {
                        include: {
                            tenant: true,
                            unit: { include: { property: true } },
                        },
                    },
                },
            });
            yield this.securityEvents.logEvent({
                type: client_1.SecurityEventType.RECURRING_BILLING_UPDATED,
                success: true,
                userId: actor.userId,
                username: actor.username,
                metadata: {
                    leaseId: dto.leaseId,
                    frequency: dto.frequency,
                    amount: dto.amount,
                    lateFeeAmount: dto.lateFeeAmount,
                    lateFeeAfterDays: dto.lateFeeAfterDays,
                },
            });
            return schedule;
        });
    }
    deactivateSchedule(actor, leaseId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prisma.recurringInvoiceSchedule.updateMany({
                where: { leaseId },
                data: { active: false },
            });
            yield this.securityEvents.logEvent({
                type: client_1.SecurityEventType.RECURRING_BILLING_UPDATED,
                success: true,
                userId: actor.userId,
                username: actor.username,
                metadata: { leaseId, action: 'DEACTIVATE_SCHEDULE' },
            });
            return { leaseId, active: false };
        });
    }
    getAutopayForTenant(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const lease = yield this.prisma.lease.findUnique({
                where: { tenantId: userId },
                include: {
                    autopayEnrollment: {
                        include: { paymentMethod: true },
                    },
                },
            });
            if (!lease) {
                throw new common_1.NotFoundException('Lease not found for tenant');
            }
            return {
                leaseId: lease.id,
                enrollment: lease.autopayEnrollment,
            };
        });
    }
    getAutopayForLease(leaseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const lease = yield this.prisma.lease.findUnique({
                where: { id: leaseId },
                include: {
                    autopayEnrollment: {
                        include: { paymentMethod: true },
                    },
                    tenant: true,
                    unit: { include: { property: true } },
                },
            });
            if (!lease) {
                throw new common_1.NotFoundException('Lease not found');
            }
            return lease;
        });
    }
    configureAutopay(actor, dto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const lease = yield this.prisma.lease.findUnique({
                where: { id: dto.leaseId },
                include: { tenant: true },
            });
            if (!lease) {
                throw new common_1.NotFoundException('Lease not found');
            }
            if (actor.role === client_1.Role.TENANT && lease.tenantId !== actor.userId) {
                throw new common_1.BadRequestException('You can only configure autopay for your lease');
            }
            const paymentMethod = yield this.prisma.paymentMethod.findUnique({
                where: { id: dto.paymentMethodId },
            });
            if (!paymentMethod || paymentMethod.userId !== lease.tenantId) {
                throw new common_1.BadRequestException('Payment method must belong to the lease tenant');
            }
            const enrollment = yield this.prisma.autopayEnrollment.upsert({
                where: { leaseId: dto.leaseId },
                create: {
                    leaseId: dto.leaseId,
                    paymentMethodId: dto.paymentMethodId,
                    active: (_a = dto.active) !== null && _a !== void 0 ? _a : true,
                    maxAmount: dto.maxAmount,
                },
                update: {
                    paymentMethodId: dto.paymentMethodId,
                    active: (_b = dto.active) !== null && _b !== void 0 ? _b : true,
                    maxAmount: dto.maxAmount,
                },
                include: {
                    paymentMethod: true,
                    lease: {
                        include: {
                            tenant: true,
                            unit: { include: { property: true } },
                        },
                    },
                },
            });
            yield this.securityEvents.logEvent({
                type: client_1.SecurityEventType.AUTOPAY_ENABLED,
                success: true,
                userId: actor.userId,
                username: actor.username,
                metadata: {
                    leaseId: dto.leaseId,
                    paymentMethodId: dto.paymentMethodId,
                    maxAmount: dto.maxAmount,
                },
            });
            return enrollment;
        });
    }
    disableAutopay(actor, leaseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const lease = yield this.prisma.lease.findUnique({
                where: { id: leaseId },
            });
            if (!lease) {
                throw new common_1.NotFoundException('Lease not found');
            }
            if (actor.role === client_1.Role.TENANT && lease.tenantId !== actor.userId) {
                throw new common_1.BadRequestException('You can only modify autopay for your lease');
            }
            const result = yield this.prisma.autopayEnrollment.updateMany({
                where: { leaseId },
                data: { active: false },
            });
            if (result.count > 0) {
                yield this.securityEvents.logEvent({
                    type: client_1.SecurityEventType.AUTOPAY_DISABLED,
                    success: true,
                    userId: actor.userId,
                    username: actor.username,
                    metadata: { leaseId },
                });
            }
            return { leaseId, active: false };
        });
    }
    computeInitialRun(dto, leaseStart) {
        var _a, _b;
        const now = new Date();
        if (dto.frequency === client_1.BillingFrequency.MONTHLY) {
            const day = (_a = dto.dayOfMonth) !== null && _a !== void 0 ? _a : leaseStart.getDate();
            let candidate = (0, date_fns_1.set)(now, { date: day, hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
            if ((0, date_fns_1.isBefore)(candidate, now)) {
                candidate = (0, date_fns_1.addMonths)(candidate, 1);
            }
            return candidate;
        }
        if (dto.frequency === client_1.BillingFrequency.WEEKLY) {
            const targetDay = (_b = dto.dayOfWeek) !== null && _b !== void 0 ? _b : now.getDay();
            const candidate = (0, date_fns_1.nextDay)(now, targetDay);
            return (0, date_fns_1.set)(candidate, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
        }
        return (0, date_fns_1.addMonths)(now, 1);
    }
};
exports.BillingService = BillingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_1AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingService.prototype, "runDailyBillingCycle", null);
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payments_service_1.PaymentsService,
        security_events_service_1.SecurityEventsService])
], BillingService);
