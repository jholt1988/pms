
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PasswordPolicyService } from './password-policy.service';
import { SecurityEventsService } from '../security-events/security-events.service';
import { ConfigService } from '@nestjs/config';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { SecurityEventType } from '@prisma/client';
import { authenticator } from 'otplib';
import { addMinutes } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly passwordPolicy: PasswordPolicyService,
    private readonly securityEvents: SecurityEventsService,
    private readonly configService: ConfigService,
  ) {}

  private get maxFailedAttempts(): number {
    return Number(this.configService.get<number>('AUTH_MAX_FAILED_ATTEMPTS') ?? 5);
  }

  private get lockoutMinutes(): number {
    return Number(this.configService.get<number>('AUTH_LOCKOUT_MINUTES') ?? 15);
  }

  async login(
    dto: LoginRequestDto,
    context: { ipAddress?: string; userAgent?: string },
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(dto.username);
    if (!user) {
      await this.securityEvents.logEvent({
        type: SecurityEventType.LOGIN_FAILURE,
        success: false,
        username: dto.username,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { reason: 'USER_NOT_FOUND' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const now = new Date();
    if (user.lockoutUntil && user.lockoutUntil > now) {
      await this.securityEvents.logEvent({
        type: SecurityEventType.LOGIN_LOCKED,
        success: false,
        userId: user.id,
        username: user.username,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { lockoutUntil: user.lockoutUntil.toISOString() },
      });
      throw new UnauthorizedException('Account is locked. Please try again later.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      const failedAttempts = (user.failedLoginAttempts ?? 0) + 1;
      const update: any = { failedLoginAttempts: failedAttempts };
      let lockoutUntil = user.lockoutUntil;

      if (failedAttempts >= this.maxFailedAttempts) {
        lockoutUntil = addMinutes(now, this.lockoutMinutes);
        update.lockoutUntil = lockoutUntil;
        update.failedLoginAttempts = 0;
      }

      await this.usersService.update(user.id, update);

      await this.securityEvents.logEvent({
        type: lockoutUntil ? SecurityEventType.LOGIN_LOCKED : SecurityEventType.LOGIN_FAILURE,
        success: false,
        userId: user.id,
        username: user.username,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: lockoutUntil
          ? { reason: 'LOCKOUT_TRIGGERED', lockoutUntil: lockoutUntil.toISOString() }
          : { reason: 'PASSWORD_MISMATCH', failedAttempts },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        await this.securityEvents.logEvent({
          type: SecurityEventType.MFA_CHALLENGE_FAILED,
          success: false,
          userId: user.id,
          username: user.username,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: { reason: 'CODE_REQUIRED' },
        });
        throw new UnauthorizedException('MFA code required');
      }

      if (!user.mfaSecret || !authenticator.verify({ token: dto.mfaCode, secret: user.mfaSecret })) {
        await this.securityEvents.logEvent({
          type: SecurityEventType.MFA_CHALLENGE_FAILED,
          success: false,
          userId: user.id,
          username: user.username,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: { reason: 'CODE_INVALID' },
        });
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    await this.usersService.update(user.id, {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastLoginAt: now,
    });

    await this.securityEvents.logEvent({
      type: SecurityEventType.LOGIN_SUCCESS,
      success: true,
      userId: user.id,
      username: user.username,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    const payload = { username: user.username, sub: user.id, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(dto: RegisterRequestDto): Promise<{ id: number; username: string; role: string }> {
    const policyErrors = this.passwordPolicy.validate(dto.password);
    if (policyErrors.length) {
      throw new BadRequestException({ message: 'Password policy violation', errors: policyErrors });
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    const user = await this.usersService.create({
      username: dto.username,
      password: hashedPassword,
      passwordUpdatedAt: new Date(),
    });

    await this.securityEvents.logEvent({
      type: SecurityEventType.PASSWORD_CHANGED,
      success: true,
      userId: user.id,
      username: user.username,
      metadata: { source: 'REGISTER' },
    });

    return { id: user.id, username: user.username, role: user.role };
  }

  getPasswordPolicy() {
    return this.passwordPolicy.policy;
  }

  async prepareMfa(userId: number, context: { username: string; ipAddress?: string; userAgent?: string }) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(context.username, 'PropertyManagementSuite', secret);

    await this.usersService.update(userId, {
      mfaTempSecret: secret,
    });

    await this.securityEvents.logEvent({
      type: SecurityEventType.MFA_ENROLLMENT_STARTED,
      success: true,
      userId,
      username: context.username,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { secret, otpauthUrl };
  }

  async activateMfa(
    userId: number,
    code: string,
    context: { username: string; ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.usersService.findById(userId);
    if (!user?.mfaTempSecret) {
      throw new BadRequestException('No MFA enrollment in progress.');
    }

    const valid = authenticator.verify({ token: code, secret: user.mfaTempSecret });
    if (!valid) {
      await this.securityEvents.logEvent({
        type: SecurityEventType.MFA_CHALLENGE_FAILED,
        success: false,
        userId,
        username: context.username,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { reason: 'ACTIVATION_CODE_INVALID' },
      });
      throw new BadRequestException('Invalid verification code.');
    }

    await this.usersService.update(userId, {
      mfaSecret: user.mfaTempSecret,
      mfaTempSecret: null,
      mfaEnabled: true,
    });

    await this.securityEvents.logEvent({
      type: SecurityEventType.MFA_ENABLED,
      success: true,
      userId,
      username: context.username,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  async disableMfa(
    userId: number,
    code: string | undefined,
    context: { username: string; ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.usersService.findById(userId);
    if (!user?.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled.');
    }

    if (user.mfaSecret) {
      if (!code) {
        throw new BadRequestException('Verification code required to disable MFA.');
      }
      const valid = authenticator.verify({ token: code, secret: user.mfaSecret });
      if (!valid) {
        await this.securityEvents.logEvent({
          type: SecurityEventType.MFA_CHALLENGE_FAILED,
          success: false,
          userId,
          username: context.username,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: { reason: 'DISABLE_CODE_INVALID' },
        });
        throw new BadRequestException('Invalid verification code.');
      }
    }

    await this.usersService.update(userId, {
      mfaSecret: null,
      mfaTempSecret: null,
      mfaEnabled: false,
    });

    await this.securityEvents.logEvent({
      type: SecurityEventType.MFA_DISABLED,
      success: true,
      userId,
      username: context.username,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}



