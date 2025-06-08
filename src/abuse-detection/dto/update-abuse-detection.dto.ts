import { PartialType } from '@nestjs/swagger';
import { CreateAbuseDetectionDto } from './create-abuse-detection.dto';

export class UpdateAbuseDetectionDto extends PartialType(CreateAbuseDetectionDto) {}
