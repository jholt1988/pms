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
exports.RentalApplicationController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const rental_application_service_1 = require("./rental-application.service");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const roles_guard_1 = require("../auth/roles.guard");
const submit_application_dto_1 = require("./dto/submit-application.dto");
const add_note_dto_1 = require("./dto/add-note.dto");
let RentalApplicationController = class RentalApplicationController {
    constructor(rentalApplicationService) {
        this.rentalApplicationService = rentalApplicationService;
    }
    submitApplication(data, req) {
        const authUser = req.user;
        return this.rentalApplicationService.submitApplication(data, authUser === null || authUser === void 0 ? void 0 : authUser.userId);
    }
    getAllApplications() {
        return this.rentalApplicationService.getAllApplications();
    }
    getMyApplications(req) {
        return this.rentalApplicationService.getApplicationsByApplicantId(req.user.userId);
    }
    getApplicationById(id) {
        return this.rentalApplicationService.getApplicationById(Number(id));
    }
    updateApplicationStatus(id, data) {
        return this.rentalApplicationService.updateApplicationStatus(Number(id), data.status);
    }
    screenApplication(id, req) {
        return this.rentalApplicationService.screenApplication(Number(id), req.user);
    }
    addNote(id, dto, req) {
        return this.rentalApplicationService.addNote(Number(id), dto, {
            userId: req.user.userId,
            username: req.user.username,
        });
    }
};
exports.RentalApplicationController = RentalApplicationController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submit_application_dto_1.SubmitApplicationDto, Object]),
    __metadata("design:returntype", void 0)
], RentalApplicationController.prototype, "submitApplication", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RentalApplicationController.prototype, "getAllApplications", null);
__decorate([
    (0, common_1.Get)('my-applications'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RentalApplicationController.prototype, "getMyApplications", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RentalApplicationController.prototype, "getApplicationById", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RentalApplicationController.prototype, "updateApplicationStatus", null);
__decorate([
    (0, common_1.Post)(':id/screen'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RentalApplicationController.prototype, "screenApplication", null);
__decorate([
    (0, common_1.Post)(':id/notes'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_note_dto_1.AddRentalApplicationNoteDto, Object]),
    __metadata("design:returntype", void 0)
], RentalApplicationController.prototype, "addNote", null);
exports.RentalApplicationController = RentalApplicationController = __decorate([
    (0, common_1.Controller)('rental-applications'),
    __metadata("design:paramtypes", [rental_application_service_1.RentalApplicationService])
], RentalApplicationController);
