// src/departments/departments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, ILike } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { FilterDepartmentsDto } from './dto/filter-departments.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  async create(dto: CreateDepartmentDto): Promise<Department> {
    const department = this.departmentRepo.create(dto);
    return this.departmentRepo.save(department);
  }

  async findAll(filters: FilterDepartmentsDto) {
    const { search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where = search
      ? [{ name: ILike(`%${search}%`) }, { description: ILike(`%${search}%`) }]
      : {};

    const [data, total] = await this.departmentRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepo.findOne({ where: { id } });
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const department = await this.findOne(id);
    Object.assign(department, dto);
    return this.departmentRepo.save(department);
  }

  async delete(id: string): Promise<void> {
    const result = await this.departmentRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Department not found');
    }
  }
}
