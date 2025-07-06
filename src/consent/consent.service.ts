import { Injectable } from '@nestjs/common';
import { CreateConsentDto } from './dto/create-consent.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';

@Injectable()
export class ConsentService {
  create(createConsentDto: CreateConsentDto) {
    return 'This action adds a new consent';
  }

  findAll() {
    return `This action returns all consent`;
  }

  findOne(id: number) {
    return `This action returns a #${id} consent`;
  }

  update(id: number, updateConsentDto: UpdateConsentDto) {
    return `This action updates a #${id} consent`;
  }

  remove(id: number) {
    return `This action removes a #${id} consent`;
  }
}
