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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const password_policy_service_1 = require("./password-policy.service");
const security_events_service_1 = require("../security-events/security-events.service");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const otplib_1 = require("otplib");
const date_fns_1 = require("date-fns");
let AuthService = class AuthService {
    constructor(usersService, jwtService, passwordPolicy, securityEvents, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.passwordPolicy = passwordPolicy;
        this.securityEvents = securityEvents;
        this.configService = configService;
    }
    get maxFailedAttempts() {
        var _a;
        return Number((_a = this.configService.get('AUTH_MAX_FAILED_ATTEMPTS')) !== null && _a !== void 0 ? _a : 5);
    }
    get lockoutMinutes() {
        var _a;
        return Number((_a = this.configService.get('AUTH_LOCKOUT_MINUTES')) !== null && _a !== void 0 ? _a : 15);
    }
    login(dto, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield this.usersService.findOne(dto.username);
            if (!user) {
                yield this.securityEvents.logEvent({
                    type: client_1.SecurityEventType.LOGIN_FAILURE,
                    success: false,
                    username: dto.username,
                    ipAddress: context.ipAddress,
                    userAgent: context.userAgent,
                    metadata: { reason: 'USER_NOT_FOUND' },
                });
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const now = new Date();
            if (user.lockoutUntil && user.lockoutUntil > now) {
                yield this.securityEvents.logEvent({
                    type: client_1.SecurityEventType.LOGIN_LOCKED,
                    success: false,
                    userId: user.id,
                    username: user.username,
                    ipAddress: context.ipAddress,
                    userAgent: context.userAgent,
                    metadata: { lockoutUntil: user.lockoutUntil.toISOString() },
                });
                throw new common_1.UnauthorizedException('Account is locked. Please try again later.');
            }
            const isMatch = yield bcrypt.compare(dto.password, user.password);
            if (!isMatch) {
                const failedAttempts = ((_a = user.failedLoginAttempts) !== null && _a !== void 0 ? _a : 0) + 1;
                const update = { failedLoginAttempts: failedAttempts };
                let lockoutUntil = user.lockoutUntil;
                if (failedAttempts >= this.maxFailedAttempts) {
                    lockoutUntil = (0, date_fns_1.addMinutes)(now, this.lockoutMinutes);
                    update.lockoutUntil = lockoutUntil;
                    update.failedLoginAttempts = 0;
                }
                yield this.usersService.update(user.id, update);
                yield this.securityEvents.logEvent({
                    type: lockoutUntil ? client_1.SecurityEventType.LOGIN_LOCKED : client_1.SecurityEventType.LOGIN_FAILURE,
                    success: false,
                    userId: user.id,
                    username: user.username,
                    ipAddress: context.ipAddress,
                    userAgent: context.userAgent,
                    metadata: lockoutUntil
                        ? { reason: 'LOCKOUT_TRIGGERED', lockoutUntil: lockoutUntil.toISOString() }
                        : { reason: 'PASSWORD_MISMATCH', failedAttempts },
                });
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            if (user.mfaEnabled) {
                if (!dto.mfaCode) {
                    yield this.securityEvents.logEvent({
                        type: client_1.SecurityEventType.MFA_CHALLENGE_FAILED,
                        success: false,
                        userId: user.id,
                        username: user.username,
                        ipAddress: context.ipAddress,
                        userAgent: context.userAgent,
                        metadata: { reason: 'CODE_REQUIRED' },
                    });
                    throw new common_1.UnauthorizedException('MFA code required');
                }
                if (!user.mfaSecret || !otplib_1.authenticator.verify({ token: dto.mfaCode, secret: user.mfaSecret })) {
                    yield this.securityEvents.logEvent({
                        type: client_1.SecurityEventType.MFA_CHALLENGE_FAILED,
                        success: false,
                        userId: user.id,
                        username: user.username,
                        ipAddress: context.ipAddress,
                        userAgent: context.userAgent,
                        metadata: { reason: 'CODE_INVALID' },
                    });
                    throw new common_1.UnauthorizedException('Invalid MFA code');
                }
            }
            yield this.usersService.update(user.id, {
                failedLoginAttempts: 0,
                lockoutUntil: null,
                lastLoginAt: now,
            });
            yield this.securityEvents.logEvent({
                type: client_1.SecurityEventType.LOGIN_SUCCESS,
                success: true,
                userId: user.id,
                username: user.username,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            });
            const payload = { username: user.username, sub: user.id, role: user.role };
            return { access_token: this.jwtService.sign(payload) };
        });
    }
    register(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            const policyErrors = this.passwordPolicy.validate(dto.password);
            if (policyErrors.length) {
                throw new common_1.BadRequestException({ message: 'Password policy violation', errors: policyErrors });
            }
            const salt = yield bcrypt.genSalt();
            const hashedPassword = yield bcrypt.hash(dto.password, salt);
            const user = yield this.usersService.create({
                username: dto.username,
                password: hashedPassword,
                passwordUpdatedAt: new Date(),
            });
            yield this.securityEvents.logEvent({
                type: client_1.SecurityEventType.PASSWORD_CHANGED,
                success: true,
                userId: user.id,
                username: user.username,
                metadata: { source: 'REGISTER' },
            });
            return { id: user.id, username: user.username, role: user.role };
        });
    }
    getPasswordPolicy() {
        return this.passwordPolicy.policy;
    }
    prepareMfa(userId, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const secret = otplib_1.authenticator.generateSecret();
            const otpauthUrl = otplib_1.authenticator.keyuri(context.username, 'PropertyManagementSuite', secret);
            yield this.usersService.update(userId, {
                mfaTempSecret: secret,
            });
            yield this.securityEvents.logEvent({
                type: client_1.SecurityEventType.MFA_ENROLLMENT_STARTED,
                success: true,
                userId,
                username: context.username,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            });
            return { secret, otpauthUrl };
        });
    }
    activateMfa(userId, code, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.usersService.findById(userId);
            if (!(user === null || user === void 0 ? void 0 : user.mfaTempSecret)) {
                throw new common_1.BadRequestException('No MFA enrollment in progress.');
            }
            const valid = otplib_1.authenticator.verify({ token: code, secret: user.mfaTempSecret });
            if (!valid) {
                yield this.securityEvents.logEvent({
                    type: client_1.SecurityEventType.MFA_CHALLENGE_FAILED,
                    success: false,
                    userId,
                    username: context.username,
                    ipAddress: context.ipAddress,
                    userAgent: context.userAgent,
                    metadata: { reason: 'ACTIVATION_CODE_INVALID' },
                });
                throw new common_1.BadRequestException('Invalid verification code.');
            }
            yield this.usersService.update(userId, {
                mfaSecret: user.mfaTempSecret,
                mfaTempSecret: null,
                mfaEnabled: true,
            });
            yield this.securityEvents.logEvent({
                type: client_1.SecurityEventType.MFA_ENABLED,
                success: true,
                userId,
                username: context.username,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            });
        });
    }
    disableMfa(userId, code, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.usersService.findById(userId);
            if (!(user === null || user === void 0 ? void 0 : user.mfaEnabled)) {
                throw new common_1.BadRequestException('MFA is not enabled.');
            }
            if (user.mfaSecret) {
                if (!code) {
                    throw new common_1.BadRequestException('Verification code required to disable MFA.');
                }
                const valid = otplib_1.authenticator.verify({ token: code, secret: user.mfaSecret });
                if (!valid) {
                    yield this.securityEvents.logEvent({
                        type: client_1.SecurityEventType.MFA_CHALLENGE_FAILED,
                        success: false,
                        userId,
                        username: context.username,
                        ipAddress: context.ipAddress,
                        userAgent: context.userAgent,
                        metadata: { reason: 'DISABLE_CODE_INVALID' },
                    });
                    throw new common_1.BadRequestException('Invalid verification code.');
                }
            }
            yield this.usersService.update(userId, {
                mfaSecret: null,
                mfaTempSecret: null,
                mfaEnabled: false,
            });
            yield this.securityEvents.logEvent({
                type: client_1.SecurityEventType.MFA_DISABLED,
                success: true,
                userId,
                username: context.username,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            });
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        password_policy_service_1.PasswordPolicyService,
        security_events_service_1.SecurityEventsService,
        config_1.ConfigService])
], AuthService);
