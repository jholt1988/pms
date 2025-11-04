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
exports.PaymentMethodsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentMethodsService = class PaymentMethodsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(userId, dto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.paymentMethod.create({
                data: {
                    user: { connect: { id: userId } },
                    type: dto.type,
                    provider: dto.provider,
                    providerCustomerId: dto.providerCustomerId,
                    providerPaymentMethodId: dto.providerPaymentMethodId,
                    last4: dto.last4,
                    brand: dto.brand,
                    expMonth: dto.expMonth,
                    expYear: dto.expYear,
                },
            });
        });
    }
    listForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.paymentMethod.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
        });
    }
    remove(userId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = yield this.prisma.paymentMethod.findUnique({ where: { id } });
            if (!method || method.userId !== userId) {
                throw new common_1.NotFoundException('Payment method not found');
            }
            yield this.prisma.paymentMethod.delete({ where: { id } });
            return { id, deleted: true };
        });
    }
};
exports.PaymentMethodsService = PaymentMethodsService;
exports.PaymentMethodsService = PaymentMethodsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentMethodsService);
