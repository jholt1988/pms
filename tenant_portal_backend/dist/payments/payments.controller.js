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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const payments_service_1 = require("./payments.service");
const client_1 = require("@prisma/client");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const create_invoice_dto_1 = require("./dto/create-invoice.dto");
const create_payment_dto_1 = require("./dto/create-payment.dto");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    createInvoice(body) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.paymentsService.createInvoice(body);
        });
    }
    getInvoices(req, leaseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const parsedLeaseId = leaseId === undefined ? undefined : Number(leaseId);
            if (leaseId !== undefined && Number.isNaN(parsedLeaseId)) {
                throw new common_1.BadRequestException('leaseId must be a number');
            }
            return this.paymentsService.getInvoicesForUser(req.user.userId, req.user.role, parsedLeaseId);
        });
    }
    createPayment(body) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.paymentsService.createPayment(body);
        });
    }
    getPayments(req, leaseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const parsedLeaseId = leaseId === undefined ? undefined : Number(leaseId);
            if (leaseId !== undefined && Number.isNaN(parsedLeaseId)) {
                throw new common_1.BadRequestException('leaseId must be a number');
            }
            return this.paymentsService.getPaymentsForUser(req.user.userId, req.user.role, parsedLeaseId);
        });
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('invoices'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_invoice_dto_1.CreateInvoiceDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.Get)('invoices'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER, client_1.Role.TENANT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('leaseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getInvoices", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER, client_1.Role.TENANT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('leaseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPayments", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
