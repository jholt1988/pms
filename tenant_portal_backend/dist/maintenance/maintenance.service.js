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
exports.MaintenanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let MaintenanceService = class MaintenanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(userId, dto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const priority = (_a = dto.priority) !== null && _a !== void 0 ? _a : client_1.MaintenancePriority.MEDIUM;
            const { resolutionDueAt, responseDueAt, policyId } = yield this.computeSlaTargets((_b = dto.propertyId) !== null && _b !== void 0 ? _b : null, priority);
            const request = yield this.prisma.maintenanceRequest.create({
                data: {
                    title: dto.title,
                    description: dto.description,
                    priority,
                    dueAt: resolutionDueAt,
                    responseDueAt,
                    slaPolicy: policyId ? { connect: { id: policyId } } : undefined,
                    author: { connect: { id: userId } },
                    property: dto.propertyId ? { connect: { id: dto.propertyId } } : undefined,
                    unit: dto.unitId ? { connect: { id: dto.unitId } } : undefined,
                    asset: dto.assetId ? { connect: { id: dto.assetId } } : undefined,
                },
                include: this.defaultRequestInclude,
            });
            yield this.recordHistory(request.id, {
                toStatus: request.status,
                note: 'Request created',
                changedById: userId,
            });
            return request;
        });
    }
    findAllForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.maintenanceRequest.findMany({
                where: { authorId: userId },
                include: this.defaultRequestInclude,
                orderBy: { createdAt: 'desc' },
            });
        });
    }
    findAll() {
        return __awaiter(this, arguments, void 0, function* (filters = {}) {
            const { status, priority, propertyId, unitId, assigneeId, page = 1, pageSize = 25, } = filters;
            const where = {};
            if (status) {
                where.status = status;
            }
            if (priority) {
                where.priority = priority;
            }
            if (propertyId !== undefined) {
                where.propertyId = propertyId;
            }
            if (unitId !== undefined) {
                where.unitId = unitId;
            }
            if (assigneeId !== undefined) {
                where.assigneeId = assigneeId;
            }
            const take = Math.min(Math.max(pageSize, 1), 100);
            const skip = Math.max(page - 1, 0) * take;
            return this.prisma.maintenanceRequest.findMany({
                where,
                include: this.defaultRequestInclude,
                orderBy: [
                    { status: 'asc' },
                    { priority: 'desc' },
                    { dueAt: 'asc' },
                ],
                skip,
                take,
            });
        });
    }
    updateStatus(id, dto, actorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const existing = yield this.prisma.maintenanceRequest.findUnique({
                where: { id },
                include: this.defaultRequestInclude,
            });
            if (!existing) {
                throw new common_1.NotFoundException('Maintenance request not found');
            }
            const updateData = { status: dto.status };
            if (!existing.acknowledgedAt && dto.status === client_1.Status.IN_PROGRESS) {
                updateData.acknowledgedAt = new Date();
            }
            if (dto.status === client_1.Status.COMPLETED) {
                updateData.completedAt = new Date();
            }
            const updated = yield this.prisma.maintenanceRequest.update({
                where: { id },
                data: updateData,
                include: this.defaultRequestInclude,
            });
            yield this.recordHistory(id, {
                fromStatus: existing.status,
                toStatus: dto.status,
                changedById: actorId,
                note: dto.note,
                toAssignee: (_a = updated.assigneeId) !== null && _a !== void 0 ? _a : undefined,
                fromAssignee: (_b = existing.assigneeId) !== null && _b !== void 0 ? _b : undefined,
            });
            if (dto.note) {
                yield this.addNote(id, { body: dto.note }, actorId);
            }
            return updated;
        });
    }
    assignTechnician(id, dto, actorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const existing = yield this.prisma.maintenanceRequest.findUnique({
                where: { id },
                select: {
                    id: true,
                    status: true,
                    assigneeId: true,
                },
            });
            if (!existing) {
                throw new common_1.NotFoundException('Maintenance request not found');
            }
            if (existing.assigneeId === dto.technicianId) {
                return this.prisma.maintenanceRequest.findUniqueOrThrow({
                    where: { id },
                    include: this.defaultRequestInclude,
                });
            }
            const updated = yield this.prisma.maintenanceRequest.update({
                where: { id },
                data: {
                    assignee: { connect: { id: dto.technicianId } },
                },
                include: this.defaultRequestInclude,
            });
            yield this.recordHistory(id, {
                changedById: actorId,
                fromAssignee: (_a = existing.assigneeId) !== null && _a !== void 0 ? _a : undefined,
                fromStatus: existing.status,
                toAssignee: (_b = updated.assigneeId) !== null && _b !== void 0 ? _b : undefined,
                toStatus: updated.status,
                note: 'Technician assigned',
            });
            return updated;
        });
    }
    addNote(requestId, dto, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const note = yield this.prisma.maintenanceNote.create({
                data: {
                    request: { connect: { id: requestId } },
                    author: { connect: { id: authorId } },
                    body: dto.body,
                },
                include: { author: true },
            });
            return note;
        });
    }
    listTechnicians() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.technician.findMany({
                where: { active: true },
                orderBy: { name: 'asc' },
            });
        });
    }
    createTechnician(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const role = this.parseTechnicianRole(data.role);
            return this.prisma.technician.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    user: data.userId ? { connect: { id: data.userId } } : undefined,
                    role,
                },
            });
        });
    }
    listAssets(propertyId, unitId) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {};
            if (propertyId !== undefined) {
                where.propertyId = propertyId;
            }
            if (unitId !== undefined) {
                where.unitId = unitId;
            }
            return this.prisma.maintenanceAsset.findMany({
                where,
                orderBy: { name: 'asc' },
            });
        });
    }
    createAsset(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const category = this.parseAssetCategory(data.category);
            const installDate = this.parseOptionalDate(data.installDate, 'installDate');
            return this.prisma.maintenanceAsset.create({
                data: {
                    property: { connect: { id: data.propertyId } },
                    unit: data.unitId ? { connect: { id: data.unitId } } : undefined,
                    name: data.name,
                    category,
                    manufacturer: data.manufacturer,
                    model: data.model,
                    serialNumber: data.serialNumber,
                    installDate,
                },
            });
        });
    }
    getSlaPolicies(propertyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {
                active: true,
            };
            if (propertyId) {
                where.OR = [{ propertyId }, { propertyId: null }];
            }
            else {
                where.propertyId = null;
            }
            return this.prisma.maintenanceSlaPolicy.findMany({
                where,
                orderBy: [{ propertyId: 'desc' }, { priority: 'asc' }],
            });
        });
    }
    computeSlaTargets(propertyId, priority) {
        return __awaiter(this, void 0, void 0, function* () {
            const policies = yield this.getSlaPolicies(propertyId !== null && propertyId !== void 0 ? propertyId : undefined);
            const policy = policies.find((p) => p.priority === priority);
            if (!policy) {
                return { resolutionDueAt: null, responseDueAt: null, policyId: null };
            }
            const now = new Date();
            const resolutionDueAt = new Date(now.getTime() + policy.resolutionTimeMinutes * 60 * 1000);
            const responseDueAt = policy.responseTimeMinutes
                ? new Date(now.getTime() + policy.responseTimeMinutes * 60 * 1000)
                : null;
            return { resolutionDueAt, responseDueAt, policyId: policy.id };
        });
    }
    get defaultRequestInclude() {
        const include = {
            author: true,
            property: true,
            unit: true,
            asset: true,
            assignee: true,
            slaPolicy: true,
            notes: {
                include: { author: true },
                orderBy: { createdAt: 'desc' },
            },
            history: {
                include: {
                    changedBy: true,
                    fromAssignee: true,
                    toAssignee: true,
                },
                orderBy: { createdAt: 'desc' },
            },
        };
        return include;
    }
    recordHistory(requestId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.maintenanceRequestHistory.create({
                data: {
                    request: { connect: { id: requestId } },
                    changedBy: data.changedById ? { connect: { id: data.changedById } } : undefined,
                    fromStatus: data.fromStatus,
                    toStatus: data.toStatus,
                    fromAssignee: data.fromAssignee ? { connect: { id: data.fromAssignee } } : undefined,
                    toAssignee: data.toAssignee ? { connect: { id: data.toAssignee } } : undefined,
                    note: data.note,
                },
            });
        });
    }
    parseTechnicianRole(role) {
        if (!role) {
            return client_1.TechnicianRole.IN_HOUSE;
        }
        const normalized = role.trim().toUpperCase().replace(/[\s-]+/g, '_');
        if (Object.values(client_1.TechnicianRole).includes(normalized)) {
            return normalized;
        }
        throw new common_1.BadRequestException(`Unsupported technician role: ${role}`);
    }
    parseAssetCategory(category) {
        if (!category) {
            throw new common_1.BadRequestException('Asset category is required');
        }
        const normalized = category.trim().toUpperCase().replace(/[\s-]+/g, '_');
        if (Object.values(client_1.MaintenanceAssetCategory).includes(normalized)) {
            return normalized;
        }
        throw new common_1.BadRequestException(`Unsupported asset category: ${category}`);
    }
    parseOptionalDate(value, field) {
        if (!value) {
            return undefined;
        }
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            throw new common_1.BadRequestException(`Invalid ${field} supplied`);
        }
        return date;
    }
};
exports.MaintenanceService = MaintenanceService;
exports.MaintenanceService = MaintenanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaintenanceService);
