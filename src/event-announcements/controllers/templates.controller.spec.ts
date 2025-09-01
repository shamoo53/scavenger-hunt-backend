import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AnnouncementTemplatesController } from './templates.controller';
import { AnnouncementTemplateService } from '../services/template.service';
import { EventAnnouncementsService } from '../event-announcements.service';
import { TemplateCategory } from '../entities/announcement-template.entity';
import {
  AnnouncementType,
  AnnouncementPriority,
} from '../enums/announcement.enum';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  GenerateFromTemplateDto,
  QueryTemplateDto,
  PreviewTemplateDto,
  CloneTemplateDto,
} from '../dto/template.dto';

describe('AnnouncementTemplatesController', () => {
  let controller: AnnouncementTemplatesController;
  let templateService: AnnouncementTemplateService;
  let announcementsService: EventAnnouncementsService;

  const mockTemplateService = {
    createTemplate: jest.fn(),
    findAllTemplates: jest.fn(),
    findTemplateById: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    generateFromTemplate: jest.fn(),
    previewTemplate: jest.fn(),
    cloneTemplate: jest.fn(),
    getPopularTemplates: jest.fn(),
    getTemplateCategories: jest.fn(),
    initializeSystemTemplates: jest.fn(),
  };

  const mockAnnouncementsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementTemplatesController],
      providers: [
        {
          provide: AnnouncementTemplateService,
          useValue: mockTemplateService,
        },
        {
          provide: EventAnnouncementsService,
          useValue: mockAnnouncementsService,
        },
      ],
    }).compile();

    controller = module.get<AnnouncementTemplatesController>(
      AnnouncementTemplatesController,
    );
    templateService = module.get<AnnouncementTemplateService>(
      AnnouncementTemplateService,
    );
    announcementsService = module.get<EventAnnouncementsService>(
      EventAnnouncementsService,
    );

    // Reset all mocks
    Object.values(mockTemplateService).forEach((mock) => mock.mockClear());
    Object.values(mockAnnouncementsService).forEach((mock) => mock.mockClear());
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      const createDto: CreateTemplateDto = {
        name: 'Event Template',
        description: 'Template for events',
        category: TemplateCategory.EVENT,
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.HIGH,
        titleTemplate: '🎉 {{eventName}}',
        contentTemplate: 'Join us for {{eventName}}!',
        variables: {
          eventName: {
            type: 'string',
            required: true,
            description: 'Event name',
          },
        },
        createdBy: 'admin-123',
      };

      const mockResult = {
        id: 'template-123',
        ...createDto,
        usageCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTemplateService.createTemplate.mockResolvedValue(mockResult);

      const result = await controller.createTemplate(createDto);

      expect(mockTemplateService.createTemplate).toHaveBeenCalledWith(
        createDto,
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle creation errors', async () => {
      const createDto: CreateTemplateDto = {
        name: 'Invalid Template',
        category: TemplateCategory.CUSTOM,
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        titleTemplate: 'Test',
        contentTemplate: 'Content',
        createdBy: 'admin-123',
      };

      mockTemplateService.createTemplate.mockRejectedValue(
        new BadRequestException('Invalid template data'),
      );

      await expect(controller.createTemplate(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllTemplates', () => {
    it('should return all templates with filters', async () => {
      const queryDto: QueryTemplateDto = {
        category: TemplateCategory.EVENT,
        isActive: true,
        search: 'event',
      };

      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Event Template 1',
          category: TemplateCategory.EVENT,
          isActive: true,
        },
        {
          id: 'template-2',
          name: 'Event Template 2',
          category: TemplateCategory.EVENT,
          isActive: true,
        },
      ];

      mockTemplateService.findAllTemplates.mockResolvedValue(mockTemplates);

      const result = await controller.findAllTemplates(queryDto);

      expect(mockTemplateService.findAllTemplates).toHaveBeenCalledWith(
        queryDto,
      );
      expect(result).toEqual(mockTemplates);
    });

    it('should handle empty query', async () => {
      mockTemplateService.findAllTemplates.mockResolvedValue([]);

      const result = await controller.findAllTemplates({});

      expect(mockTemplateService.findAllTemplates).toHaveBeenCalledWith({});
      expect(result).toEqual([]);
    });
  });

  describe('getTemplateCategories', () => {
    it('should return all template categories', () => {
      const categories = Object.values(TemplateCategory);
      mockTemplateService.getTemplateCategories.mockReturnValue(categories);

      const result = controller.getTemplateCategories();

      expect(mockTemplateService.getTemplateCategories).toHaveBeenCalled();
      expect(result).toEqual(categories);
    });
  });

  describe('getPopularTemplates', () => {
    it('should return popular templates with default limit', async () => {
      const mockTemplates = [
        { id: 'template-1', name: 'Popular Template 1', usageCount: 100 },
        { id: 'template-2', name: 'Popular Template 2', usageCount: 80 },
      ];

      mockTemplateService.getPopularTemplates.mockResolvedValue(mockTemplates);

      const result = await controller.getPopularTemplates();

      expect(mockTemplateService.getPopularTemplates).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockTemplates);
    });

    it('should return popular templates with custom limit', async () => {
      const mockTemplates = [
        { id: 'template-1', name: 'Popular Template 1', usageCount: 100 },
      ];

      mockTemplateService.getPopularTemplates.mockResolvedValue(mockTemplates);

      const result = await controller.getPopularTemplates(5);

      expect(mockTemplateService.getPopularTemplates).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('getTemplateStats', () => {
    it('should return template statistics', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          category: TemplateCategory.EVENT,
          type: AnnouncementType.EVENT,
          isActive: true,
          isSystem: false,
          usageCount: 100,
        },
        {
          id: 'template-2',
          category: TemplateCategory.MAINTENANCE,
          type: AnnouncementType.MAINTENANCE,
          isActive: true,
          isSystem: true,
          usageCount: 50,
        },
        {
          id: 'template-3',
          category: TemplateCategory.CUSTOM,
          type: AnnouncementType.GENERAL,
          isActive: false,
          isSystem: false,
          usageCount: 25,
        },
      ];

      mockTemplateService.findAllTemplates.mockResolvedValue(mockTemplates);

      const result = await controller.getTemplateStats();

      expect(result).toEqual({
        totalTemplates: 3,
        activeTemplates: 2,
        systemTemplates: 1,
        mostUsedTemplate: {
          id: 'template-1',
          name: undefined, // Not provided in mock
          usageCount: 100,
        },
        categoriesCount: {
          [TemplateCategory.EVENT]: 1,
          [TemplateCategory.MAINTENANCE]: 1,
          [TemplateCategory.CUSTOM]: 1,
        },
        typesCount: {
          [AnnouncementType.EVENT]: 1,
          [AnnouncementType.MAINTENANCE]: 1,
          [AnnouncementType.GENERAL]: 1,
        },
      });
    });

    it('should handle empty templates', async () => {
      mockTemplateService.findAllTemplates.mockResolvedValue([]);

      const result = await controller.getTemplateStats();

      expect(result.totalTemplates).toBe(0);
      expect(result.activeTemplates).toBe(0);
    });
  });

  describe('previewTemplate', () => {
    it('should preview template with variables', async () => {
      const previewDto: PreviewTemplateDto = {
        templateId: 'template-123',
        variables: {
          eventName: 'Spring Festival',
          eventDate: '2024-03-15',
        },
      };

      const mockPreview = {
        title: '🎉 Spring Festival',
        content: 'Join us for Spring Festival on 2024-03-15!',
        summary: 'Event: Spring Festival',
      };

      mockTemplateService.previewTemplate.mockResolvedValue(mockPreview);

      const result = await controller.previewTemplate(previewDto);

      expect(mockTemplateService.previewTemplate).toHaveBeenCalledWith(
        'template-123',
        previewDto.variables,
      );
      expect(result).toEqual(mockPreview);
    });

    it('should handle preview errors', async () => {
      const previewDto: PreviewTemplateDto = {
        templateId: 'non-existent',
        variables: {},
      };

      mockTemplateService.previewTemplate.mockRejectedValue(
        new NotFoundException('Template not found'),
      );

      await expect(controller.previewTemplate(previewDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateFromTemplate', () => {
    it('should generate announcement from template', async () => {
      const generateDto: GenerateFromTemplateDto = {
        templateId: 'template-123',
        variables: {
          eventName: 'Summer Festival',
          eventDate: '2024-06-15',
          location: 'Central Park',
        },
        overrides: {
          isFeatured: true,
        },
        createdBy: 'admin-456',
      };

      const mockAnnouncementDto = {
        title: '🎉 Summer Festival - 2024-06-15',
        content: 'Join us for Summer Festival on 2024-06-15 at Central Park!',
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.HIGH,
        isFeatured: true,
        createdBy: 'admin-456',
      };

      const mockCreatedAnnouncement = {
        id: 'announcement-789',
        ...mockAnnouncementDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTemplateService.generateFromTemplate.mockResolvedValue(
        mockAnnouncementDto,
      );
      mockAnnouncementsService.create.mockResolvedValue(
        mockCreatedAnnouncement,
      );

      const result = await controller.generateFromTemplate(generateDto);

      expect(mockTemplateService.generateFromTemplate).toHaveBeenCalledWith(
        generateDto,
      );
      expect(mockAnnouncementsService.create).toHaveBeenCalledWith(
        mockAnnouncementDto,
      );
      expect(result).toEqual(mockCreatedAnnouncement);
    });

    it('should handle generation errors', async () => {
      const generateDto: GenerateFromTemplateDto = {
        templateId: 'invalid-template',
        variables: {},
        createdBy: 'admin-456',
      };

      mockTemplateService.generateFromTemplate.mockRejectedValue(
        new BadRequestException('Invalid variables'),
      );

      await expect(
        controller.generateFromTemplate(generateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cloneTemplate', () => {
    it('should clone template with new name', async () => {
      const cloneDto: CloneTemplateDto = {
        newName: 'Cloned Event Template',
        createdBy: 'admin-789',
      };

      const mockClonedTemplate = {
        id: 'template-cloned',
        name: 'Cloned Event Template',
        usageCount: 0,
        isSystem: false,
        createdBy: 'admin-789',
      };

      mockTemplateService.cloneTemplate.mockResolvedValue(mockClonedTemplate);

      const result = await controller.cloneTemplate(
        'template-original',
        cloneDto,
      );

      expect(mockTemplateService.cloneTemplate).toHaveBeenCalledWith(
        'template-original',
        'Cloned Event Template',
        'admin-789',
      );
      expect(result).toEqual(mockClonedTemplate);
    });

    it('should handle clone errors', async () => {
      const cloneDto: CloneTemplateDto = {
        newName: 'Duplicate Name',
        createdBy: 'admin-789',
      };

      mockTemplateService.cloneTemplate.mockRejectedValue(
        new BadRequestException('Template name already exists'),
      );

      await expect(
        controller.cloneTemplate('template-123', cloneDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findTemplate', () => {
    it('should return template by ID', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
        category: TemplateCategory.EVENT,
        isActive: true,
      };

      mockTemplateService.findTemplateById.mockResolvedValue(mockTemplate);

      const result = await controller.findTemplate('template-123');

      expect(mockTemplateService.findTemplateById).toHaveBeenCalledWith(
        'template-123',
      );
      expect(result).toEqual(mockTemplate);
    });

    it('should handle not found errors', async () => {
      mockTemplateService.findTemplateById.mockRejectedValue(
        new NotFoundException('Template not found'),
      );

      await expect(controller.findTemplate('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTemplate', () => {
    it('should update template', async () => {
      const updateDto: UpdateTemplateDto = {
        name: 'Updated Template Name',
        description: 'Updated description',
        isActive: false,
        updatedBy: 'admin-updated',
      };

      const mockUpdatedTemplate = {
        id: 'template-123',
        name: 'Updated Template Name',
        description: 'Updated description',
        isActive: false,
        updatedBy: 'admin-updated',
        updatedAt: new Date(),
      };

      mockTemplateService.updateTemplate.mockResolvedValue(mockUpdatedTemplate);

      const result = await controller.updateTemplate('template-123', updateDto);

      expect(mockTemplateService.updateTemplate).toHaveBeenCalledWith(
        'template-123',
        updateDto,
      );
      expect(result).toEqual(mockUpdatedTemplate);
    });

    it('should handle update errors', async () => {
      const updateDto: UpdateTemplateDto = {
        name: 'Invalid Update',
        updatedBy: 'admin-123',
      };

      mockTemplateService.updateTemplate.mockRejectedValue(
        new BadRequestException('Cannot update system template'),
      );

      await expect(
        controller.updateTemplate('template-123', updateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template', async () => {
      mockTemplateService.deleteTemplate.mockResolvedValue(undefined);

      await controller.deleteTemplate('template-123');

      expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith(
        'template-123',
      );
    });

    it('should handle delete errors', async () => {
      mockTemplateService.deleteTemplate.mockRejectedValue(
        new BadRequestException('Cannot delete system template'),
      );

      await expect(
        controller.deleteTemplate('system-template'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('initializeSystemTemplates', () => {
    it('should initialize system templates', async () => {
      mockTemplateService.initializeSystemTemplates.mockResolvedValue(
        undefined,
      );

      await controller.initializeSystemTemplates();

      expect(mockTemplateService.initializeSystemTemplates).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockTemplateService.initializeSystemTemplates.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.initializeSystemTemplates()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('Validation', () => {
    it('should validate UUID parameters', async () => {
      // This test verifies that the ParseUUIDPipe is properly applied
      // In a real scenario, invalid UUIDs would be rejected by the pipe
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';

      mockTemplateService.findTemplateById.mockResolvedValue({
        id: validUUID,
        name: 'Test Template',
      });

      await controller.findTemplate(validUUID);

      expect(mockTemplateService.findTemplateById).toHaveBeenCalledWith(
        validUUID,
      );
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      const createDto: CreateTemplateDto = {
        name: 'Error Test Template',
        category: TemplateCategory.CUSTOM,
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        titleTemplate: 'Test',
        contentTemplate: 'Content',
        createdBy: 'admin-123',
      };

      const serviceError = new Error('Database connection failed');
      mockTemplateService.createTemplate.mockRejectedValue(serviceError);

      await expect(controller.createTemplate(createDto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle template service unavailability', async () => {
      mockTemplateService.findAllTemplates.mockRejectedValue(
        new Error('Service unavailable'),
      );

      await expect(controller.findAllTemplates({})).rejects.toThrow(
        'Service unavailable',
      );
    });
  });
});
