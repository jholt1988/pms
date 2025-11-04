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
exports.SecurityEventsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const security_events_service_1 = require("./security-events.service");
let SecurityEventsController = class SecurityEventsController {
    constructor(securityEventsService) {
        this.securityEventsService = securityEventsService;
    }
    list(limit, offset, userId, username, type, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.securityEventsService.listEvents({
                limit: limit ? Number(limit) : undefined,
                offset: offset ? Number(offset) : undefined,
                userId: userId ? Number(userId) : undefined,
                username: username !== null && username !== void 0 ? username : undefined,
                type: type && Object.values(client_1.SecurityEventType).includes(type)
                    ? type
                    : undefined,
                from: from ? new Date(from) : undefined,
                to: to ? new Date(to) : undefined,
            });
        });
    }
};
exports.SecurityEventsController = SecurityEventsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('offset')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('username')),
    __param(4, (0, common_1.Query)('type')),
    __param(5, (0, common_1.Query)('from')),
    __param(6, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SecurityEventsController.prototype, "list", null);
exports.SecurityEventsController = SecurityEventsController = __decorate([
    (0, common_1.Controller)('security-events'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PROPERTY_MANAGER),
    __metadata("design:paramtypes", [security_events_service_1.SecurityEventsService])
], SecurityEventsController);
