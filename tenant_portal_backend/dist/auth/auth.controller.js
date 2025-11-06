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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const passport_1 = require("@nestjs/passport");
const login_request_dto_1 = require("./dto/login-request.dto");
const register_request_dto_1 = require("./dto/register-request.dto");
const mfa_dto_1 = require("./dto/mfa.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    login(loginDto, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            return this.authService.login(loginDto, {
                ipAddress: this.getRequestIp(req),
                userAgent: (_a = req.headers['user-agent']) !== null && _a !== void 0 ? _a : undefined,
            });
        });
    }
    register(registerDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.authService.register(registerDto);
        });
    }
    getPasswordPolicy() {
        return this.authService.getPasswordPolicy();
    }
    getProfile(req) {
        return req.user;
    }
    prepareMfa(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const authUser = req.user;
            return this.authService.prepareMfa(authUser.sub, {
                username: authUser.username,
                ipAddress: this.getRequestIp(req),
                userAgent: (_a = req.headers['user-agent']) !== null && _a !== void 0 ? _a : undefined,
            });
        });
    }
    activateMfa(req, dto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const authUser = req.user;
            yield this.authService.activateMfa(authUser.sub, dto.code, {
                username: authUser.username,
                ipAddress: this.getRequestIp(req),
                userAgent: (_a = req.headers['user-agent']) !== null && _a !== void 0 ? _a : undefined,
            });
            return { success: true };
        });
    }
    disableMfa(req, dto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const authUser = req.user;
            yield this.authService.disableMfa(authUser.sub, dto.code, {
                username: authUser.username,
                ipAddress: this.getRequestIp(req),
                userAgent: (_a = req.headers['user-agent']) !== null && _a !== void 0 ? _a : undefined,
            });
            return { success: true };
        });
    }
    getRequestIp(req) {
        var _a;
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string' && forwarded.length > 0) {
            return (_a = forwarded.split(',')[0]) === null || _a === void 0 ? void 0 : _a.trim();
        }
        if (Array.isArray(forwarded) && forwarded.length > 0) {
            return forwarded[0];
        }
        return req.ip;
    }
    forgotPassword(dto, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield this.authService.forgotPassword(dto.username, {
                ipAddress: this.getRequestIp(req),
                userAgent: (_a = req.headers['user-agent']) !== null && _a !== void 0 ? _a : undefined,
            });
            return { message: 'If a matching account was found, a password reset email has been sent.' };
        });
    }
    resetPassword(dto, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield this.authService.resetPassword(dto.token, dto.newPassword, {
                ipAddress: this.getRequestIp(req),
                userAgent: (_a = req.headers['user-agent']) !== null && _a !== void 0 ? _a : undefined,
            });
            return { message: 'Password has been reset successfully.' };
        });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_request_dto_1.LoginRequestDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_request_dto_1.RegisterRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('password-policy'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getPasswordPolicy", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('mfa/prepare'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "prepareMfa", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('mfa/activate'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mfa_dto_1.MfaActivateDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "activateMfa", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('mfa/disable'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mfa_dto_1.MfaDisableDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disableMfa", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
