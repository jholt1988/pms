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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PaymentsService = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    createInvoice(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            const lease = yield this.prisma.lease.findUnique({
                where: { id: dto.leaseId },
            });
            if (!lease) {
                throw new common_1.NotFoundException('Lease not found');
            }
            return this.prisma.invoice.create({
                data: {
                    description: dto.description,
                    amount: dto.amount,
                    dueDate: new Date(dto.dueDate),
                    lease: { connect: { id: dto.leaseId } },
                },
                include: {
                    lease: { include: { tenant: true, unit: { include: { property: true } } } },
                    payments: true,
                    lateFees: true,
                },
            });
        });
    }
    getInvoicesForUser(userId, role, leaseId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (role === client_1.Role.PROPERTY_MANAGER) {
                return this.prisma.invoice.findMany({
                    where: leaseId ? { leaseId } : undefined,
                    include: {
                        lease: { include: { tenant: true, unit: { include: { property: true } } } },
                        payments: true,
                        lateFees: true,
                        schedule: true,
                    },
                    orderBy: { dueDate: 'desc' },
                });
            }
            return this.prisma.invoice.findMany({
                where: {
                    lease: Object.assign({ tenantId: userId }, (leaseId ? { id: leaseId } : {})),
                },
                include: {
                    lease: { include: { tenant: true, unit: { include: { property: true } } } },
                    payments: true,
                    lateFees: true,
                    schedule: true,
                },
                orderBy: { dueDate: 'desc' },
            });
        });
    }
    createPayment(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const lease = yield this.prisma.lease.findUnique({
                where: { id: dto.leaseId },
                include: { tenant: true },
            });
            if (!lease || !lease.tenantId) {
                throw new common_1.BadRequestException('Lease must exist and have an assigned tenant');
            }
            if (dto.invoiceId) {
                const invoice = yield this.prisma.invoice.findUnique({
                    where: { id: dto.invoiceId },
                });
                if (!invoice || invoice.leaseId !== dto.leaseId) {
                    throw new common_1.BadRequestException('Invoice does not belong to the specified lease');
                }
            }
            const payment = yield this.prisma.payment.create({
                data: {
                    amount: dto.amount,
                    status: (_a = dto.status) !== null && _a !== void 0 ? _a : 'COMPLETED',
                    paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
                    invoice: dto.invoiceId ? { connect: { id: dto.invoiceId } } : undefined,
                    lease: { connect: { id: dto.leaseId } },
                    user: { connect: { id: lease.tenantId } },
                    externalId: dto['externalId'],
                    paymentMethod: dto.paymentMethodId ? { connect: { id: dto.paymentMethodId } } : undefined,
                },
                include: {
                    invoice: true,
                    lease: { include: { tenant: true, unit: { include: { property: true } } } },
                    paymentMethod: true,
                },
            });
            if (payment.invoiceId) {
                yield this.markInvoicePaid(payment.invoiceId);
            }
            return payment;
        });
    }
    getPaymentsForUser(userId, role, leaseId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (role === client_1.Role.PROPERTY_MANAGER) {
                return this.prisma.payment.findMany({
                    where: leaseId ? { leaseId } : undefined,
                    include: {
                        invoice: true,
                        lease: { include: { tenant: true, unit: { include: { property: true } } } },
                        paymentMethod: true,
                    },
                    orderBy: { paymentDate: 'desc' },
                });
            }
            return this.prisma.payment.findMany({
                where: Object.assign({ userId }, (leaseId ? { leaseId } : {})),
                include: {
                    invoice: true,
                    lease: { include: { tenant: true, unit: { include: { property: true } } } },
                    paymentMethod: true,
                },
                orderBy: { paymentDate: 'desc' },
            });
        });
    }
    recordPaymentForInvoice(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const payment = yield this.prisma.payment.create({
                data: {
                    amount: params.amount,
                    status: 'COMPLETED',
                    paymentDate: new Date(),
                    invoice: { connect: { id: params.invoiceId } },
                    lease: { connect: { id: params.leaseId } },
                    user: { connect: { id: params.userId } },
                    externalId: params.externalId,
                    paymentMethod: params.paymentMethodId ? { connect: { id: params.paymentMethodId } } : undefined,
                },
                include: {
                    invoice: true,
                    lease: { include: { tenant: true, unit: { include: { property: true } } } },
                    paymentMethod: true,
                },
            });
            yield this.markInvoicePaid(params.invoiceId);
            return payment;
        });
    }
    markPaymentReconciled(paymentId, externalId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    reconciledAt: new Date(),
                    externalId,
                },
                include: { invoice: true, lease: true },
            });
        });
    }
    markInvoicePaid(invoiceId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: 'PAID' },
            });
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
