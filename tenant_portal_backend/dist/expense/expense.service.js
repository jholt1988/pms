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
exports.ExpenseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExpenseService = class ExpenseService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    createExpense(recordedById, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.expense.create({
                data: {
                    recordedBy: { connect: { id: recordedById } },
                    property: { connect: { id: data.propertyId } },
                    unit: data.unitId ? { connect: { id: data.unitId } } : undefined,
                    description: data.description,
                    amount: data.amount,
                    date: data.date,
                    category: data.category,
                },
            });
        });
    }
    getAllExpenses(propertyId, unitId, category) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {};
            if (propertyId) {
                where.propertyId = propertyId;
            }
            if (unitId) {
                where.unitId = unitId;
            }
            if (category) {
                where.category = category;
            }
            return this.prisma.expense.findMany({ where, include: { property: true, unit: true, recordedBy: true } });
        });
    }
    getExpenseById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.expense.findUnique({ where: { id }, include: { property: true, unit: true, recordedBy: true } });
        });
    }
    updateExpense(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.expense.update({ where: { id }, data });
        });
    }
    deleteExpense(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.expense.delete({ where: { id } });
        });
    }
};
exports.ExpenseService = ExpenseService;
exports.ExpenseService = ExpenseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExpenseService);
