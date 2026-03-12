import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Statement } from './entities/statement.entity';
import { Load } from '../load/entities/load.entity';
import { Week } from '../week/entities/week.entity';
import { User } from '../identity/entities/user.entity';
import { StatementsService } from './statements.service';
import { StatementsController } from './statements.controller';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Statement, Load, Week, User]),
    IdentityModule,
  ],
  controllers: [StatementsController],
  providers: [StatementsService],
})
export class StatementModule {}
