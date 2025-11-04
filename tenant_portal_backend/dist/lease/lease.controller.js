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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaseController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const lease_service_1 = require("./lease.service");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const roles_guard_1 = require("../auth/roles.guard");
const create_lease_dto_1 = require("./dto/create-lease.dto");
const update_lease_dto_1 = require("./dto/update-lease.dto");
const update_lease_status_dto_1 = require("./dto/update-lease-status.dto");
const create_renewal_offer_dto_1 = require("./dto/create-renewal-offer.dto");
const record_lease_notice_dto_1 = require("./dto/record-lease-notice.dto");
const respond_renewal_offer_dto_1 = require("./dto/respond-renewal-offer.dto");
const tenant_submit_notice_dto_1 = require("./dto/tenant-submit-notice.dto");
let LeaseController = class LeaseController {
    constructor(leaseService) {
        this.leaseService = leaseService;
    }
    createLease(data) {
        return this.leaseService.createLease(data);
    }
    getAllLeases() {
        return this.leaseService.getAllLeases();
    }
    getMyLease(req) {
        return this.leaseService.getLeaseByTenantId(req.user.userId);
    }
    getLeaseById(id) {
        return this.leaseService.getLeaseById(Number(id));
    }
    getLeaseHistory(id) {
        return this.leaseService.getLeaseHistory(Number(id));
    }
    updateLease(id, data, req) {
        return this.leaseService.updateLease(Number(id), data, req.user.userId);
    }
    updateLeaseStatus(id, data, req) {
        return this.leaseService.updateLeaseStatus(Number(id), data, req.user.userId);
    }
    createRenewalOffer(id, dto, req) {
        return this.leaseService.createRenewalOffer(Number(id), dto, req.user.userId);
    }
    recordLeaseNotice(id, dto, req) {
        return this.leaseService.recordLeaseNotice(Number(id), dto, req.user.userId);
    }
    respondToRenewalOffer(id, offerId, dto, req) {
        return this.leaseService.respondToRenewalOffer(Number(id), Number(offerId), dto, req.user.userId);
    }
    submitTenantNotice(id, dto, req) {
        return this.leaseService.submitTenantNotice(Number(id), dto, req.user.userId);
    }
};
exports.LeaseController = LeaseController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lease_dto_1.CreateLeaseDto]),
    __metadata("design:returntype", void 0)
], LeaseController.prototype, "createLease", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LeaseController.prototype, "getAllLeases", null);
__decorate([
    (0, common_1.Get)('my-lease'),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeaseController.prototype, "getMyLease", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeaseController.prototype, "getLeaseById", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeaseController.prototype, "getLeaseHistory", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lease_dto_1.UpdateLeaseDto, Object]),
    __metadata("design:returntype", void 0)
], LeaseController.prototype, "updateLease", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lease_status_dto_1.UpdateLeaseStatusDto, Object]),
    __metadata("design:returntype", void 0)
], LeaseController.prototype, "updateLeaseStatus", null);
__decorate([
    (0, common_1.Post)(':id/renewal-offers'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_renewal_offer_dto_1.CreateRenewalOfferDto, Object]),
    __metadata("design:returntype", void 0)
], LeaseController.prototype, "createRenewalOffer", null);
__decorate([
    (0, common_1.Post)(':id/notices'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, record_lease_notice_dto_1.RecordLeaseNoticeDto, Object]),
    __metadata("design:returntype", void 0)
], LeaseController.prototype, "recordLeaseNotice", null);
__decorate([
    (0, common_1.Post)(':id/renewal-offers/:offerId/respond'),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('offerId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, respond_renewal_offer_dto_1.RespondRenewalOfferDto, Object]),
    __metadata("design:returntype", void 0)
], LeaseController.prototype, "respondToRenewalOffer", null);
__decorate([
    (0, common_1.Post)(':id/tenant-notices'),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tenant_submit_notice_dto_1.TenantSubmitNoticeDto, Object]),
    __metadata("design:returntype", void 0)
], LeaseController.prototype, "submitTenantNotice", null);
exports.LeaseController = LeaseController = __decorate([
    (0, common_1.Controller)('leases'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [lease_service_1.LeaseService])
], LeaseController);
