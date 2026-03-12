/**
 * seed-demo.ts — Populate the database with realistic demo data.
 *
 * Creates: 4 dispatchers, 4 weeks, ~24 loads, 1 active salary rule set.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register packages/api/src/database/seed-demo.ts
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { User } from '../identity/entities/user.entity';
import { Week } from '../week/entities/week.entity';
import { Load } from '../load/entities/load.entity';
import { SalaryRule } from '../salary-rule/entities/salary-rule.entity';
import { Role, LoadStatus } from '@lol/shared';

dotenv.config({ path: join(__dirname, '../../../../.env') });

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'lol',
    password: process.env.POSTGRES_PASSWORD || 'lol_secret',
    database: process.env.POSTGRES_DB || 'lol_vnext',
    entities: [User, Week, Load, SalaryRule],
    synchronize: false,
  });

  await ds.initialize();
  console.log('Connected to database.');

  const userRepo = ds.getRepository(User);
  const weekRepo = ds.getRepository(Week);
  const loadRepo = ds.getRepository(Load);
  const ruleRepo = ds.getRepository(SalaryRule);

  // ── 1. Admin (skip if exists) ──────────────────────────────────
  let admin = await userRepo.findOne({ where: { email: 'admin@tlslogistics.us' } });
  if (!admin) {
    admin = userRepo.create({
      email: 'admin@tlslogistics.us',
      firstName: 'Admin',
      lastName: 'LOL',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: Role.Admin,
    });
    admin = await userRepo.save(admin);
    console.log('✅ Admin created');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // ── 2. Dispatchers ─────────────────────────────────────────────
  const dispatcherData = [
    { email: 'alex.petrov@tlslogistics.us', firstName: 'Alex', lastName: 'Petrov' },
    { email: 'maria.gonzalez@tlslogistics.us', firstName: 'Maria', lastName: 'Gonzalez' },
    { email: 'james.chen@tlslogistics.us', firstName: 'James', lastName: 'Chen' },
    { email: 'anna.kowalski@tlslogistics.us', firstName: 'Anna', lastName: 'Kowalski' },
  ];

  const dispatchers: User[] = [];
  const hash = await bcrypt.hash('password123', 10);

  for (const d of dispatcherData) {
    let existing = await userRepo.findOne({ where: { email: d.email } });
    if (!existing) {
      existing = await userRepo.save(
        userRepo.create({ ...d, passwordHash: hash, role: Role.Dispatcher }),
      );
      console.log(`✅ Dispatcher created: ${d.firstName} ${d.lastName}`);
    } else {
      console.log(`ℹ️  Dispatcher exists: ${d.firstName} ${d.lastName}`);
    }
    dispatchers.push(existing);
  }

  // ── 3. Weeks (W10, W11, W12, W13 of 2026) ─────────────────────
  const weekData = [
    { label: 'LS2026-10', isoYear: 2026, isoWeek: 10, startDate: '2026-03-02', endDate: '2026-03-08' },
    { label: 'LS2026-11', isoYear: 2026, isoWeek: 11, startDate: '2026-03-09', endDate: '2026-03-15' },
    { label: 'LS2026-12', isoYear: 2026, isoWeek: 12, startDate: '2026-03-16', endDate: '2026-03-22' },
    { label: 'LS2026-13', isoYear: 2026, isoWeek: 13, startDate: '2026-03-23', endDate: '2026-03-29' },
  ];

  const weeks: Week[] = [];
  for (const w of weekData) {
    let existing = await weekRepo.findOne({ where: { label: w.label } });
    if (!existing) {
      existing = await weekRepo.save(weekRepo.create(w));
      console.log(`✅ Week created: ${w.label}`);
    } else {
      console.log(`ℹ️  Week exists: ${w.label}`);
    }
    weeks.push(existing);
  }

  // ── 4. Loads ───────────────────────────────────────────────────
  // Check if loads already exist for these weeks
  const existingLoadCount = await loadRepo.count({
    where: weeks.map((w) => ({ weekId: w.id })),
  });

  if (existingLoadCount > 0) {
    console.log(`ℹ️  ${existingLoadCount} loads already exist, skipping load seed.`);
  } else {
    const routes = [
      { from: 'Dallas, TX', fromState: 'TX', to: 'Jackson, MS', toState: 'MS', miles: 420 },
      { from: 'Chicago, IL', fromState: 'IL', to: 'Indianapolis, IN', toState: 'IN', miles: 180 },
      { from: 'Los Angeles, CA', fromState: 'CA', to: 'Phoenix, AZ', toState: 'AZ', miles: 370 },
      { from: 'Atlanta, GA', fromState: 'GA', to: 'Nashville, TN', toState: 'TN', miles: 250 },
      { from: 'Houston, TX', fromState: 'TX', to: 'New Orleans, LA', toState: 'LA', miles: 350 },
      { from: 'Denver, CO', fromState: 'CO', to: 'Kansas City, MO', toState: 'MO', miles: 600 },
      { from: 'Miami, FL', fromState: 'FL', to: 'Orlando, FL', toState: 'FL', miles: 235 },
      { from: 'Seattle, WA', fromState: 'WA', to: 'Portland, OR', toState: 'OR', miles: 175 },
    ];

    const businesses = ['FedEx Freight', 'Swift Transport', 'Werner Logistics', 'JB Hunt', 'XPO Logistics', 'Old Dominion'];

    let loadNum = 1;

    for (const week of weeks) {
      for (const disp of dispatchers) {
        // Each dispatcher gets 2–3 loads per week
        const loadCount = 2 + Math.floor(Math.random() * 2); // 2 or 3

        for (let i = 0; i < loadCount; i++) {
          const route = routes[(loadNum - 1) % routes.length];
          const business = businesses[(loadNum - 1) % businesses.length];
          const gross = 2000 + Math.round(Math.random() * 6000); // $2,000 – $8,000
          const driverCost = Math.round(gross * (0.5 + Math.random() * 0.2)); // 50–70% of gross
          const profit = gross - driverCost;
          const profitPercent = gross > 0 ? Math.round((profit / gross) * 10000) / 100 : 0;
          const otr = Math.round(gross * 0.0125 * 100) / 100;
          const netProfit = Math.round((profit - otr) * 100) / 100;

          const sylNumber = `TLS26-${week.isoWeek}-${String(loadNum).padStart(2, '0')}`;
          const dateOffset = Math.floor(Math.random() * 5); // Mon–Fri
          const loadDate = new Date(week.startDate);
          loadDate.setDate(loadDate.getDate() + dateOffset);
          const dateStr = loadDate.toISOString().slice(0, 10);

          const fromDateObj = new Date(dateStr);
          const toDateObj = new Date(dateStr);
          toDateObj.setDate(toDateObj.getDate() + 1);

          await loadRepo.save(
            loadRepo.create({
              sylNumber,
              weekId: week.id,
              date: dateStr,
              dispatcherId: disp.id,
              businessName: business,
              fromAddress: route.from,
              fromState: route.fromState,
              fromDate: dateStr,
              toAddress: route.to,
              toState: route.toState,
              toDate: toDateObj.toISOString().slice(0, 10),
              miles: route.miles,
              grossAmount: gross,
              driverCostAmount: driverCost,
              profitAmount: profit,
              profitPercent,
              otrAmount: otr,
              netProfitAmount: netProfit,
              loadStatus: LoadStatus.Completed,
              auditSource: 'manual',
              externalSource: null,
              externalLoadKey: null,
              unitId: null,
              driverId: null,
              brokerageId: null,
              netsuiteRef: null,
              comment: null,
              quickPayFlag: false,
              directPaymentFlag: false,
              factoringFlag: false,
              driverPaidFlag: false,
            }),
          );
          loadNum++;
        }
      }
    }
    console.log(`✅ ${loadNum - 1} loads created across ${weeks.length} weeks`);
  }

  // ── 5. Salary Rule Set ─────────────────────────────────────────
  const existingRule = await ruleRepo.findOne({ where: { isActive: true } });
  if (!existingRule) {
    await ruleRepo.save(
      ruleRepo.create({
        name: 'Standard Tiers 2026',
        version: 1,
        isActive: true,
        effectiveFrom: '2026-03-01',
        applicationMode: 'flat_rate',
        salaryBase: 'gross_profit',
        tiers: [
          { tierOrder: 1, minProfit: 0, maxProfit: 5000, percent: 8 },
          { tierOrder: 2, minProfit: 5000, maxProfit: 10000, percent: 10 },
          { tierOrder: 3, minProfit: 10000, maxProfit: 20000, percent: 12 },
          { tierOrder: 4, minProfit: 20000, maxProfit: null, percent: 15 },
        ],
        createdById: admin!.id,
        createdByName: `${admin!.firstName} ${admin!.lastName}`,
      }),
    );
    console.log('✅ Salary rule set created: Standard Tiers 2026');
  } else {
    console.log(`ℹ️  Active salary rule exists: ${existingRule.name}`);
  }

  console.log('\n🎉 Demo seed complete!');
  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
