import { Test, TestingModule } from '@nestjs/testing';
import { StatementsController } from './statements.controller';
import { StatementsService } from './statements.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';

describe('StatementsController', () => {
  let controller: StatementsController;
  let service: Partial<StatementsService>;

  const mockArchive = [{ id: 'stmt-1', weekLabel: 'LS2026-11' }];
  const mockStatement = {
    id: 'stmt-1',
    statementType: 'driver',
    weekLabel: 'LS2026-11',
    snapshot: { loads: [], totals: {} },
  };

  beforeEach(async () => {
    service = {
      listArchive: jest.fn().mockResolvedValue(mockArchive),
      preview: jest.fn().mockResolvedValue(mockStatement),
      generate: jest.fn().mockResolvedValue(mockStatement),
      findById: jest.fn().mockResolvedValue(mockStatement),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatementsController],
      providers: [{ provide: StatementsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StatementsController>(StatementsController);
  });

  it('should list archive', async () => {
    const result = await controller.list();
    expect(service.listArchive).toHaveBeenCalled();
    expect(result).toEqual(mockArchive);
  });

  it('should preview a statement', async () => {
    const req = { user: { id: 'u1' } };
    const result = await controller.preview(
      { statementType: 'driver' as any, weekId: 'w1' },
      req,
    );
    expect(service.preview).toHaveBeenCalledWith(
      { statementType: 'driver', weekId: 'w1' },
      'u1',
    );
    expect(result).toEqual(mockStatement);
  });

  it('should generate a statement', async () => {
    const req = { user: { id: 'u1' } };
    const result = await controller.generate(
      { statementType: 'owner' as any, weekId: 'w1' },
      req,
    );
    expect(service.generate).toHaveBeenCalled();
  });

  it('should fetch by id', async () => {
    const result = await controller.findById('stmt-1');
    expect(service.findById).toHaveBeenCalledWith('stmt-1');
  });
});
