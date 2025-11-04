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
exports.SecurityEventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SecurityEventsService = class SecurityEventsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    logEvent(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            return this.prisma.securityEvent.create({
                data: {
                    type: params.type,
                    success: params.success,
                    ipAddress: (_a = params.ipAddress) !== null && _a !== void 0 ? _a : null,
                    userAgent: (_b = params.userAgent) !== null && _b !== void 0 ? _b : null,
                    metadata: (_c = params.metadata) !== null && _c !== void 0 ? _c : undefined,
                    user: params.userId ? { connect: { id: params.userId } } : undefined,
                    username: (_d = params.username) !== null && _d !== void 0 ? _d : null,
                },
            });
        });
    }
    listEvents() {
        return __awaiter(this, arguments, void 0, function* (params = {}) {
            const { limit = 100, offset = 0, userId, username, type, from, to, } = params;
            return this.prisma.securityEvent.findMany({
                where: {
                    userId,
                    username,
                    type,
                    createdAt: {
                        gte: from,
                        lte: to,
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: Math.min(limit, 500),
            });
        });
    }
};
exports.SecurityEventsService = SecurityEventsService;
exports.SecurityEventsService = SecurityEventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SecurityEventsService);
