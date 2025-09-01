import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AnnouncementTemplateService,
  CreateTemplateDto,
  GenerateFromTemplateDto,
} from './template.service';
import {
  AnnouncementTemplate,
  TemplateCategory,
} from '../entities/announcement-template.entity';
import {
  AnnouncementType,
  AnnouncementPriority,
} from '../enums/announcement.enum';

describe('AnnouncementTemplateService', () => {
  let service: AnnouncementTemplateService;
  let repository: Repository<AnnouncementTemplate>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementTemplateService,
        {
          provide: getRepositoryToken(AnnouncementTemplate),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AnnouncementTemplateService>(
      AnnouncementTemplateService,
    );
    repository = module.get<Repository<AnnouncementTemplate>>(
      getRepositoryToken(AnnouncementTemplate),
    );

    // Reset all mocks
    Object.values(mockRepository).forEach((mock) => mock.mockClear());
    Object.values(mockQueryBuilder).forEach((mock) => mock.mockClear());
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTemplate', () => {
    it('should create a new template successfully', async () => {
      const createDto: CreateTemplateDto = {
        name: 'Event Template',
        description: 'Template for event announcements',
        category: TemplateCategory.EVENT,
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.HIGH,
        titleTemplate: '🎉 {{eventName}} - {{eventDate}}',
        contentTemplate:
          'Join us for {{eventName}} on {{eventDate}} at {{location}}!',
        variables: {
          eventName: {
            type: 'string',
            required: true,
            description: 'Name of the event',
          },
          eventDate: {
            type: 'date',
            required: true,
            description: 'Event date',
          },
          location: {
            type: 'string',
            required: true,
            description: 'Event location',
          },
        },
        createdBy: 'admin-123',
      };

      const mockResult = {
        id: 'template-123',
        ...createDto,
        usageCount: 0,
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockResult);
      mockRepository.save.mockResolvedValue(mockResult);

      const result = await service.createTemplate(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        usageCount: 0,
        isActive: true,
        isSystem: false,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should validate template variables', async () => {
      const createDto: CreateTemplateDto = {
        name: 'Invalid Template',
        category: TemplateCategory.CUSTOM,
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        titleTemplate: 'Test {{invalidVar}}',
        contentTemplate: 'Content with {{invalidVar}}',
        variables: {
          validVar: {
            type: 'string',
            required: true,
          },
          // invalidVar is used in template but not defined here
        },
        createdBy: 'admin-123',
      };

      await expect(service.createTemplate(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate variable configuration', async () => {
      const createDto: CreateTemplateDto = {
        name: 'Invalid Variable Template',
        category: TemplateCategory.CUSTOM,
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        titleTemplate: 'Test',
        contentTemplate: 'Content',
        variables: {
          invalidType: {
            type: 'invalid-type' as any, // Invalid type
            required: true,
          },
        },
        createdBy: 'admin-123',
      };

      await expect(service.createTemplate(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate required field configuration', async () => {
      const createDto: CreateTemplateDto = {
        name: 'Invalid Required Template',
        category: TemplateCategory.CUSTOM,
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        titleTemplate: 'Test',
        contentTemplate: 'Content',
        variables: {
          invalidRequired: {
            type: 'string',
            required: 'yes' as any, // Invalid boolean
          },
        },
        createdBy: 'admin-123',
      };

      await expect(service.createTemplate(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllTemplates', () => {
    it('should return filtered templates', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Event Template',
          category: TemplateCategory.EVENT,
          type: AnnouncementType.EVENT,
          isActive: true,
        },
        {
          id: 'template-2',
          name: 'General Template',
          category: TemplateCategory.CUSTOM,
          type: AnnouncementType.GENERAL,
          isActive: true,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockTemplates);

      const result = await service.findAllTemplates({
        category: TemplateCategory.EVENT,
        isActive: true,
      });

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'template',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'template.category = :category',
        { category: TemplateCategory.EVENT },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'template.isActive = :isActive',
        { isActive: true },
      );
      expect(result).toEqual(mockTemplates);
    });

    it('should handle search filter', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAllTemplates({
        search: 'event template',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(template.name ILIKE :search OR template.description ILIKE :search OR template.titleTemplate ILIKE :search)',
        { search: '%event template%' },
      );
    });

    it('should sort by usage count and updated date', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAllTemplates();

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'template.usageCount',
        'DESC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'template.updatedAt',
        'DESC',
      );
    });
  });

  describe('findTemplateById', () => {
    it('should return template by ID', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
        isActive: true,
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.findTemplateById('template-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'template-123' },
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundException for non-existent template', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findTemplateById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTemplate', () => {
    it('should update template successfully', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Original Template',
        isSystem: false,
        variables: {},
        titleTemplate: 'Original Title',
        contentTemplate: 'Original Content',
      };

      const updateDto = {
        name: 'Updated Template',
        titleTemplate: 'Updated {{title}}',
        variables: {
          title: {
            type: 'string' as const,
            required: true,
          },
        },
        updatedBy: 'admin-456',
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);
      mockRepository.update.mockResolvedValue({});
      mockRepository.findOne
        .mockResolvedValueOnce(mockTemplate) // First call for finding
        .mockResolvedValueOnce({ ...mockTemplate, ...updateDto }); // Second call after update

      const result = await service.updateTemplate('template-123', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(
        'template-123',
        updateDto,
      );
      expect(result.name).toBe(updateDto.name);
    });

    it('should not allow updating system templates', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'System Template',
        isSystem: true,
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);

      await expect(
        service.updateTemplate('template-123', {
          name: 'Updated System Template',
          updatedBy: 'admin-456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate updated variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        isSystem: false,
        titleTemplate: 'Title {{newVar}}',
        contentTemplate: 'Content',
        variables: {},
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);

      await expect(
        service.updateTemplate('template-123', {
          variables: {
            // newVar is used in title but not defined
            otherVar: {
              type: 'string',
              required: true,
            },
          },
          updatedBy: 'admin-456',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete non-system template', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'User Template',
        isSystem: false,
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);
      mockRepository.remove.mockResolvedValue(mockTemplate);

      await service.deleteTemplate('template-123');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTemplate);
    });

    it('should not allow deleting system templates', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'System Template',
        isSystem: true,
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);

      await expect(service.deleteTemplate('template-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateFromTemplate', () => {
    it('should generate announcement from template', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Event Template',
        isActive: true,
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.HIGH,
        titleTemplate: '🎉 {{eventName}} - {{eventDate}}',
        contentTemplate:
          'Join us for {{eventName}} on {{eventDate}} at {{location}}!',
        summaryTemplate: 'Event: {{eventName}}',
        variables: {
          eventName: {
            type: 'string',
            required: true,
          },
          eventDate: {
            type: 'date',
            required: true,
          },
          location: {
            type: 'string',
            required: true,
          },
        },
        defaultSettings: {
          isFeatured: true,
          notifyUsers: true,
        },
        usageCount: 5,
      };

      const generateDto: GenerateFromTemplateDto = {
        templateId: 'template-123',
        variables: {
          eventName: 'Spring Festival',
          eventDate: '2024-03-15',
          location: 'Central Park',
        },
        overrides: {
          category: 'festivals',
        },
        createdBy: 'admin-789',
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);
      mockRepository.increment.mockResolvedValue({});

      const result = await service.generateFromTemplate(generateDto);

      expect(result.title).toBe('🎉 Spring Festival - 2024-03-15');
      expect(result.content).toBe(
        'Join us for Spring Festival on 2024-03-15 at Central Park!',
      );
      expect(result.summary).toBe('Event: Spring Festival');
      expect(result.type).toBe(AnnouncementType.EVENT);
      expect(result.priority).toBe(AnnouncementPriority.HIGH);
      expect(result.isFeatured).toBe(true); // From default settings
      expect(result.category).toBe('festivals'); // From overrides
      expect(result.createdBy).toBe('admin-789');

      expect(mockRepository.increment).toHaveBeenCalledWith(
        { id: 'template-123' },
        'usageCount',
        1,
      );
    });

    it('should validate required variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        isActive: true,
        variables: {
          requiredVar: {
            type: 'string',
            required: true,
          },
          optionalVar: {
            type: 'string',
            required: false,
          },
        },
        titleTemplate: 'Title',
        contentTemplate: 'Content',
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);

      const generateDto: GenerateFromTemplateDto = {
        templateId: 'template-123',
        variables: {
          // Missing requiredVar
          optionalVar: 'optional value',
        },
        createdBy: 'admin-789',
      };

      await expect(service.generateFromTemplate(generateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should not generate from inactive template', async () => {
      const mockTemplate = {
        id: 'template-123',
        isActive: false,
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);

      const generateDto: GenerateFromTemplateDto = {
        templateId: 'template-123',
        variables: {},
        createdBy: 'admin-789',
      };

      await expect(service.generateFromTemplate(generateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Variable Validation', () => {
    it('should validate string variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        isActive: true,
        variables: {
          stringVar: {
            type: 'string',
            required: true,
            validation: {
              min: 5,
              max: 20,
            },
          },
        },
        titleTemplate: '{{stringVar}}',
        contentTemplate: 'Content',
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);

      // Test too short
      await expect(
        service.generateFromTemplate({
          templateId: 'template-123',
          variables: { stringVar: 'abc' }, // Too short
          createdBy: 'admin',
        }),
      ).rejects.toThrow(BadRequestException);

      // Test too long
      await expect(
        service.generateFromTemplate({
          templateId: 'template-123',
          variables: { stringVar: 'this is way too long for the validation' }, // Too long
          createdBy: 'admin',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate number variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        isActive: true,
        variables: {
          numberVar: {
            type: 'number',
            required: true,
            validation: {
              min: 1,
              max: 100,
            },
          },
        },
        titleTemplate: '{{numberVar}}',
        contentTemplate: 'Content',
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);

      // Test invalid type
      await expect(
        service.generateFromTemplate({
          templateId: 'template-123',
          variables: { numberVar: 'not a number' },
          createdBy: 'admin',
        }),
      ).rejects.toThrow(BadRequestException);

      // Test out of range
      await expect(
        service.generateFromTemplate({
          templateId: 'template-123',
          variables: { numberVar: 150 }, // Too high
          createdBy: 'admin',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate email variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        isActive: true,
        variables: {
          emailVar: {
            type: 'email',
            required: true,
          },
        },
        titleTemplate: '{{emailVar}}',
        contentTemplate: 'Content',
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);

      await expect(
        service.generateFromTemplate({
          templateId: 'template-123',
          variables: { emailVar: 'invalid-email' },
          createdBy: 'admin',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate URL variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        isActive: true,
        variables: {
          urlVar: {
            type: 'url',
            required: true,
          },
        },
        titleTemplate: '{{urlVar}}',
        contentTemplate: 'Content',
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);

      await expect(
        service.generateFromTemplate({
          templateId: 'template-123',
          variables: { urlVar: 'not-a-url' },
          createdBy: 'admin',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('previewTemplate', () => {
    it('should preview template with variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        titleTemplate: 'Hello {{name}}!',
        contentTemplate: 'Welcome to {{eventName}} on {{date}}.',
        summaryTemplate: 'Event: {{eventName}}',
        variables: {
          name: { type: 'string', required: true },
          eventName: { type: 'string', required: true },
          date: { type: 'date', required: true },
        },
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);

      const preview = await service.previewTemplate('template-123', {
        name: 'John Doe',
        eventName: 'Spring Festival',
        date: '2024-03-15',
      });

      expect(preview.title).toBe('Hello John Doe!');
      expect(preview.content).toBe('Welcome to Spring Festival on 2024-03-15.');
      expect(preview.summary).toBe('Event: Spring Festival');
    });
  });

  describe('cloneTemplate', () => {
    it('should clone template with new name', async () => {
      const originalTemplate = {
        id: 'original-123',
        name: 'Original Template',
        category: TemplateCategory.EVENT,
        type: AnnouncementType.EVENT,
        titleTemplate: 'Original {{title}}',
        contentTemplate: 'Original content',
        usageCount: 10,
        isSystem: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const clonedTemplate = {
        ...originalTemplate,
        id: 'cloned-456',
        name: 'Cloned Template',
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(originalTemplate);
      mockRepository.create.mockReturnValue(clonedTemplate);
      mockRepository.save.mockResolvedValue(clonedTemplate);

      const result = await service.cloneTemplate(
        'original-123',
        'Cloned Template',
        'admin-789',
      );

      expect(result.name).toBe('Cloned Template');
      expect(result.usageCount).toBe(0);
      expect(result.isSystem).toBe(false);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cloned Template',
          createdBy: 'admin-789',
          updatedBy: 'admin-789',
          usageCount: 0,
          isSystem: false,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        }),
      );
    });
  });

  describe('getPopularTemplates', () => {
    it('should return templates sorted by usage count', async () => {
      const mockTemplates = [
        { id: 'template-1', name: 'Popular Template', usageCount: 100 },
        { id: 'template-2', name: 'Less Popular Template', usageCount: 50 },
      ];

      mockRepository.find.mockResolvedValue(mockTemplates);

      const result = await service.getPopularTemplates(5);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { usageCount: 'DESC' },
        take: 5,
      });
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('getTemplateCategories', () => {
    it('should return all template categories', () => {
      const categories = service.getTemplateCategories();

      expect(categories).toContain(TemplateCategory.EVENT);
      expect(categories).toContain(TemplateCategory.MAINTENANCE);
      expect(categories).toContain(TemplateCategory.WELCOME);
      expect(categories).toContain(TemplateCategory.CUSTOM);
    });
  });

  describe('initializeSystemTemplates', () => {
    it('should initialize system templates', async () => {
      // Mock that no system templates exist
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockImplementation((data) => Promise.resolve(data));

      await service.initializeSystemTemplates();

      // Should create multiple system templates
      expect(mockRepository.create).toHaveBeenCalledTimes(3); // Based on the system templates defined
      expect(mockRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should not recreate existing system templates', async () => {
      // Mock that system templates already exist
      mockRepository.findOne.mockResolvedValue({ id: 'existing-template' });

      await service.initializeSystemTemplates();

      // Should not create any new templates
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const createDto: CreateTemplateDto = {
        name: 'Test Template',
        category: TemplateCategory.CUSTOM,
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        titleTemplate: 'Test',
        contentTemplate: 'Content',
        createdBy: 'admin',
      };

      await expect(service.createTemplate(createDto)).rejects.toThrow(
        'Failed to create template',
      );
    });

    it('should handle variable replacement errors', async () => {
      const mockTemplate = {
        id: 'template-123',
        isActive: true,
        titleTemplate: 'Title with {{undefined}}',
        contentTemplate: 'Content',
        variables: {},
      };

      mockRepository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.previewTemplate('template-123', {});

      // Should handle undefined variables gracefully
      expect(result.title).toBe('Title with {{undefined}}'); // Variable not replaced
    });
  });
});
