import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { User } from '../entities/user.entity';
import { Role } from '@lol/shared';

dotenv.config({ path: join(__dirname, '../../../../../.env') });

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@tlslogistics.us';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'lol',
    password: process.env.POSTGRES_PASSWORD || 'lol_secret',
    database: process.env.POSTGRES_DB || 'lol_vnext',
    entities: [User],
  });

  await ds.initialize();
  const repo = ds.getRepository(User);

  const existing = await repo.findOne({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`✅ Admin user already exists: ${ADMIN_EMAIL}`);
    await ds.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = repo.create({
    email: ADMIN_EMAIL,
    firstName: 'Admin',
    lastName: 'LOL',
    passwordHash,
    role: Role.Admin,
  });

  await repo.save(admin);
  console.log(`✅ Admin user created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
