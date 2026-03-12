import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '@lol/shared';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  function createMockContext(userRole: string | null): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { sub: '1', email: 'a@b.com', role: userRole } : null,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createMockContext('dispatcher'))).toBe(true);
  });

  it('should allow access when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(guard.canActivate(createMockContext('admin'))).toBe(true);
  });

  it('should deny access when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(guard.canActivate(createMockContext('dispatcher'))).toBe(false);
  });

  it('should deny access when no user on request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(guard.canActivate(createMockContext(null))).toBe(false);
  });

  // ── Permission matrix verification ──

  it('should allow Admin+Accountant for salary-rules endpoints', () => {
    const roles = [Role.Admin, Role.Accountant];
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
    expect(guard.canActivate(createMockContext('admin'))).toBe(true);
    expect(guard.canActivate(createMockContext('accountant'))).toBe(true);
    expect(guard.canActivate(createMockContext('dispatcher'))).toBe(false);
    expect(guard.canActivate(createMockContext('assistant'))).toBe(false);
  });

  it('should allow Admin+Accountant+Dispatcher for read-level salary endpoints', () => {
    const roles = [Role.Admin, Role.Accountant, Role.Dispatcher];
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
    expect(guard.canActivate(createMockContext('admin'))).toBe(true);
    expect(guard.canActivate(createMockContext('accountant'))).toBe(true);
    expect(guard.canActivate(createMockContext('dispatcher'))).toBe(true);
    expect(guard.canActivate(createMockContext('assistant'))).toBe(false);
  });

  it('should deny Assistant for archive endpoints (Admin+Accountant only)', () => {
    const roles = [Role.Admin, Role.Accountant];
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
    expect(guard.canActivate(createMockContext('assistant'))).toBe(false);
    expect(guard.canActivate(createMockContext('dispatcher'))).toBe(false);
  });
});
