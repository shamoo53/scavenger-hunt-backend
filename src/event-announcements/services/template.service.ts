import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnouncementTemplate, TemplateCategory } from '../entities/announcement-template.entity';
import { CreateEventAnnouncementDto } from '../dto/create-event-announcement.dto';
import { AnnouncementType, AnnouncementPriority } from '../enums/announcement.enum';

export interface CreateTemplateDto {
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
  tags?: string[];
  createdBy: string;
}

export interface UpdateTemplateDto extends Partial<CreateTemplateDto> {
  updatedBy: string;
}

export interface GenerateFromTemplateDto {
  templateId: string;
  variables: Record<string, any>;
  overrides?: Partial<CreateEventAnnouncementDto>;
  createdBy: string;
}

@Injectable()
export class AnnouncementTemplateService {
  private readonly logger = new Logger(AnnouncementTemplateService.name);

  constructor(
    @InjectRepository(AnnouncementTemplate)
    private readonly templateRepository: Repository<AnnouncementTemplate>,
  ) {}

  /**
   * Create a new template
   */
  async createTemplate(createDto: CreateTemplateDto): Promise<AnnouncementTemplate> {
    try {
      // Validate template variables
      this.validateTemplateVariables(createDto.variables);

      // Validate template content
      this.validateTemplateContent(createDto.titleTemplate, createDto.contentTemplate, createDto.variables);

      const template = this.templateRepository.create({
        ...createDto,
        usageCount: 0,
        isActive: true,
        isSystem: false
      });

      const savedTemplate = await this.templateRepository.save(template);
      this.logger.log(`Created template: ${savedTemplate.id} - ${savedTemplate.name}`);
      
      return savedTemplate;
    } catch (error) {
      this.logger.error(`Failed to create template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all templates with filtering
   */
  async findAllTemplates(filters?: {
    category?: TemplateCategory;
    type?: AnnouncementType;
    isActive?: boolean;
    search?: string;
    createdBy?: string;
  }): Promise<AnnouncementTemplate[]> {
    try {
      const queryBuilder = this.templateRepository.createQueryBuilder('template');

      if (filters?.category) {
        queryBuilder.andWhere('template.category = :category', { category: filters.category });
      }

      if (filters?.type) {
        queryBuilder.andWhere('template.type = :type', { type: filters.type });
      }

      if (filters?.isActive !== undefined) {
        queryBuilder.andWhere('template.isActive = :isActive', { isActive: filters.isActive });
      }

      if (filters?.createdBy) {
        queryBuilder.andWhere('template.createdBy = :createdBy', { createdBy: filters.createdBy });
      }

      if (filters?.search) {
        queryBuilder.andWhere(
          '(template.name ILIKE :search OR template.description ILIKE :search OR template.titleTemplate ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      queryBuilder.orderBy('template.usageCount', 'DESC')
               .addOrderBy('template.updatedAt', 'DESC');

      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error(`Failed to find templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async findTemplateById(id: string): Promise<AnnouncementTemplate> {
    try {
      const template = await this.templateRepository.findOne({ where: { id } });
      
      if (!template) {
        throw new NotFoundException(`Template with ID ${id} not found`);
      }

      return template;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find template ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, updateDto: UpdateTemplateDto): Promise<AnnouncementTemplate> {
    try {
      const template = await this.findTemplateById(id);

      if (template.isSystem) {
        throw new BadRequestException('System templates cannot be modified');
      }

      // Validate updated variables if provided
      if (updateDto.variables) {
        this.validateTemplateVariables(updateDto.variables);
      }

      // Validate template content if updated
      if (updateDto.titleTemplate || updateDto.contentTemplate || updateDto.variables) {
        const titleTemplate = updateDto.titleTemplate || template.titleTemplate;
        const contentTemplate = updateDto.contentTemplate || template.contentTemplate;
        const variables = updateDto.variables || template.variables;
        
        this.validateTemplateContent(titleTemplate, contentTemplate, variables);
      }

      await this.templateRepository.update(id, updateDto);
      const updatedTemplate = await this.findTemplateById(id);

      this.logger.log(`Updated template: ${id} - ${updatedTemplate.name}`);
      return updatedTemplate;
    } catch (error) {
      this.logger.error(`Failed to update template ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const template = await this.findTemplateById(id);

      if (template.isSystem) {
        throw new BadRequestException('System templates cannot be deleted');
      }

      await this.templateRepository.remove(template);
      this.logger.log(`Deleted template: ${id} - ${template.name}`);
    } catch (error) {
      this.logger.error(`Failed to delete template ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate announcement from template
   */
  async generateFromTemplate(generateDto: GenerateFromTemplateDto): Promise<CreateEventAnnouncementDto> {
    try {
      const template = await this.findTemplateById(generateDto.templateId);

      if (!template.isActive) {
        throw new BadRequestException('Template is not active');
      }

      // Validate provided variables
      this.validateProvidedVariables(template.variables || {}, generateDto.variables);

      // Replace variables in templates
      const title = this.replaceVariables(template.titleTemplate, generateDto.variables);
      const content = this.replaceVariables(template.contentTemplate, generateDto.variables);
      const summary = template.summaryTemplate ? 
        this.replaceVariables(template.summaryTemplate, generateDto.variables) : undefined;

      // Create announcement DTO
      const announcementDto: CreateEventAnnouncementDto = {
        title,
        content,
        summary,
        type: template.type,
        priority: template.priority,
        createdBy: generateDto.createdBy,
        // Apply default settings from template
        ...template.defaultSettings,
        // Apply any overrides
        ...generateDto.overrides
      };

      // Increment usage count
      await this.templateRepository.increment({ id: template.id }, 'usageCount', 1);

      this.logger.log(`Generated announcement from template: ${template.id}`);
      return announcementDto;
    } catch (error) {
      this.logger.error(`Failed to generate from template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get template categories
   */
  getTemplateCategories(): TemplateCategory[] {
    return Object.values(TemplateCategory);
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit: number = 10): Promise<AnnouncementTemplate[]> {
    try {
      return await this.templateRepository.find({
        where: { isActive: true },
        order: { usageCount: 'DESC' },
        take: limit
      });
    } catch (error) {
      this.logger.error(`Failed to get popular templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clone template
   */
  async cloneTemplate(id: string, newName: string, createdBy: string): Promise<AnnouncementTemplate> {
    try {
      const originalTemplate = await this.findTemplateById(id);

      const clonedTemplate = this.templateRepository.create({
        ...originalTemplate,
        id: undefined, // Will be auto-generated
        name: newName,
        createdBy,
        updatedBy: createdBy,
        usageCount: 0,
        isSystem: false,
        createdAt: undefined,
        updatedAt: undefined
      });

      const savedTemplate = await this.templateRepository.save(clonedTemplate);
      this.logger.log(`Cloned template ${id} to ${savedTemplate.id}`);

      return savedTemplate;
    } catch (error) {
      this.logger.error(`Failed to clone template ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Preview template with variables
   */
  async previewTemplate(templateId: string, variables: Record<string, any>): Promise<{
    title: string;
    content: string;
    summary?: string;
  }> {
    try {
      const template = await this.findTemplateById(templateId);

      // Validate provided variables
      this.validateProvidedVariables(template.variables || {}, variables);

      return {
        title: this.replaceVariables(template.titleTemplate, variables),
        content: this.replaceVariables(template.contentTemplate, variables),
        summary: template.summaryTemplate ? 
          this.replaceVariables(template.summaryTemplate, variables) : undefined
      };
    } catch (error) {
      this.logger.error(`Failed to preview template ${templateId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize system templates
   */
  async initializeSystemTemplates(): Promise<void> {
    try {
      const systemTemplates = this.getSystemTemplateDefinitions();
      
      for (const templateDef of systemTemplates) {
        const existing = await this.templateRepository.findOne({
          where: { name: templateDef.name, isSystem: true }
        });

        if (!existing) {
          const template = this.templateRepository.create({
            ...templateDef,
            isSystem: true,
            isActive: true,
            usageCount: 0
          });

          await this.templateRepository.save(template);
          this.logger.log(`Initialized system template: ${template.name}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to initialize system templates: ${error.message}`);
    }
  }

  // Private helper methods

  private validateTemplateVariables(variables?: Record<string, any>): void {
    if (!variables) return;

    for (const [key, config] of Object.entries(variables)) {
      if (!config.type || !['string', 'number', 'date', 'boolean', 'url', 'email'].includes(config.type)) {
        throw new BadRequestException(`Invalid variable type for ${key}`);
      }

      if (typeof config.required !== 'boolean') {
        throw new BadRequestException(`Variable ${key} must specify required as boolean`);
      }
    }
  }

  private validateTemplateContent(
    titleTemplate: string, 
    contentTemplate: string, 
    variables?: Record<string, any>
  ): void {
    // Extract variables from templates
    const titleVariables = this.extractVariables(titleTemplate);
    const contentVariables = this.extractVariables(contentTemplate);
    const allTemplateVariables = [...titleVariables, ...contentVariables];

    // Check if all template variables are defined
    if (variables) {
      const definedVariables = Object.keys(variables);
      const undefinedVariables = allTemplateVariables.filter(
        varName => !definedVariables.includes(varName)
      );

      if (undefinedVariables.length > 0) {
        throw new BadRequestException(
          `Undefined variables in template: ${undefinedVariables.join(', ')}`
        );
      }
    }
  }

  private validateProvidedVariables(
    templateVariables: Record<string, any>, 
    providedVariables: Record<string, any>
  ): void {
    for (const [key, config] of Object.entries(templateVariables)) {
      const value = providedVariables[key];

      if (config.required && (value === undefined || value === null || value === '')) {
        throw new BadRequestException(`Required variable ${key} is missing`);
      }

      if (value !== undefined && value !== null) {
        this.validateVariableValue(key, value, config);
      }
    }
  }

  private validateVariableValue(key: string, value: any, config: any): void {
    switch (config.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new BadRequestException(`Variable ${key} must be a string`);
        }
        if (config.validation?.min && value.length < config.validation.min) {
          throw new BadRequestException(`Variable ${key} must be at least ${config.validation.min} characters`);
        }
        if (config.validation?.max && value.length > config.validation.max) {
          throw new BadRequestException(`Variable ${key} must be at most ${config.validation.max} characters`);
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          throw new BadRequestException(`Variable ${key} must be a number`);
        }
        if (config.validation?.min && value < config.validation.min) {
          throw new BadRequestException(`Variable ${key} must be at least ${config.validation.min}`);
        }
        if (config.validation?.max && value > config.validation.max) {
          throw new BadRequestException(`Variable ${key} must be at most ${config.validation.max}`);
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new BadRequestException(`Variable ${key} must be a valid email`);
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !/^https?:\/\/.+/.test(value)) {
          throw new BadRequestException(`Variable ${key} must be a valid URL`);
        }
        break;
    }
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName];
      return value !== undefined ? String(value) : match;
    });
  }

  private extractVariables(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2)) : [];
  }

  private getSystemTemplateDefinitions(): Partial<AnnouncementTemplate>[] {
    return [
      {
        name: 'Event Announcement',
        description: 'Template for announcing events',
        category: TemplateCategory.EVENT,
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.HIGH,
        titleTemplate: '🎉 {{eventName}} - {{eventDate}}',
        contentTemplate: `
We're excited to announce {{eventName}}!

📅 Date: {{eventDate}}
🕐 Time: {{eventTime}}
📍 Location: {{location}}

{{description}}

{{#registrationRequired}}
Registration is required. Please register at: {{registrationUrl}}
{{/registrationRequired}}

We look forward to seeing you there!
        `.trim(),
        summaryTemplate: 'Join us for {{eventName}} on {{eventDate}}',
        variables: {
          eventName: { type: 'string', required: true, description: 'Name of the event' },
          eventDate: { type: 'date', required: true, description: 'Event date' },
          eventTime: { type: 'string', required: true, description: 'Event time' },
          location: { type: 'string', required: true, description: 'Event location' },
          description: { type: 'string', required: true, description: 'Event description' },
          registrationUrl: { type: 'url', required: false, description: 'Registration URL' }
        },
        defaultSettings: {
          isFeatured: true,
          notifyUsers: true,
          targetAudience: ['all']
        }
      },
      {
        name: 'Maintenance Notice',
        description: 'Template for maintenance announcements',
        category: TemplateCategory.MAINTENANCE,
        type: AnnouncementType.MAINTENANCE,
        priority: AnnouncementPriority.HIGH,
        titleTemplate: '🔧 Scheduled Maintenance - {{maintenanceDate}}',
        contentTemplate: `
We will be performing scheduled maintenance on our system.

⏰ Start Time: {{startTime}}
⏰ End Time: {{endTime}}
📅 Date: {{maintenanceDate}}

During this time, {{affectedServices}} may be temporarily unavailable.

We apologize for any inconvenience and appreciate your patience.
        `.trim(),
        variables: {
          maintenanceDate: { type: 'date', required: true, description: 'Maintenance date' },
          startTime: { type: 'string', required: true, description: 'Start time' },
          endTime: { type: 'string', required: true, description: 'End time' },
          affectedServices: { type: 'string', required: true, description: 'Affected services' }
        },
        defaultSettings: {
          isPinned: true,
          requiresAcknowledgment: true,
          notifyUsers: true
        }
      },
      {
        name: 'Welcome Message',
        description: 'Template for welcoming new users',
        category: TemplateCategory.WELCOME,
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        titleTemplate: '👋 Welcome to {{platformName}}, {{userName}}!',
        contentTemplate: `
Welcome to {{platformName}}, {{userName}}!

We're thrilled to have you join our community. Here's what you can do to get started:

✅ Complete your profile
✅ Explore our features
✅ Join the community discussions
✅ Check out our getting started guide

If you have any questions, don't hesitate to reach out to our support team.

Happy exploring!
        `.trim(),
        variables: {
          platformName: { type: 'string', required: true, description: 'Platform name' },
          userName: { type: 'string', required: true, description: 'User name' }
        },
        defaultSettings: {
          targetAudience: ['new-users'],
          allowComments: true
        }
      }
    ];
  }
}