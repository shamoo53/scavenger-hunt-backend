import { Repository } from "typeorm";
import { RewardService } from "./reward.service";
import { Reward } from "./reward.entity";
import { TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

describe('RewardService', () => {
  let service: RewardService;
  let repo: Repository<Reward>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardService,
        {
          provide: getRepositoryToken(Reward),
          useValue: {
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RewardService>(RewardService);
    repo = module.get<Repository<Reward>>(getRepositoryToken(Reward));
  });

  it('should create a reward', async () => {
    const dto = { name: 'Test', type: 'NFT' };
    jest.spyOn(repo, 'save').mockResolvedValue({ id: 1, ...dto });
    const result = await service.create(dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('should update a reward', async () => {
    const dto = { name: 'Updated' };
    jest.spyOn(repo, 'update').mockResolvedValue({ affected: 1 });
    const result = await service.update(1, dto);
    expect(result).toEqual({ affected: 1 });
  });

  it('should delete a reward', async () => {
    jest.spyOn(repo, 'delete').mockResolvedValue({ affected: 1 });
    const result = await service.delete(1);
    expect(result).toEqual({ affected: 1 });
  });
});