import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get('POSTGRES_USER', 'lol'),
        password: config.get('POSTGRES_PASSWORD', 'lol_secret'),
        database: config.get('POSTGRES_DB', 'lol_vnext'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [join(__dirname, 'migrations/*.{ts,js}')],
        // DEV ONLY: auto-run pending migrations on app startup.
        // For production, set to false and run migrations explicitly via CI/CD
        // using: npm run migration:run -w packages/api
        migrationsRun: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
