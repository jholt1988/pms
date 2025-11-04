"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalApplicationModule = void 0;
const common_1 = require("@nestjs/common");
const rental_application_controller_1 = require("./rental-application.controller");
const rental_application_service_1 = require("./rental-application.service");
const prisma_module_1 = require("../prisma/prisma.module");
const security_events_module_1 = require("../security-events/security-events.module");
let RentalApplicationModule = class RentalApplicationModule {
};
exports.RentalApplicationModule = RentalApplicationModule;
exports.RentalApplicationModule = RentalApplicationModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, security_events_module_1.SecurityEventsModule],
        controllers: [rental_application_controller_1.RentalApplicationController],
        providers: [rental_application_service_1.RentalApplicationService],
    })
], RentalApplicationModule);
