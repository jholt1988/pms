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
exports.RentEstimatorController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const rent_estimator_service_1 = require("./rent-estimator.service");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const roles_guard_1 = require("../auth/roles.guard");
let RentEstimatorController = class RentEstimatorController {
    constructor(rentEstimatorService) {
        this.rentEstimatorService = rentEstimatorService;
    }
    estimateRent(propertyId, unitId) {
        return this.rentEstimatorService.estimateRent(Number(propertyId), Number(unitId));
    }
};
exports.RentEstimatorController = RentEstimatorController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('propertyId')),
    __param(1, (0, common_1.Query)('unitId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RentEstimatorController.prototype, "estimateRent", null);
exports.RentEstimatorController = RentEstimatorController = __decorate([
    (0, common_1.Controller)('rent-estimator'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __metadata("design:paramtypes", [rent_estimator_service_1.RentEstimatorService])
], RentEstimatorController);
