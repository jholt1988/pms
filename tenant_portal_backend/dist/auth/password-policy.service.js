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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordPolicyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let PasswordPolicyService = class PasswordPolicyService {
    constructor(configService) {
        this.configService = configService;
    }
    get policy() {
        var _a;
        return {
            minLength: Number((_a = this.configService.get('AUTH_PASSWORD_MIN_LENGTH')) !== null && _a !== void 0 ? _a : 8),
            requireUppercase: this.getBoolean('AUTH_PASSWORD_REQUIRE_UPPERCASE', true),
            requireLowercase: this.getBoolean('AUTH_PASSWORD_REQUIRE_LOWERCASE', true),
            requireNumber: this.getBoolean('AUTH_PASSWORD_REQUIRE_NUMBER', true),
            requireSymbol: this.getBoolean('AUTH_PASSWORD_REQUIRE_SYMBOL', false),
        };
    }
    validate(password) {
        const failures = [];
        const policy = this.policy;
        if (password.length < policy.minLength) {
            failures.push(`Password must be at least ${policy.minLength} characters long.`);
        }
        if (policy.requireUppercase && !/[A-Z]/.test(password)) {
            failures.push('Password must contain at least one uppercase letter.');
        }
        if (policy.requireLowercase && !/[a-z]/.test(password)) {
            failures.push('Password must contain at least one lowercase letter.');
        }
        if (policy.requireNumber && !/[0-9]/.test(password)) {
            failures.push('Password must contain at least one number.');
        }
        if (policy.requireSymbol && !/[^A-Za-z0-9]/.test(password)) {
            failures.push('Password must contain at least one symbol.');
        }
        return failures;
    }
    getBoolean(key, defaultValue) {
        const value = this.configService.get(key);
        if (value === undefined || value === null) {
            return defaultValue;
        }
        return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
    }
};
exports.PasswordPolicyService = PasswordPolicyService;
exports.PasswordPolicyService = PasswordPolicyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PasswordPolicyService);
