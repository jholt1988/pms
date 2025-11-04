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
exports.RentEstimatorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RentEstimatorService = class RentEstimatorService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    estimateRent(propertyId, unitId) {
        return __awaiter(this, void 0, void 0, function* () {
            // In a real application, this would involve more sophisticated logic:
            // - Fetching comparable properties/units from the database.
            // - Using external data sources (e.g., Zillow API, local market data).
            // - Applying algorithms based on square footage, number of bedrooms/bathrooms, amenities, location, etc.
            const unit = yield this.prisma.unit.findUnique({
                where: { id: unitId },
                include: { property: true },
            });
            if (!unit) {
                throw new Error('Unit not found');
            }
            // Placeholder logic: A very basic estimation based on unit size and a fixed rate
            // For demonstration, let's assume a base rate per unit and some adjustments.
            let estimatedRent = 1000; // Base rent
            if (unit.name.includes('Studio')) {
                estimatedRent += 100;
            }
            else if (unit.name.includes('1 Bed')) {
                estimatedRent += 200;
            }
            else if (unit.name.includes('2 Bed')) {
                estimatedRent += 400;
            }
            // Further adjustments could be based on property location, amenities, etc.
            // For example, if property.name includes 'Luxury', add more.
            if (unit.property.name.includes('Luxury')) {
                estimatedRent += 300;
            }
            const details = `Estimated based on unit type (${unit.name}) and property features (${unit.property.name}).`;
            return { estimatedRent, details };
        });
    }
};
exports.RentEstimatorService = RentEstimatorService;
exports.RentEstimatorService = RentEstimatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RentEstimatorService);
