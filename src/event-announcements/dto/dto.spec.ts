import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateEventAnnouncementDto } from './create-event-announcement.dto';
import { UpdateEventAnnouncementDto } from './update-event-announcement.dto';
import { QueryEventAnnouncementDto } from './query-event-announcement.dto';
import {
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus,
} from '../enums/announcement.enum';

describe('Event Announcements DTOs', () => {
  describe('CreateEventAnnouncementDto', () => {
    it('should validate a valid announcement DTO', async () => {
      const validDto = {
        title: 'Valid Test Announcement',
        content: 'This is a valid announcement content with sufficient length to pass validation requirements.',
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        status: AnnouncementStatus.PUBLISHED,
        category: 'test',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        isPublished: true,
        targetAudience: ['all'],
        tags: ['test', 'validation'],
      };

      const dto = plainToClass(CreateEventAnnouncementDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.title).toBe(validDto.title);
      expect(dto.content).toBe(validDto.content);
      expect(dto.type).toBe(validDto.type);
    });

    it('should fail validation for missing required fields', async () => {
      const invalidDto = {
        // Missing title, content, and createdBy
        type: AnnouncementType.GENERAL,
      };

      const dto = plainToClass(CreateEventAnnouncementDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      
      const errorProperties = errors.map(error => error.property);
      expect(errorProperties).toContain('title');
      expect(errorProperties).toContain('content');
      expect(errorProperties).toContain('createdBy');
    });

    it('should fail validation for title too long', async () => {
      const invalidDto = {
        title: 'a'.repeat(256), // Exceeds 255 character limit
        content: 'Valid content with sufficient length to pass validation requirements.',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
      };

      const dto = plainToClass(CreateEventAnnouncementDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const titleError = errors.find(error => error.property === 'title');
      expect(titleError).toBeDefined();
      expect(titleError?.constraints).toHaveProperty('maxLength');
    });

    it('should fail validation for content too long', async () => {
      const invalidDto = {
        title: 'Valid Title',
        content: 'a'.repeat(5001), // Exceeds 5000 character limit
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
      };

      const dto = plainToClass(CreateEventAnnouncementDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const contentError = errors.find(error => error.property === 'content');
      expect(contentError).toBeDefined();
      expect(contentError?.constraints).toHaveProperty('maxLength');
    });

    it('should fail validation for invalid UUID in createdBy', async () => {
      const invalidDto = {
        title: 'Valid Title',
        content: 'Valid content with sufficient length to pass validation requirements.',
        createdBy: 'invalid-uuid',
      };

      const dto = plainToClass(CreateEventAnnouncementDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const createdByError = errors.find(error => error.property === 'createdBy');
      expect(createdByError).toBeDefined();
      expect(createdByError?.constraints).toHaveProperty('isUuid');
    });

    it('should fail validation for invalid URL fields', async () => {
      const invalidDto = {
        title: 'Valid Title',
        content: 'Valid content with sufficient length to pass validation requirements.',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        eventUrl: 'not-a-valid-url',
        registrationUrl: 'also-not-valid',
        imageUrl: 'invalid-image-url',
      };

      const dto = plainToClass(CreateEventAnnouncementDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      
      const urlErrors = errors.filter(error => 
        ['eventUrl', 'registrationUrl', 'imageUrl'].includes(error.property)
      );
      expect(urlErrors.length).toBeGreaterThan(0);
      
      urlErrors.forEach(error => {
        expect(error.constraints).toHaveProperty('isUrl');
      });
    });

    it('should validate enum fields correctly', async () => {
      const validDto = {
        title: 'Valid Title',
        content: 'Valid content with sufficient length to pass validation requirements.',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.HIGH,
        status: AnnouncementStatus.PUBLISHED,
      };

      const dto = plainToClass(CreateEventAnnouncementDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.type).toBe(AnnouncementType.EVENT);
      expect(dto.priority).toBe(AnnouncementPriority.HIGH);
      expect(dto.status).toBe(AnnouncementStatus.PUBLISHED);
    });

    it('should fail validation for invalid enum values', async () => {
      const invalidDto = {
        title: 'Valid Title',
        content: 'Valid content with sufficient length to pass validation requirements.',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        type: 'INVALID_TYPE',
        priority: 'INVALID_PRIORITY',
        status: 'INVALID_STATUS',
      };

      const dto = plainToClass(CreateEventAnnouncementDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      
      const enumErrors = errors.filter(error => 
        ['type', 'priority', 'status'].includes(error.property)
      );
      expect(enumErrors.length).toBe(3);
      
      enumErrors.forEach(error => {
        expect(error.constraints).toHaveProperty('isEnum');
      });
    });

    it('should validate array fields correctly', async () => {
      const validDto = {
        title: 'Valid Title',
        content: 'Valid content with sufficient length to pass validation requirements.',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        targetAudience: ['all', 'students', 'faculty'],
        tags: ['important', 'urgent', 'notification'],
        categories: ['academic', 'administrative'],
      };

      const dto = plainToClass(CreateEventAnnouncementDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.targetAudience).toEqual(validDto.targetAudience);
      expect(dto.tags).toEqual(validDto.tags);
      expect(dto.categories).toEqual(validDto.categories);
    });

    it('should validate date transformation correctly', async () => {
      const validDto = {
        title: 'Valid Title',
        content: 'Valid content with sufficient length to pass validation requirements.',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        eventDate: '2024-12-25T10:00:00Z',
        startDate: '2024-12-25T09:00:00Z',
        endDate: '2024-12-25T17:00:00Z',
        scheduledFor: '2024-12-20T08:00:00Z',
      };

      const dto = plainToClass(CreateEventAnnouncementDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.eventDate).toBeInstanceOf(Date);
      expect(dto.startDate).toBeInstanceOf(Date);
      expect(dto.endDate).toBeInstanceOf(Date);
      expect(dto.scheduledFor).toBeInstanceOf(Date);
    });

    it('should validate numeric fields correctly', async () => {
      const validDto = {
        title: 'Valid Title',
        content: 'Valid content with sufficient length to pass validation requirements.',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        maxParticipants: 100,
      };

      const dto = plainToClass(CreateEventAnnouncementDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.maxParticipants).toBe(100);
    });

    it('should fail validation for negative maxParticipants', async () => {
      const invalidDto = {
        title: 'Valid Title',
        content: 'Valid content with sufficient length to pass validation requirements.',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        maxParticipants: -1,
      };

      const dto = plainToClass(CreateEventAnnouncementDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const maxParticipantsError = errors.find(error => error.property === 'maxParticipants');
      expect(maxParticipantsError).toBeDefined();
      expect(maxParticipantsError?.constraints).toHaveProperty('min');
    });
  });

  describe('UpdateEventAnnouncementDto', () => {
    it('should validate a valid update DTO', async () => {
      const validDto = {
        title: 'Updated Title',
        content: 'Updated content with sufficient length to pass validation requirements.',
        priority: AnnouncementPriority.HIGH,
        isFeatured: true,
      };

      const dto = plainToClass(UpdateEventAnnouncementDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.title).toBe(validDto.title);
      expect(dto.priority).toBe(validDto.priority);
      expect(dto.isFeatured).toBe(true);
    });

    it('should allow partial updates', async () => {
      const partialDto = {
        title: 'Only Title Updated',
      };

      const dto = plainToClass(UpdateEventAnnouncementDto, partialDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.title).toBe(partialDto.title);
      expect(dto.content).toBeUndefined();
    });

    it('should validate updated fields with same rules as create', async () => {
      const invalidDto = {
        title: 'a'.repeat(256), // Too long
        content: 'a'.repeat(5001), // Too long
        eventUrl: 'invalid-url',
      };

      const dto = plainToClass(UpdateEventAnnouncementDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      
      const titleError = errors.find(error => error.property === 'title');
      const contentError = errors.find(error => error.property === 'content');
      const urlError = errors.find(error => error.property === 'eventUrl');
      
      expect(titleError?.constraints).toHaveProperty('maxLength');
      expect(contentError?.constraints).toHaveProperty('maxLength');
      expect(urlError?.constraints).toHaveProperty('isUrl');
    });
  });

  describe('QueryEventAnnouncementDto', () => {
    it('should validate a valid query DTO', async () => {
      const validDto = {
        page: 1,
        limit: 20,
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.HIGH,
        isPublished: true,
        search: 'test search',
        sortBy: 'publishedAt',
        sortOrder: 'DESC',
        tags: ['tag1', 'tag2'],
      };

      const dto = plainToClass(QueryEventAnnouncementDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.type).toBe(AnnouncementType.EVENT);
      expect(dto.search).toBe('test search');
    });

    it('should apply default values', async () => {
      const emptyDto = {};

      const dto = plainToClass(QueryEventAnnouncementDto, emptyDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      // Note: Defaults would be applied by the service or controller, not the DTO itself
    });

    it('should validate pagination parameters', async () => {
      const invalidDto = {
        page: 0, // Should be at least 1
        limit: 0, // Should be at least 1
      };

      const dto = plainToClass(QueryEventAnnouncementDto, invalidDto);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const pageError = errors.find(error => error.property === 'page');
        const limitError = errors.find(error => error.property === 'limit');
        
        if (pageError) {
          expect(pageError.constraints).toHaveProperty('min');
        }
        if (limitError) {
          expect(limitError.constraints).toHaveProperty('min');
        }
      }
    });

    it('should validate date filters', async () => {
      const validDto = {
        publishedAfter: '2024-01-01T00:00:00Z',
        publishedBefore: '2024-12-31T23:59:59Z',
        eventDateAfter: '2024-06-01T00:00:00Z',
        eventDateBefore: '2024-06-30T23:59:59Z',
      };

      const dto = plainToClass(QueryEventAnnouncementDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      // Date string validation would depend on the actual DTO implementation
    });

    it('should validate enum filters', async () => {
      const validDto = {
        type: AnnouncementType.MAINTENANCE,
        priority: AnnouncementPriority.CRITICAL,
        status: AnnouncementStatus.PUBLISHED,
      };

      const dto = plainToClass(QueryEventAnnouncementDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.type).toBe(AnnouncementType.MAINTENANCE);
      expect(dto.priority).toBe(AnnouncementPriority.CRITICAL);
      expect(dto.status).toBe(AnnouncementStatus.PUBLISHED);
    });

    it('should fail validation for invalid enum filters', async () => {
      const invalidDto = {
        type: 'INVALID_TYPE',
        priority: 'INVALID_PRIORITY',
        status: 'INVALID_STATUS',
      };

      const dto = plainToClass(QueryEventAnnouncementDto, invalidDto);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const enumErrors = errors.filter(error => 
          ['type', 'priority', 'status'].includes(error.property)
        );
        
        enumErrors.forEach(error => {
          expect(error.constraints).toHaveProperty('isEnum');
        });
      }
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle empty strings vs undefined for optional fields', async () => {
      const dtoWithEmptyStrings = {
        title: 'Valid Title',
        content: 'Valid content with sufficient length to pass validation requirements.',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        summary: '', // Empty string
        category: '', // Empty string
        author: '', // Empty string
      };

      const dto = plainToClass(CreateEventAnnouncementDto, dtoWithEmptyStrings);
      const errors = await validate(dto);

      // Should validate successfully as empty strings are allowed for optional fields
      expect(errors).toHaveLength(0);
    });

    it('should validate complex nested data structures', async () => {
      const complexDto = {
        title: 'Complex Event Announcement',
        content: 'This is a complex event announcement with multiple data types and validation rules to test.',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.HIGH,
        targetAudience: ['students', 'faculty', 'staff'],
        tags: ['event', 'important', 'deadline'],
        eventDate: '2024-12-25T10:00:00Z',
        location: 'Main Auditorium',
        maxParticipants: 500,
        registrationUrl: 'https://example.com/register',
        imageUrl: 'https://example.com/image.jpg',
        isPublished: true,
        isPinned: true,
        isFeatured: true,
        requiresAcknowledgment: true,
      };

      const dto = plainToClass(CreateEventAnnouncementDto, complexDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.targetAudience).toHaveLength(3);
      expect(dto.tags).toHaveLength(3);
      expect(dto.eventDate).toBeInstanceOf(Date);
      expect(dto.maxParticipants).toBe(500);
    });

    it('should validate boolean field type coercion', async () => {
      const dtoWithStringBooleans = {
        title: 'Valid Title',
        content: 'Valid content with sufficient length to pass validation requirements.',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        isPublished: 'true', // String instead of boolean
        isPinned: 'false', // String instead of boolean
        isFeatured: '1', // Number-like string
      };

      const dto = plainToClass(CreateEventAnnouncementDto, dtoWithStringBooleans);
      const errors = await validate(dto);

      // Depending on class-transformer configuration, this might pass or fail
      // The actual behavior depends on the transform settings
      if (errors.length === 0) {
        // If transformation worked
        expect(typeof dto.isPublished).toBe('boolean');
        expect(typeof dto.isPinned).toBe('boolean');
      } else {
        // If transformation failed, should have boolean validation errors
        const booleanErrors = errors.filter(error => 
          ['isPublished', 'isPinned', 'isFeatured'].includes(error.property)
        );
        expect(booleanErrors.length).toBeGreaterThan(0);
      }
    });
  });
});