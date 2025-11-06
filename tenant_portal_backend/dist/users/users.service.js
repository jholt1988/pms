"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
        this.saltRounds = 10;
    }
    findOne(username) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.user.findUnique({ where: { username } });
        });
    }
    create(data, requestingUserRole) {
        return __awaiter(this, void 0, void 0, function* () {
            // Hash password if provided
            if (data.password) {
                data.password = yield bcrypt.hash(data.password, this.saltRounds);
            }
            // Role validation: Only PROPERTY_MANAGER can create PROPERTY_MANAGER accounts
            if (data.role === client_1.Role.PROPERTY_MANAGER) {
                if (requestingUserRole !== client_1.Role.PROPERTY_MANAGER) {
                    throw new common_1.ForbiddenException('Only property managers can create property manager accounts');
                }
            }
            else {
                // Default to TENANT if not specified
                data.role = data.role || client_1.Role.TENANT;
            }
            return this.prisma.user.create({ data });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.user.findUnique({ where: { id } });
        });
    }
    findAll(skip, take, role) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield this.prisma.user.findMany({
                where: role ? { role } : undefined,
                skip,
                take,
                orderBy: { id: 'asc' },
            });
            // Remove passwords from results
            return users.map((_a) => {
                var { password } = _a, user = __rest(_a, ["password"]);
                return user;
            });
        });
    }
    count(role) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.user.count({
                where: role ? { role } : undefined,
            });
        });
    }
    update(id, data, requestingUserId, requestingUserRole) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prevent self-promotion (users cannot change their own role)
            if (data.role !== undefined && requestingUserId === id) {
                throw new common_1.ForbiddenException('Users cannot change their own role');
            }
            // Role validation: Only PROPERTY_MANAGER can assign PROPERTY_MANAGER role
            if (data.role === client_1.Role.PROPERTY_MANAGER && requestingUserRole !== client_1.Role.PROPERTY_MANAGER) {
                throw new common_1.ForbiddenException('Only property managers can assign property manager role');
            }
            // Hash password if provided
            if (typeof data.password === 'string') {
                data.password = yield bcrypt.hash(data.password, this.saltRounds);
            }
            return this.prisma.user.update({ where: { id }, data });
        });
    }
    delete(id, requestingUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prevent self-deletion
            if (requestingUserId === id) {
                throw new common_1.ForbiddenException('Users cannot delete their own account');
            }
            yield this.prisma.user.delete({ where: { id } });
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
