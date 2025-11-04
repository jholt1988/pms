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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("./billing.service");
const upsert_schedule_dto_1 = require("./dto/upsert-schedule.dto");
const configure_autopay_dto_1 = require("./dto/configure-autopay.dto");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
let BillingController = class BillingController {
    constructor(billingService) {
        this.billingService = billingService;
    }
    listSchedules() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.billingService.listSchedules();
        });
    }
    upsertSchedule(dto, req) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.billingService.upsertSchedule({ userId: req.user.userId, username: req.user.username, role: req.user.role }, dto);
        });
    }
    deactivate(leaseId, req) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.billingService.deactivateSchedule({ userId: req.user.userId, username: req.user.username, role: req.user.role }, Number(leaseId));
        });
    }
    getAutopay(req, leaseId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role === client_1.Role.TENANT) {
                return this.billingService.getAutopayForTenant(req.user.userId);
            }
            if (!leaseId) {
                throw new common_1.BadRequestException('leaseId query param required for property manager');
            }
            const lease = yield this.billingService.getAutopayForLease(Number(leaseId));
            return {
                leaseId: lease.id,
                autopayEnrollment: lease.autopayEnrollment,
                tenant: lease.tenant,
                unit: lease.unit,
            };
        });
    }
    configureAutopay(dto, req) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.billingService.configureAutopay({ userId: req.user.userId, username: req.user.username, role: req.user.role }, dto);
        });
    }
    disableAutopay(leaseId, req) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.billingService.disableAutopay({ userId: req.user.userId, username: req.user.username, role: req.user.role }, Number(leaseId));
        });
    }
    runBilling() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.billingService.manualRun();
        });
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    (0, common_1.Get)('schedules'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "listSchedules", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    (0, common_1.Post)('schedules'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_schedule_dto_1.UpsertScheduleDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "upsertSchedule", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    (0, common_1.Patch)('schedules/:leaseId/deactivate'),
    __param(0, (0, common_1.Param)('leaseId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "deactivate", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT, client_1.Role.PROPERTY_MANAGER),
    (0, common_1.Get)('autopay'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('leaseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getAutopay", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT, client_1.Role.PROPERTY_MANAGER),
    (0, common_1.Post)('autopay'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [configure_autopay_dto_1.ConfigureAutopayDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "configureAutopay", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT, client_1.Role.PROPERTY_MANAGER),
    (0, common_1.Patch)('autopay/:leaseId/disable'),
    __param(0, (0, common_1.Param)('leaseId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "disableAutopay", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    (0, common_1.Post)('run'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "runBilling", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
