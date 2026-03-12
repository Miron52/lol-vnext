import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Role } from '@lol/shared';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<AuthService>;
  let usersService: Partial<UsersService>;

  const mockUser = {
    id: 'uuid-1',
    email: 'admin@tlslogistics.us',
    firstName: 'Admin',
    lastName: 'LOL',
    passwordHash: 'hashed',
    role: Role.Admin,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockProfile = {
    id: 'uuid-1',
    email: 'admin@tlslogistics.us',
    firstName: 'Admin',
    lastName: 'LOL',
    role: Role.Admin,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      toProfile: jest.fn().mockReturnValue(mockProfile),
    };

    usersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/login', () => {
    it('should return token on valid credentials', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.login as jest.Mock).mockResolvedValue({
        accessToken: 'jwt-token',
        user: mockProfile,
      });

      const result = await controller.login({
        email: 'admin@tlslogistics.us',
        password: 'admin123',
      });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.role).toBe(Role.Admin);
    });

    it('should throw on invalid credentials', async () => {
      (authService.validateUser as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        controller.login({ email: 'bad@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user profile', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.me({
        sub: 'uuid-1',
        email: 'admin@tlslogistics.us',
        role: 'admin',
      });

      expect(result.id).toBe('uuid-1');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('GET /auth/admin-check', () => {
    it('should return success message', () => {
      const result = controller.adminCheck();
      expect(result.message).toBe('You have admin access');
    });
  });
});
