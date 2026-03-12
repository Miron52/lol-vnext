import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '@lol/shared';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  const mockUser: User = {
    id: 'uuid-1',
    email: 'admin@tlslogistics.us',
    firstName: 'Admin',
    lastName: 'LOL',
    passwordHash: '', // set in beforeEach
    role: Role.Admin,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    mockUser.passwordHash = await bcrypt.hash('admin123', 10);

    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    };

    authService = new AuthService(
      usersService as UsersService,
      jwtService as JwtService,
    );
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      const result = await authService.validateUser('admin@tlslogistics.us', 'admin123');
      expect(result.id).toBe('uuid-1');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      await expect(
        authService.validateUser('nobody@tlslogistics.us', 'pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      await expect(
        authService.validateUser('admin@tlslogistics.us', 'wrongpass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return accessToken and user profile', async () => {
      const result = await authService.login(mockUser);
      expect(result.accessToken).toBe('signed-jwt-token');
      expect(result.user.email).toBe('admin@tlslogistics.us');
      expect(result.user.role).toBe(Role.Admin);
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('toProfile', () => {
    it('should strip passwordHash from user', () => {
      const profile = authService.toProfile(mockUser);
      expect(profile).not.toHaveProperty('passwordHash');
      expect(profile.id).toBe('uuid-1');
      expect(profile.role).toBe(Role.Admin);
    });
  });
});
