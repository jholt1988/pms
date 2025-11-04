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
exports.MaintenanceController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const maintenance_service_1 = require("./maintenance.service");
const client_1 = require("@prisma/client");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const create_maintenance_request_dto_1 = require("./dto/create-maintenance-request.dto");
const update_maintenance_status_dto_1 = require("./dto/update-maintenance-status.dto");
const assign_technician_dto_1 = require("./dto/assign-technician.dto");
const add_maintenance_note_dto_1 = require("./dto/add-maintenance-note.dto");
let MaintenanceController = class MaintenanceController {
    constructor(maintenanceService) {
        this.maintenanceService = maintenanceService;
    }
    findAll(req, query) {
        if (req.user.role === client_1.Role.PROPERTY_MANAGER) {
            const filters = this.parseManagerFilters(query);
            return this.maintenanceService.findAll(filters);
        }
        return this.maintenanceService.findAllForUser(req.user.userId);
    }
    create(req, dto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.maintenanceService.create(req.user.userId, dto);
        });
    }
    updateStatus(id, updateStatusDto, req) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.maintenanceService.updateStatus(Number(id), updateStatusDto, req.user.userId);
        });
    }
    assignTechnician(id, dto, req) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.maintenanceService.assignTechnician(Number(id), dto, req.user.userId);
        });
    }
    addNote(id, dto, req) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.maintenanceService.addNote(Number(id), dto, req.user.userId);
        });
    }
    listTechnicians() {
        return this.maintenanceService.listTechnicians();
    }
    createTechnician(body) {
        return this.maintenanceService.createTechnician(body);
    }
    listAssets(propertyId, unitId) {
        const parsedPropertyId = this.parseOptionalNumber(propertyId, 'propertyId', { min: 1 });
        const parsedUnitId = this.parseOptionalNumber(unitId, 'unitId', { min: 1 });
        return this.maintenanceService.listAssets(parsedPropertyId, parsedUnitId);
    }
    createAsset(body) {
        return this.maintenanceService.createAsset(body);
    }
    getSlaPolicies(propertyId) {
        const parsedPropertyId = this.parseOptionalNumber(propertyId, 'propertyId', { min: 1 });
        return this.maintenanceService.getSlaPolicies(parsedPropertyId);
    }
    parseManagerFilters(query) {
        const filters = {};
        const status = this.parseStatus(query.status);
        if (status) {
            filters.status = status;
        }
        const priority = this.parsePriority(query.priority);
        if (priority) {
            filters.priority = priority;
        }
        const propertyId = this.parseOptionalNumber(query.propertyId, 'propertyId', { min: 1 });
        if (propertyId !== undefined) {
            filters.propertyId = propertyId;
        }
        const unitId = this.parseOptionalNumber(query.unitId, 'unitId', { min: 1 });
        if (unitId !== undefined) {
            filters.unitId = unitId;
        }
        const assigneeId = this.parseOptionalNumber(query.assigneeId, 'assigneeId', { min: 1 });
        if (assigneeId !== undefined) {
            filters.assigneeId = assigneeId;
        }
        const page = this.parseOptionalNumber(query.page, 'page', { min: 1 });
        if (page !== undefined) {
            filters.page = page;
        }
        const pageSize = this.parseOptionalNumber(query.pageSize, 'pageSize', { min: 1 });
        if (pageSize !== undefined) {
            filters.pageSize = pageSize;
        }
        return filters;
    }
    parseStatus(value) {
        if (!value) {
            return undefined;
        }
        const normalized = value.trim().toUpperCase();
        if (Object.values(client_1.Status).includes(normalized)) {
            return normalized;
        }
        throw new common_1.BadRequestException(`Unsupported status filter: ${value}`);
    }
    parsePriority(value) {
        if (!value) {
            return undefined;
        }
        const normalized = value.trim().toUpperCase();
        if (Object.values(client_1.MaintenancePriority).includes(normalized)) {
            return normalized;
        }
        throw new common_1.BadRequestException(`Unsupported priority filter: ${value}`);
    }
    parseOptionalNumber(value, field, options) {
        if (value === undefined || value === '') {
            return undefined;
        }
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            throw new common_1.BadRequestException(`Invalid ${field} value: ${value}`);
        }
        const normalized = Math.trunc(parsed);
        if ((options === null || options === void 0 ? void 0 : options.min) !== undefined && normalized < options.min) {
            throw new common_1.BadRequestException(`${field} must be greater than or equal to ${options.min}`);
        }
        return normalized;
    }
};
exports.MaintenanceController = MaintenanceController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_maintenance_request_dto_1.CreateMaintenanceRequestDto]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_maintenance_status_dto_1.UpdateMaintenanceStatusDto, Object]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_technician_dto_1.AssignTechnicianDto, Object]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "assignTechnician", null);
__decorate([
    (0, common_1.Post)(':id/notes'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_maintenance_note_dto_1.AddMaintenanceNoteDto, Object]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "addNote", null);
__decorate([
    (0, common_1.Get)('technicians'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "listTechnicians", null);
__decorate([
    (0, common_1.Post)('technicians'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "createTechnician", null);
__decorate([
    (0, common_1.Get)('assets'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Query)('propertyId')),
    __param(1, (0, common_1.Query)('unitId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "listAssets", null);
__decorate([
    (0, common_1.Post)('assets'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "createAsset", null);
__decorate([
    (0, common_1.Get)('sla-policies'),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __param(0, (0, common_1.Query)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "getSlaPolicies", null);
exports.MaintenanceController = MaintenanceController = __decorate([
    (0, common_1.Controller)('maintenance'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [maintenance_service_1.MaintenanceService])
], MaintenanceController);
