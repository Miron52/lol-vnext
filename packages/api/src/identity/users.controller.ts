import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService, CreateUserDto } from './users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from '@lol/shared';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** List all users (Admin only) */
  @Get()
  @Roles(Role.Admin)
  async list() {
    return this.usersService.listAll();
  }

  /** Create a new user (Admin only) */
  @Post()
  @Roles(Role.Admin)
  async create(@Body() body: CreateUserDto) {
    return this.usersService.createUser(body);
  }
}
