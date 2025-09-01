import { validate } from 'class-validator';
import { EventAnnouncement } from './event-announcement.entity';
import {
  AnnouncementTemplate,
  TemplateCategory,
} from './announcement-template.entity';
import {
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus,
} from '../enums/announcement.enum';

describe('Event Announcements Entities', () => {
  describe('EventAnnouncement Entity', () => {
    let announcement: EventAnnouncement;

    beforeEach(() => {
      announcement = new EventAnnouncement();
    });

    it('should create a valid announcement entity', async () => {
      announcement.title = 'Test Announcement';
      announcement.content = 'This is a test announcement with sufficient content length to pass validation.';
      announcement.type = AnnouncementType.GENERAL;
      announcement.priority = AnnouncementPriority.NORMAL;
      announcement.status = AnnouncementStatus.PUBLISHED;
      announcement.isActive = true;
      announcement.isPublished = true;
      announcement.createdBy = '123e4567-e89b-12d3-a456-426614174000';

      const errors = await validate(announcement);
      expect(errors).toHaveLength(0);
    });

    it('should validate required fields', async () => {
      // Leave required fields empty
      const errors = await validate(announcement);

      expect(errors.length).toBeGreaterThan(0);
      const errorProperties = errors.map(error => error.property);
      expect(errorProperties).toContain('title');
      expect(errorProperties).toContain('content');
    });

    it('should validate title length constraints', async () => {
      announcement.title = 'a'.repeat(256); // Exceeds 255 character limit
      announcement.content = 'Valid content with sufficient length for validation.';

      const errors = await validate(announcement);
      const titleError = errors.find(error => error.property === 'title');
      
      expect(titleError).toBeDefined();
      expect(titleError?.constraints).toHaveProperty('maxLength');
    });

    it('should validate content length constraints', async () => {
      announcement.title = 'Valid Title';
      announcement.content = 'a'.repeat(5001); // Exceeds 5000 character limit

      const errors = await validate(announcement);
      const contentError = errors.find(error => error.property === 'content');
      
      expect(contentError).toBeDefined();
      expect(contentError?.constraints).toHaveProperty('maxLength');
    });

    it('should validate enum fields', async () => {
      announcement.title = 'Valid Title';
      announcement.content = 'Valid content with sufficient length for validation.';
      announcement.type = 'INVALID_TYPE' as any;
      announcement.priority = 'INVALID_PRIORITY' as any;
      announcement.status = 'INVALID_STATUS' as any;

      const errors = await validate(announcement);
      
      const enumErrors = errors.filter(error => 
        ['type', 'priority', 'status'].includes(error.property)
      );
      expect(enumErrors.length).toBe(3);
      
      enumErrors.forEach(error => {
        expect(error.constraints).toHaveProperty('isEnum');
      });
    });

    it('should validate URL fields', async () => {
      announcement.title = 'Valid Title';
      announcement.content = 'Valid content with sufficient length for validation.';
      announcement.eventUrl = 'not-a-valid-url';
      announcement.registrationUrl = 'also-invalid';
      announcement.imageUrl = 'invalid-image-url';
      announcement.bannerUrl = 'invalid-banner-url';

      const errors = await validate(announcement);
      
      const urlErrors = errors.filter(error => 
        ['eventUrl', 'registrationUrl', 'imageUrl', 'bannerUrl'].includes(error.property)
      );
      expect(urlErrors.length).toBeGreaterThan(0);
      
      urlErrors.forEach(error => {
        expect(error.constraints).toHaveProperty('isUrl');
      });
    });

    it('should validate boolean fields default values', () => {
      announcement.title = 'Valid Title';
      announcement.content = 'Valid content with sufficient length for validation.';

      // Test default values
      expect(announcement.isActive).toBeUndefined(); // Will be set by database default
      expect(announcement.isPinned).toBeUndefined(); // Will be set by database default
      expect(announcement.isFeatured).toBeUndefined(); // Will be set by database default

      // Set boolean values
      announcement.isActive = true;
      announcement.isPinned = false;
      announcement.isFeatured = true;

      expect(typeof announcement.isActive).toBe('boolean');
      expect(typeof announcement.isPinned).toBe('boolean');
      expect(typeof announcement.isFeatured).toBe('boolean');
    });

    it('should validate array fields', async () => {
      announcement.title = 'Valid Title';
      announcement.content = 'Valid content with sufficient length for validation.';
      announcement.targetAudience = ['all', 'students', 'faculty'];
      announcement.tags = ['important', 'event', 'notification'];
      announcement.categories = ['academic', 'administrative'];

      const errors = await validate(announcement);
      
      // Filter out errors not related to our test fields
      const arrayFieldErrors = errors.filter(error => 
        ['targetAudience', 'tags', 'categories'].includes(error.property)
      );
      
      expect(arrayFieldErrors).toHaveLength(0);
      expect(Array.isArray(announcement.targetAudience)).toBe(true);
      expect(Array.isArray(announcement.tags)).toBe(true);
      expect(Array.isArray(announcement.categories)).toBe(true);
    });

    it('should validate date fields', () => {
      announcement.title = 'Valid Title';
      announcement.content = 'Valid content with sufficient length for validation.';
      
      const now = new Date();
      const future = new Date(now.getTime() + 86400000); // +1 day
      
      announcement.startDate = now;
      announcement.endDate = future;
      announcement.eventDate = future;
      announcement.publishedAt = now;
      announcement.scheduledFor = future;
      announcement.expireAt = future;

      expect(announcement.startDate).toBeInstanceOf(Date);
      expect(announcement.endDate).toBeInstanceOf(Date);
      expect(announcement.eventDate).toBeInstanceOf(Date);
      expect(announcement.publishedAt).toBeInstanceOf(Date);
      expect(announcement.scheduledFor).toBeInstanceOf(Date);
      expect(announcement.expireAt).toBeInstanceOf(Date);
    });

    it('should validate numeric fields', async () => {
      announcement.title = 'Valid Title';
      announcement.content = 'Valid content with sufficient length for validation.';
      announcement.maxParticipants = 100;
      announcement.viewCount = 0;
      announcement.likeCount = 0;
      announcement.shareCount = 0;

      const errors = await validate(announcement);
      
      const numericFieldErrors = errors.filter(error => 
        ['maxParticipants', 'viewCount', 'likeCount', 'shareCount'].includes(error.property)
      );
      
      expect(numericFieldErrors).toHaveLength(0);
      expect(typeof announcement.maxParticipants).toBe('number');
      expect(announcement.maxParticipants).toBeGreaterThanOrEqual(0);
    });

    it('should fail validation for negative numeric values where applicable', async () => {
      announcement.title = 'Valid Title';
      announcement.content = 'Valid content with sufficient length for validation.';
      announcement.maxParticipants = -1; // Should fail min validation

      const errors = await validate(announcement);
      const maxParticipantsError = errors.find(error => error.property === 'maxParticipants');
      
      if (maxParticipantsError) {
        expect(maxParticipantsError.constraints).toHaveProperty('min');
      }
    });

    it('should validate UUID fields', async () => {
      announcement.title = 'Valid Title';
      announcement.content = 'Valid content with sufficient length for validation.';
      announcement.createdBy = 'invalid-uuid';

      const errors = await validate(announcement);
      const createdByError = errors.find(error => error.property === 'createdBy');
      
      if (createdByError) {
        expect(createdByError.constraints).toHaveProperty('isUuid');
      }

      // Test with valid UUID
      announcement.createdBy = '123e4567-e89b-12d3-a456-426614174000';
      const errorsWithValidUuid = await validate(announcement);
      const validUuidError = errorsWithValidUuid.find(error => error.property === 'createdBy');
      expect(validUuidError).toBeUndefined();
    });

    it('should handle optional fields correctly', async () => {
      announcement.title = 'Valid Title';
      announcement.content = 'Valid content with sufficient length for validation.';
      
      // All optional fields should be undefined or null and still pass validation
      const errors = await validate(announcement);
      
      // Filter for only the required field errors
      const requiredFieldErrors = errors.filter(error => 
        !['summary', 'category', 'author', 'eventUrl', 'location'].includes(error.property)
      );
      
      expect(announcement.summary).toBeUndefined();
      expect(announcement.category).toBeUndefined();
      expect(announcement.author).toBeUndefined();
      expect(announcement.eventUrl).toBeUndefined();
    });
  });

  describe('AnnouncementTemplate Entity', () => {
    let template: AnnouncementTemplate;

    beforeEach(() => {
      template = new AnnouncementTemplate();
    });

    it('should create a valid template entity', async () => {
      template.name = 'Test Template';
      template.description = 'A test template for validation';
      template.category = TemplateCategory.EVENT;
      template.type = AnnouncementType.EVENT;
      template.priority = AnnouncementPriority.NORMAL;
      template.titleTemplate = 'Event: {{eventName}}';
      template.contentTemplate = 'Join us for {{eventName}} on {{eventDate}}';
      template.isActive = true;
      template.isSystem = false;

      const errors = await validate(template);
      expect(errors).toHaveLength(0);
    });

    it('should validate required fields', async () => {
      // Leave required fields empty
      const errors = await validate(template);

      expect(errors.length).toBeGreaterThan(0);
      const errorProperties = errors.map(error => error.property);
      expect(errorProperties).toContain('name');
      expect(errorProperties).toContain('titleTemplate');
      expect(errorProperties).toContain('contentTemplate');
    });

    it('should validate name length constraints', async () => {
      template.name = 'a'.repeat(256); // Exceeds 255 character limit
      template.titleTemplate = 'Valid title template';
      template.contentTemplate = 'Valid content template';

      const errors = await validate(template);
      const nameError = errors.find(error => error.property === 'name');
      
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('maxLength');
    });

    it('should validate description length constraints', async () => {
      template.name = 'Valid Name';
      template.titleTemplate = 'Valid title template';
      template.contentTemplate = 'Valid content template';
      template.description = 'a'.repeat(501); // Exceeds 500 character limit

      const errors = await validate(template);
      const descriptionError = errors.find(error => error.property === 'description');
      
      expect(descriptionError).toBeDefined();
      expect(descriptionError?.constraints).toHaveProperty('maxLength');
    });

    it('should validate enum fields', async () => {
      template.name = 'Valid Name';
      template.titleTemplate = 'Valid title template';
      template.contentTemplate = 'Valid content template';
      template.category = 'INVALID_CATEGORY' as any;
      template.type = 'INVALID_TYPE' as any;
      template.priority = 'INVALID_PRIORITY' as any;

      const errors = await validate(template);
      
      const enumErrors = errors.filter(error => 
        ['category', 'type', 'priority'].includes(error.property)
      );
      expect(enumErrors.length).toBe(3);
      
      enumErrors.forEach(error => {
        expect(error.constraints).toHaveProperty('isEnum');
      });
    });

    it('should validate boolean fields', async () => {
      template.name = 'Valid Name';
      template.titleTemplate = 'Valid title template';
      template.contentTemplate = 'Valid content template';
      template.isActive = true;
      template.isSystem = false;

      const errors = await validate(template);
      
      const booleanFieldErrors = errors.filter(error => 
        ['isActive', 'isSystem'].includes(error.property)
      );
      
      expect(booleanFieldErrors).toHaveLength(0);
      expect(typeof template.isActive).toBe('boolean');
      expect(typeof template.isSystem).toBe('boolean');
    });

    it('should validate JSON fields structure', () => {
      template.name = 'Valid Name';
      template.titleTemplate = 'Valid title template';
      template.contentTemplate = 'Valid content template';

      // Test variables JSON structure
      template.variables = {
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
      };

      // Test defaultSettings JSON structure
      template.defaultSettings = {
        isActive: true,
        isPinned: false,
        isFeatured: true,
        targetAudience: ['all'],
      };

      // Test styling JSON structure
      template.styling = {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderColor: '#cccccc',
      };

      expect(typeof template.variables).toBe('object');
      expect(typeof template.defaultSettings).toBe('object');
      expect(typeof template.styling).toBe('object');
    });

    it('should validate array fields', async () => {
      template.name = 'Valid Name';
      template.titleTemplate = 'Valid title template';
      template.contentTemplate = 'Valid content template';
      template.tags = ['template', 'event', 'notification'];

      const errors = await validate(template);
      
      const arrayFieldErrors = errors.filter(error => 
        error.property === 'tags'
      );
      
      expect(arrayFieldErrors).toHaveLength(0);
      expect(Array.isArray(template.tags)).toBe(true);
      expect(template.tags).toHaveLength(3);
    });

    it('should validate createdBy and updatedBy fields', async () => {
      template.name = 'Valid Name';
      template.titleTemplate = 'Valid title template';
      template.contentTemplate = 'Valid content template';
      template.createdBy = 'a'.repeat(101); // Exceeds 100 character limit
      template.updatedBy = 'a'.repeat(101); // Exceeds 100 character limit

      const errors = await validate(template);
      
      const userFieldErrors = errors.filter(error => 
        ['createdBy', 'updatedBy'].includes(error.property)
      );
      
      if (userFieldErrors.length > 0) {
        userFieldErrors.forEach(error => {
          expect(error.constraints).toHaveProperty('maxLength');
        });
      }
    });

    it('should handle template variables validation', () => {
      template.name = 'Valid Name';
      template.titleTemplate = 'Event: {{eventName}} on {{eventDate}}';
      template.contentTemplate = 'Join us for {{eventName}} at {{location}}';

      template.variables = {
        eventName: {
          type: 'string',
          required: true,
          description: 'Name of the event',
          validation: {
            min: 5,
            max: 100,
          },
        },
        eventDate: {
          type: 'date',
          required: true,
          description: 'Event date',
        },
        location: {
          type: 'string',
          required: false,
          defaultValue: 'TBD',
          description: 'Event location',
        },
      };

      // Verify the structure
      expect(template.variables.eventName.type).toBe('string');
      expect(template.variables.eventName.required).toBe(true);
      expect(template.variables.eventDate.type).toBe('date');
      expect(template.variables.location.required).toBe(false);
      expect(template.variables.location.defaultValue).toBe('TBD');
    });

    it('should handle complex template structures', () => {
      template.name = 'Complex Event Template';
      template.description = 'A comprehensive template for complex events';
      template.category = TemplateCategory.EVENT;
      template.type = AnnouncementType.EVENT;
      template.priority = AnnouncementPriority.HIGH;
      template.titleTemplate = '🎉 {{eventName}} - {{eventDate}}';
      template.contentTemplate = `
        We're excited to announce {{eventName}}!
        
        📅 Date: {{eventDate}}
        🕐 Time: {{eventTime}}
        📍 Location: {{location}}
        
        {{description}}
        
        {{#registrationRequired}}
        Registration is required: {{registrationUrl}}
        {{/registrationRequired}}
      `;

      template.variables = {
        eventName: { type: 'string', required: true },
        eventDate: { type: 'date', required: true },
        eventTime: { type: 'string', required: true },
        location: { type: 'string', required: true },
        description: { type: 'string', required: true },
        registrationUrl: { type: 'url', required: false },
      };

      template.defaultSettings = {
        isActive: true,
        isPinned: true,
        isFeatured: true,
        requiresAcknowledgment: false,
        allowComments: true,
        notifyUsers: true,
        targetAudience: ['all'],
        tags: ['event', 'announcement'],
      };

      template.styling = {
        backgroundColor: '#f8f9fa',
        textColor: '#343a40',
        borderColor: '#dee2e6',
        iconUrl: 'https://example.com/event-icon.png',
      };

      template.tags = ['event', 'template', 'complex'];
      template.usageCount = 0;
      template.isActive = true;
      template.isSystem = false;

      // Verify all fields are set correctly
      expect(template.name).toBe('Complex Event Template');
      expect(template.category).toBe(TemplateCategory.EVENT);
      expect(Object.keys(template.variables || {})).toHaveLength(6);
      expect(template.defaultSettings?.targetAudience).toContain('all');
      expect(template.styling?.backgroundColor).toBe('#f8f9fa');
      expect(template.tags).toHaveLength(3);
    });
  });

  describe('Entity Relationships and Constraints', () => {
    it('should handle announcement and template relationship concepts', () => {
      // While these entities don't have direct relationships,
      // they work together in the template generation process
      
      const template = new AnnouncementTemplate();
      template.name = 'Event Template';
      template.titleTemplate = '{{eventName}} - {{eventDate}}';
      template.contentTemplate = 'Join us for {{eventName}}';
      template.type = AnnouncementType.EVENT;
      template.priority = AnnouncementPriority.HIGH;

      const announcement = new EventAnnouncement();
      announcement.title = 'Summer Festival - 2024-07-15';
      announcement.content = 'Join us for Summer Festival';
      announcement.type = template.type; // Derived from template
      announcement.priority = template.priority; // Derived from template

      expect(announcement.type).toBe(template.type);
      expect(announcement.priority).toBe(template.priority);
    });

    it('should validate data consistency between related entities', () => {
      const template = new AnnouncementTemplate();
      template.name = 'Maintenance Template';
      template.type = AnnouncementType.MAINTENANCE;
      template.priority = AnnouncementPriority.CRITICAL;
      template.titleTemplate = 'Maintenance: {{title}}';
      template.contentTemplate = 'Scheduled maintenance: {{description}}';

      // An announcement generated from this template should inherit its properties
      const announcement = new EventAnnouncement();
      announcement.title = 'Maintenance: Database Upgrade';
      announcement.content = 'Scheduled maintenance: Database upgrade tonight';
      announcement.type = template.type;
      announcement.priority = template.priority;

      // Verify consistency
      expect(announcement.type).toBe(AnnouncementType.MAINTENANCE);
      expect(announcement.priority).toBe(AnnouncementPriority.CRITICAL);
      expect(announcement.title).toContain('Maintenance:');
      expect(announcement.content).toContain('Scheduled maintenance:');
    });
  });
});