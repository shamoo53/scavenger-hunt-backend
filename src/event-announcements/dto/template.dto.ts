import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsJSON,
  IsUUID,
  MaxLength,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AnnouncementType,
  AnnouncementPriority,
} from '../enums/announcement.enum';
import { TemplateCategory } from '../entities/announcement-template.entity';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @IsEnum(AnnouncementType)
  type: AnnouncementType;

  @IsEnum(AnnouncementPriority)
  priority: AnnouncementPriority;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titleTemplate: string;

  @IsString()
  @IsNotEmpty()
  contentTemplate: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summaryTemplate?: string;

  @IsOptional()
  @IsJSON()
  variables?: Record<
    string,
    {
      type: 'string' | 'number' | 'date' | 'boolean' | 'url' | 'email';
      required: boolean;
      defaultValue?: any;
      description?: string;
      placeholder?: string;
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        options?: string[];
      };
    }
  >;

  @IsOptional()
  @IsJSON()
  defaultSettings?: {
    isActive?: boolean;
    isPinned?: boolean;
    isFeatured?: boolean;
    requiresAcknowledgment?: boolean;
    allowComments?: boolean;
    notifyUsers?: boolean;
    targetAudience?: string[];
    tags?: string[];
  };

  @IsOptional()
  @IsJSON()
  styling?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    iconUrl?: string;
    bannerUrl?: string;
    customCSS?: string;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsUUID()
  createdBy: string;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleTemplate?: string;

  @IsOptional()
  @IsString()
  contentTemplate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summaryTemplate?: string;

  @IsOptional()
  @IsJSON()
  variables?: Record<
    string,
    {
      type: 'string' | 'number' | 'date' | 'boolean' | 'url' | 'email';
      required: boolean;
      defaultValue?: any;
      description?: string;
      placeholder?: string;
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        options?: string[];
      };
    }
  >;

  @IsOptional()
  @IsJSON()
  defaultSettings?: {
    isActive?: boolean;
    isPinned?: boolean;
    isFeatured?: boolean;
    requiresAcknowledgment?: boolean;
    allowComments?: boolean;
    notifyUsers?: boolean;
    targetAudience?: string[];
    tags?: string[];
  };

  @IsOptional()
  @IsJSON()
  styling?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    iconUrl?: string;
    bannerUrl?: string;
    customCSS?: string;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsUUID()
  updatedBy: string;
}

export class GenerateFromTemplateDto {
  @IsUUID()
  templateId: string;

  @IsJSON()
  variables: Record<string, any>;

  @IsOptional()
  @IsJSON()
  overrides?: {
    summary?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    eventDate?: Date;
    location?: string;
    eventUrl?: string;
    registrationUrl?: string;
    imageUrl?: string;
    bannerUrl?: string;
    targetAudience?: string[];
    tags?: string[];
    isActive?: boolean;
    isPinned?: boolean;
    isFeatured?: boolean;
    requiresAcknowledgment?: boolean;
    allowComments?: boolean;
    notifyUsers?: boolean;
  };

  @IsUUID()
  createdBy: string;
}

export class QueryTemplateDto {
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'usageCount' | 'createdAt' | 'updatedAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

export class PreviewTemplateDto {
  @IsUUID()
  templateId: string;

  @IsJSON()
  variables: Record<string, any>;
}

export class CloneTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  newName: string;

  @IsUUID()
  createdBy: string;
}

export class TemplateVariableDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['string', 'number', 'date', 'boolean', 'url', 'email'])
  type: 'string' | 'number' | 'date' | 'boolean' | 'url' | 'email';

  @IsBoolean()
  required: boolean;

  @IsOptional()
  defaultValue?: any;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export class TemplateResponseDto {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  titleTemplate: string;
  contentTemplate: string;
  summaryTemplate?: string;
  variables?: Record<string, any>;
  defaultSettings?: Record<string, any>;
  styling?: Record<string, any>;
  isActive: boolean;
  isSystem: boolean;
  usageCount: number;
  tags?: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplatePreviewResponseDto {
  title: string;
  content: string;
  summary?: string;
  variables: Record<string, any>;
}

export class TemplateStatsDto {
  totalTemplates: number;
  activeTemplates: number;
  systemTemplates: number;
  mostUsedTemplate: {
    id: string;
    name: string;
    usageCount: number;
  };
  categoriesCount: Record<TemplateCategory, number>;
  typesCount: Record<AnnouncementType, number>;
}
