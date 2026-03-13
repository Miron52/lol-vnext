/**
 * seed-production.ts — Populate the database with realistic production-scale data.
 *
 * Creates:
 *   - 6 users (admin + accountant + 4 dispatchers + 1 assistant)
 *   - 10 drivers, 8 units, 12 brokerages
 *   - 12 weeks (W1..W12 of 2026)
 *   - ~200+ loads with diverse statuses, flags, routes
 *   - 1 active salary rule set
 *
 * Idempotent: re-running is safe — existing records are skipped.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register packages/api/src/database/seed-production.ts
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
import { Driver } from '../master-data/entities/driver.entity';
import { Unit } from '../master-data/entities/unit.entity';
import { Brokerage } from '../master-data/entities/brokerage.entity';
import { Role, LoadStatus } from '@lol/shared';

dotenv.config({ path: join(__dirname, '../../../../.env') });

/* ────── helpers ────── */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** ISO week → Monday date string */
function isoWeekToMonday(isoYear: number, isoWeek: number): Date {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
  const result = new Date(firstMonday);
  result.setUTCDate(firstMonday.getUTCDate() + (isoWeek - 1) * 7);
  return result;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'lol',
    password: process.env.POSTGRES_PASSWORD || 'lol_secret',
    database: process.env.POSTGRES_DB || 'lol_vnext',
    entities: [User, Week, Load, SalaryRule, Driver, Unit, Brokerage],
    synchronize: false,
  });

  await ds.initialize();
  console.log('Connected to database.\n');

  const userRepo = ds.getRepository(User);
  const weekRepo = ds.getRepository(Week);
  const loadRepo = ds.getRepository(Load);
  const ruleRepo = ds.getRepository(SalaryRule);
  const driverRepo = ds.getRepository(Driver);
  const unitRepo = ds.getRepository(Unit);
  const brokerageRepo = ds.getRepository(Brokerage);

  const hash = await bcrypt.hash('password123', 10);

  // ═══════════════════════════════════════════════════════════════════
  // 1. USERS — admin, accountant, 4 dispatchers, 1 assistant
  // ═══════════════════════════════════════════════════════════════════
  const userData = [
    { email: 'admin@tlslogistics.us', firstName: 'Admin', lastName: 'LOL', role: Role.Admin },
    { email: 'natalie.ivanova@tlslogistics.us', firstName: 'Natalie', lastName: 'Ivanova', role: Role.Accountant },
    { email: 'alex.petrov@tlslogistics.us', firstName: 'Alex', lastName: 'Petrov', role: Role.Dispatcher },
    { email: 'maria.gonzalez@tlslogistics.us', firstName: 'Maria', lastName: 'Gonzalez', role: Role.Dispatcher },
    { email: 'james.chen@tlslogistics.us', firstName: 'James', lastName: 'Chen', role: Role.Dispatcher },
    { email: 'anna.kowalski@tlslogistics.us', firstName: 'Anna', lastName: 'Kowalski', role: Role.Dispatcher },
    { email: 'sarah.miller@tlslogistics.us', firstName: 'Sarah', lastName: 'Miller', role: Role.Assistant },
  ];

  const users: Record<string, User> = {};
  for (const u of userData) {
    let existing = await userRepo.findOne({ where: { email: u.email } });
    if (!existing) {
      existing = await userRepo.save(
        userRepo.create({ ...u, passwordHash: hash }),
      );
      console.log(`✅ User created: ${u.firstName} ${u.lastName} (${u.role})`);
    } else {
      console.log(`ℹ️  User exists: ${u.firstName} ${u.lastName}`);
    }
    users[u.email] = existing;
  }

  const admin = users['admin@tlslogistics.us'];
  const dispatchers = [
    users['alex.petrov@tlslogistics.us'],
    users['maria.gonzalez@tlslogistics.us'],
    users['james.chen@tlslogistics.us'],
    users['anna.kowalski@tlslogistics.us'],
  ];

  // ═══════════════════════════════════════════════════════════════════
  // 2. MASTER DATA — drivers, units, brokerages
  // ═══════════════════════════════════════════════════════════════════
  const driverData = [
    { firstName: 'Viktor', lastName: 'Kovalenko', phone: '+1-214-555-0101' },
    { firstName: 'Dmitry', lastName: 'Sokolov', phone: '+1-312-555-0102' },
    { firstName: 'Miguel', lastName: 'Rodriguez', phone: '+1-713-555-0103' },
    { firstName: 'John', lastName: 'Williams', phone: '+1-404-555-0104' },
    { firstName: 'Oleg', lastName: 'Bondarenko', phone: '+1-305-555-0105' },
    { firstName: 'Carlos', lastName: 'Martinez', phone: '+1-206-555-0106' },
    { firstName: 'Ivan', lastName: 'Zhukov', phone: '+1-303-555-0107' },
    { firstName: 'Robert', lastName: 'Johnson', phone: '+1-615-555-0108' },
    { firstName: 'Andrei', lastName: 'Popov', phone: '+1-816-555-0109' },
    { firstName: 'Tony', lastName: 'Nguyen', phone: '+1-602-555-0110' },
  ];

  const drivers: Driver[] = [];
  for (const d of driverData) {
    let existing = await driverRepo.findOne({ where: { firstName: d.firstName, lastName: d.lastName } });
    if (!existing) {
      existing = await driverRepo.save(driverRepo.create(d));
      console.log(`✅ Driver created: ${d.firstName} ${d.lastName}`);
    } else {
      console.log(`ℹ️  Driver exists: ${d.firstName} ${d.lastName}`);
    }
    drivers.push(existing);
  }

  const unitData = [
    { unitNumber: 'TLS-001', make: 'Freightliner', year: 2022, vin: '1FUJGLDR8NLAB1001' },
    { unitNumber: 'TLS-002', make: 'Kenworth', year: 2023, vin: '1XKYD49X7NJ351002' },
    { unitNumber: 'TLS-003', make: 'Peterbilt', year: 2021, vin: '1XPWD40X6ND451003' },
    { unitNumber: 'TLS-004', make: 'Volvo', year: 2023, vin: '4V4NC9EH5PN801004' },
    { unitNumber: 'TLS-005', make: 'Freightliner', year: 2024, vin: '1FUJGLDR0PLAB5005' },
    { unitNumber: 'TLS-006', make: 'Kenworth', year: 2022, vin: '1XKYD49X9NJ356006' },
    { unitNumber: 'TLS-007', make: 'International', year: 2023, vin: '3HSDJAPR5NN507007' },
    { unitNumber: 'TLS-008', make: 'Mack', year: 2024, vin: '1M1AN07Y5PM008008' },
  ];

  const units: Unit[] = [];
  for (const u of unitData) {
    let existing = await unitRepo.findOne({ where: { unitNumber: u.unitNumber } });
    if (!existing) {
      existing = await unitRepo.save(unitRepo.create(u));
      console.log(`✅ Unit created: ${u.unitNumber} (${u.make} ${u.year})`);
    } else {
      console.log(`ℹ️  Unit exists: ${u.unitNumber}`);
    }
    units.push(existing);
  }

  const brokerageData = [
    { name: 'CH Robinson', mcNumber: 'MC-128930' },
    { name: 'TQL (Total Quality Logistics)', mcNumber: 'MC-354742' },
    { name: 'XPO Logistics', mcNumber: 'MC-166580' },
    { name: 'Coyote Logistics', mcNumber: 'MC-389478' },
    { name: 'Echo Global Logistics', mcNumber: 'MC-447498' },
    { name: 'Landstar System', mcNumber: 'MC-143855' },
    { name: 'JB Hunt Transport', mcNumber: 'MC-104735' },
    { name: 'Schneider National', mcNumber: 'MC-133655' },
    { name: 'Werner Enterprises', mcNumber: 'MC-141010' },
    { name: 'RXO (formerly XPO)', mcNumber: 'MC-987632' },
    { name: 'Uber Freight', mcNumber: 'MC-973700' },
    { name: 'Amazon Freight', mcNumber: 'MC-934210' },
  ];

  const brokerages: Brokerage[] = [];
  for (const b of brokerageData) {
    let existing = await brokerageRepo.findOne({ where: { name: b.name } });
    if (!existing) {
      existing = await brokerageRepo.save(brokerageRepo.create(b));
      console.log(`✅ Brokerage created: ${b.name}`);
    } else {
      console.log(`ℹ️  Brokerage exists: ${b.name}`);
    }
    brokerages.push(existing);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 3. WEEKS — W1 through W12 of 2026 (Jan 5 – Mar 22)
  // ═══════════════════════════════════════════════════════════════════
  const weeks: Week[] = [];
  for (let w = 1; w <= 12; w++) {
    const monday = isoWeekToMonday(2026, w);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const label = `LS2026-${String(w).padStart(2, '0')}`;

    let existing = await weekRepo.findOne({ where: { label } });
    if (!existing) {
      existing = await weekRepo.save(
        weekRepo.create({
          label,
          isoYear: 2026,
          isoWeek: w,
          startDate: dateStr(monday),
          endDate: dateStr(sunday),
        }),
      );
      console.log(`✅ Week created: ${label} (${dateStr(monday)} – ${dateStr(sunday)})`);
    } else {
      console.log(`ℹ️  Week exists: ${label}`);
    }
    weeks.push(existing);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 4. LOADS — ~200+ across 12 weeks, realistic routes
  // ═══════════════════════════════════════════════════════════════════
  const existingLoadCount = await loadRepo.count();
  if (existingLoadCount > 30) {
    console.log(`\nℹ️  ${existingLoadCount} loads already exist — skipping load seed.`);
  } else {
    // If only demo loads exist, remove them to replace with production data
    if (existingLoadCount > 0) {
      await loadRepo.delete({});
      console.log(`🗑️  Cleared ${existingLoadCount} existing demo loads.`);
    }

    const routes = [
      // Texas corridors
      { from: 'Dallas, TX', fromState: 'TX', to: 'Houston, TX', toState: 'TX', miles: 240 },
      { from: 'Houston, TX', fromState: 'TX', to: 'San Antonio, TX', toState: 'TX', miles: 197 },
      { from: 'Dallas, TX', fromState: 'TX', to: 'Jackson, MS', toState: 'MS', miles: 420 },
      { from: 'El Paso, TX', fromState: 'TX', to: 'Dallas, TX', toState: 'TX', miles: 637 },
      // Midwest
      { from: 'Chicago, IL', fromState: 'IL', to: 'Indianapolis, IN', toState: 'IN', miles: 180 },
      { from: 'Chicago, IL', fromState: 'IL', to: 'Detroit, MI', toState: 'MI', miles: 282 },
      { from: 'Minneapolis, MN', fromState: 'MN', to: 'Chicago, IL', toState: 'IL', miles: 410 },
      { from: 'Kansas City, MO', fromState: 'MO', to: 'St. Louis, MO', toState: 'MO', miles: 250 },
      // Southeast
      { from: 'Atlanta, GA', fromState: 'GA', to: 'Nashville, TN', toState: 'TN', miles: 250 },
      { from: 'Miami, FL', fromState: 'FL', to: 'Orlando, FL', toState: 'FL', miles: 235 },
      { from: 'Charlotte, NC', fromState: 'NC', to: 'Atlanta, GA', toState: 'GA', miles: 245 },
      { from: 'Jacksonville, FL', fromState: 'FL', to: 'Savannah, GA', toState: 'GA', miles: 140 },
      // West coast
      { from: 'Los Angeles, CA', fromState: 'CA', to: 'Phoenix, AZ', toState: 'AZ', miles: 370 },
      { from: 'Seattle, WA', fromState: 'WA', to: 'Portland, OR', toState: 'OR', miles: 175 },
      { from: 'Sacramento, CA', fromState: 'CA', to: 'Reno, NV', toState: 'NV', miles: 135 },
      { from: 'Los Angeles, CA', fromState: 'CA', to: 'Las Vegas, NV', toState: 'NV', miles: 270 },
      // Long haul
      { from: 'Denver, CO', fromState: 'CO', to: 'Kansas City, MO', toState: 'MO', miles: 600 },
      { from: 'Memphis, TN', fromState: 'TN', to: 'Dallas, TX', toState: 'TX', miles: 452 },
      { from: 'New Orleans, LA', fromState: 'LA', to: 'Houston, TX', toState: 'TX', miles: 350 },
      { from: 'Salt Lake City, UT', fromState: 'UT', to: 'Denver, CO', toState: 'CO', miles: 525 },
      { from: 'Philadelphia, PA', fromState: 'PA', to: 'Columbus, OH', toState: 'OH', miles: 472 },
      { from: 'Louisville, KY', fromState: 'KY', to: 'Cincinnati, OH', toState: 'OH', miles: 100 },
    ];

    const businesses = [
      'Walmart Distribution', 'FedEx Freight', 'Amazon Logistics',
      'Home Depot Supply', 'Costco Wholesale', 'Target Stores',
      'Tyson Foods', 'PepsiCo Beverages', 'General Mills',
      'Procter & Gamble', 'Tesla Parts', 'John Deere',
      'Caterpillar Inc', 'Sysco Corporation', 'US Foods',
    ];

    const netsuiteRefs = ['NS-', 'INV-', 'PO-'];

    let loadNum = 1;
    let totalLoads = 0;

    for (const week of weeks) {
      // Each dispatcher gets 3–6 loads per week (heavier weeks = more revenue)
      for (const disp of dispatchers) {
        const loadCount = rand(3, 6);

        for (let i = 0; i < loadCount; i++) {
          const route = pick(routes);
          const business = pick(businesses);
          const brokerage = pick(brokerages);
          const driver = pick(drivers);
          const unit = pick(units);

          // Revenue varies: $1,500 – $12,000 per load
          const gross = rand(1500, 12000);
          // Driver cost: 45–75% of gross (variance by route type)
          const driverPct = 0.45 + Math.random() * 0.30;
          const driverCost = Math.round(gross * driverPct);
          const profit = gross - driverCost;
          const profitPercent = gross > 0 ? round2((profit / gross) * 100) : 0;
          const otr = round2(gross * 0.0125);
          const netProfit = round2(profit - otr);

          // Determine load status based on week position
          const weekIdx = weeks.indexOf(week);
          let loadStatus: LoadStatus;
          if (weekIdx < weeks.length - 2) {
            // Older weeks: mostly completed, some cancelled
            loadStatus = Math.random() < 0.05 ? LoadStatus.Cancelled : LoadStatus.Completed;
          } else if (weekIdx === weeks.length - 2) {
            // Second-to-last week: mix
            const r = Math.random();
            if (r < 0.65) loadStatus = LoadStatus.Completed;
            else if (r < 0.80) loadStatus = LoadStatus.Delivered;
            else if (r < 0.90) loadStatus = LoadStatus.InTransit;
            else loadStatus = LoadStatus.NotPickedUp;
          } else {
            // Current week: active mix
            const r = Math.random();
            if (r < 0.25) loadStatus = LoadStatus.Completed;
            else if (r < 0.45) loadStatus = LoadStatus.Delivered;
            else if (r < 0.70) loadStatus = LoadStatus.InTransit;
            else loadStatus = LoadStatus.NotPickedUp;
          }

          // Flags — realistic distribution
          const quickPayFlag = Math.random() < 0.15;
          const factoringFlag = !quickPayFlag && Math.random() < 0.25;
          const directPaymentFlag = !quickPayFlag && !factoringFlag && Math.random() < 0.10;
          const driverPaidFlag = loadStatus === LoadStatus.Completed && Math.random() < 0.85;

          // Date within the week (Mon–Fri)
          const dateOffset = rand(0, 4);
          const loadDate = new Date(week.startDate);
          loadDate.setDate(loadDate.getDate() + dateOffset);
          const date = dateStr(loadDate);

          const fromDateObj = new Date(date);
          const transitDays = Math.ceil(route.miles / 500) || 1;
          const toDateObj = new Date(date);
          toDateObj.setDate(toDateObj.getDate() + transitDays);

          const sylNumber = `TLS26-${String(week.isoWeek).padStart(2, '0')}-${String(loadNum).padStart(3, '0')}`;

          // Some loads have Netsuite refs (60%)
          const netsuiteRef = Math.random() < 0.6
            ? `${pick(netsuiteRefs)}${2026}${String(week.isoWeek).padStart(2, '0')}-${rand(1000, 9999)}`
            : null;

          // Some loads come from external source (30%)
          const isExternal = Math.random() < 0.3;
          const externalSource = isExternal ? 'cargo_etl' : null;
          const externalLoadKey = isExternal ? `CRG-${rand(100000, 999999)}` : null;

          const comment = loadStatus === LoadStatus.Cancelled
            ? pick(['Shipper cancelled', 'Driver no-show', 'Weather delay — cancelled', 'Rate dispute'])
            : Math.random() < 0.15
              ? pick(['Detention 2h at pickup', 'TONU applied', 'Lumper fee included', 'Deadhead 45mi', 'Team drivers needed'])
              : null;

          await loadRepo.save(
            loadRepo.create({
              sylNumber,
              weekId: week.id,
              date,
              dispatcherId: disp.id,
              businessName: business,
              brokerageId: brokerage.id,
              driverId: driver.id,
              unitId: unit.id,
              netsuiteRef,
              fromAddress: route.from,
              fromState: route.fromState,
              fromDate: date,
              toAddress: route.to,
              toState: route.toState,
              toDate: dateStr(toDateObj),
              miles: route.miles,
              grossAmount: gross,
              driverCostAmount: driverCost,
              profitAmount: profit,
              profitPercent,
              otrAmount: otr,
              netProfitAmount: netProfit,
              loadStatus,
              quickPayFlag,
              directPaymentFlag,
              factoringFlag,
              driverPaidFlag,
              auditSource: isExternal ? 'webhook' : 'manual',
              externalSource,
              externalLoadKey,
              comment,
            }),
          );
          loadNum++;
          totalLoads++;
        }
      }
    }
    console.log(`\n✅ ${totalLoads} loads created across ${weeks.length} weeks`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 5. SALARY RULE — tiered commission structure
  // ═══════════════════════════════════════════════════════════════════
  const existingRule = await ruleRepo.findOne({ where: { isActive: true } });
  if (!existingRule) {
    await ruleRepo.save(
      ruleRepo.create({
        name: 'Standard Tiers 2026',
        version: 1,
        isActive: true,
        effectiveFrom: '2026-01-01',
        applicationMode: 'flat_rate',
        salaryBase: 'gross_profit',
        tiers: [
          { tierOrder: 1, minProfit: 0, maxProfit: 5000, percent: 8 },
          { tierOrder: 2, minProfit: 5000, maxProfit: 10000, percent: 10 },
          { tierOrder: 3, minProfit: 10000, maxProfit: 20000, percent: 12 },
          { tierOrder: 4, minProfit: 20000, maxProfit: null, percent: 15 },
        ],
        createdById: admin.id,
        createdByName: `${admin.firstName} ${admin.lastName}`,
      }),
    );
    console.log('✅ Salary rule set created: Standard Tiers 2026');
  } else {
    console.log(`ℹ️  Active salary rule exists: ${existingRule.name}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════
  const counts = {
    users: await userRepo.count(),
    drivers: await driverRepo.count(),
    units: await unitRepo.count(),
    brokerages: await brokerageRepo.count(),
    weeks: await weekRepo.count(),
    loads: await loadRepo.count(),
    salaryRules: await ruleRepo.count(),
  };

  console.log('\n════════════════════════════════════════');
  console.log('  Production seed complete!');
  console.log('════════════════════════════════════════');
  console.log(`  Users:       ${counts.users}`);
  console.log(`  Drivers:     ${counts.drivers}`);
  console.log(`  Units:       ${counts.units}`);
  console.log(`  Brokerages:  ${counts.brokerages}`);
  console.log(`  Weeks:       ${counts.weeks}`);
  console.log(`  Loads:       ${counts.loads}`);
  console.log(`  Salary Rules: ${counts.salaryRules}`);
  console.log('════════════════════════════════════════\n');

  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
