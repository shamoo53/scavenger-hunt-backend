# Event Announcements Module - Enhanced 🚀

A comprehensive and feature-rich system for managing event announcements, competitions, and game-related notifications with real-time capabilities, advanced analytics, intelligent caching, and template management.

## ✨ Enhanced Features

### 🆕 New Capabilities

- **Real-time Notifications** 🔔 - WebSocket-based instant notifications
- **Advanced Analytics** 📊 - Detailed engagement tracking and insights
- **Intelligent Caching** ⚡ - Multi-level caching for optimal performance
- **Template System** 📝 - Reusable announcement templates with variables
- **Enhanced API** 🔧 - Additional controllers for analytics and templates

### Core Functionality

- **Full CRUD Operations**: Create, read, update, and delete event announcements
- **Advanced Search & Filtering**: Search through titles, content, and metadata with comprehensive filtering options
- **Event Management**: Support for competitions, game events, maintenance notices, and general announcements
- **Content Management**: Rich content support with summaries, images, and multimedia URLs
- **Publication Control**: Draft, published, and scheduled announcement states

### Event-Specific Features

- **Event Types**: Support for 10 different announcement types (event, competition, maintenance, update, general, promotion, community, partnership, achievement, notice)
- **Priority System**: Four priority levels (low, normal, high, urgent) for importance ranking
- **Event Scheduling**: Start date, end date, and automatic publishing at scheduled times
- **Location Support**: Physical and virtual event location management
- **Participation Tracking**: Maximum participants and current participant count
- **Registration Integration**: Direct links to event registration and information pages

### Admin & Management Features

- **User Management**: Track who created and updated announcements
- **Bulk Operations**: Perform batch operations on multiple announcements
- **Soft Delete**: Safe deletion with restore capability
- **Featured & Pinned**: Highlight important announcements
- **Engagement Tracking**: Views, likes, shares, and acknowledgment counts
- **Analytics**: Comprehensive statistics and trending analysis

### Targeting & Visibility

- **Audience Targeting**: Target specific user groups (all, new-users, premium-users, developers)
- **Category System**: Organize announcements by custom categories
- **Tag System**: Flexible tagging for enhanced discoverability
- **Notification Settings**: Control email, push, dashboard, and in-app notifications
- **Content Validation**: Automatic content sanitization and validation

## API Endpoints

### Announcement Management

#### Core CRUD

- `POST /event-announcements` - Create a new announcement
- `GET /event-announcements` - Get paginated list with advanced filtering
- `GET /event-announcements/:id` - Get specific announcement (auto-increments view count)
- `PATCH /event-announcements/:id` - Update announcement
- `DELETE /event-announcements/:id` - Soft delete announcement

#### Content Discovery

- `GET /event-announcements/published` - Get all published announcements
- `GET /event-announcements/featured` - Get featured announcements
- `GET /event-announcements/pinned` - Get pinned announcements
- `GET /event-announcements/popular?limit=10` - Get popular announcements by engagement
- `GET /event-announcements/trending?days=7&limit=10` - Get trending announcements
- `GET /event-announcements/by-tags?tags=tag1,tag2&limit=20` - Get announcements by tags

#### Filtering & Categorization

- `GET /event-announcements/type/:type` - Get announcements by type
- `GET /event-announcements/category/:category` - Get announcements by category
- `GET /event-announcements/types` - Get available announcement types
- `GET /event-announcements/categories` - Get available categories
- `GET /event-announcements/tags` - Get all available tags

#### Analytics & Statistics

- `GET /event-announcements/statistics` - Get comprehensive statistics

### Engagement Tracking

- `POST /event-announcements/:id/view` - Manually increment view count
- `POST /event-announcements/:id/like` - Like announcement
- `DELETE /event-announcements/:id/like` - Unlike announcement
- `POST /event-announcements/:id/share` - Increment share count

### Admin Operations

- `POST /event-announcements/:id/restore` - Restore soft-deleted announcement
- `DELETE /event-announcements/:id/hard` - Permanently delete announcement
- `POST /event-announcements/bulk-action` - Perform bulk operations

## Query Parameters

The main `GET /event-announcements` endpoint supports extensive filtering:

### Pagination

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

### Basic Filtering

- `type` - Filter by announcement type
- `status` - Filter by status (draft, published, archived, expired)
- `priority` - Filter by priority (low, normal, high, urgent)
- `category` - Filter by category
- `isPublished` - Filter by publication status
- `isActive` - Filter by active status
- `isFeatured` - Filter by featured status
- `isPinned` - Filter by pinned status
- `author` - Filter by author name

### Advanced Filtering

- `tags` - Filter by tags (array)
- `targetAudience` - Filter by target audience (array)
- `search` - Full-text search across title, content, and summary

### Date Range Filtering

- `eventDateAfter` / `eventDateBefore` - Filter by event dates
- `publishedAfter` / `publishedBefore` - Filter by publication dates
- `scheduledAfter` / `scheduledBefore` - Filter by scheduled dates

### Engagement Filtering

- `minViews` - Minimum view count
- `minLikes` - Minimum like count

### Sorting

- `sortBy` - Sort field (createdAt, updatedAt, publishedAt, eventDate, title, priority, viewCount, etc.)
- `sortOrder` - Sort direction (ASC, DESC)

### Admin Options

- `includeDeleted` - Include soft-deleted announcements
- `includeExpired` - Include expired announcements
- `includeScheduled` - Include scheduled announcements

## Data Model

### EventAnnouncement Entity

#### Core Fields

- `id` - UUID primary key
- `title` - Announcement title (required, 10-255 chars)
- `content` - Full announcement content (required, 50-5000 chars)
- `summary` - Optional summary (max 500 chars)
- `type` - Announcement type (enum)
- `priority` - Priority level (enum)
- `status` - Current status (enum)

#### Publication & Visibility

- `isPublished` - Publication status
- `isActive` - Active status
- `isFeatured` - Featured status
- `isPinned` - Pinned status
- `allowComments` - Comment permissions
- `notifyUsers` - User notification flag

#### Event-Specific

- `eventDate` - Main event date
- `startDate` - Event start date
- `endDate` - Event end date
- `location` - Event location
- `eventUrl` - Event information URL
- `registrationUrl` - Registration link
- `maxParticipants` - Maximum participants
- `currentParticipants` - Current participant count

#### Content & Media

- `imageUrl` - Featured image URL
- `bannerUrl` - Banner image URL
- `readingTimeMinutes` - Calculated reading time

#### Targeting & Organization

- `category` - Custom category
- `tags` - Array of tags
- `targetAudience` - Target audience array
- `author` - Author name

#### Engagement Metrics

- `viewCount` - View count
- `likeCount` - Like count
- `shareCount` - Share count
- `clickCount` - Click count
- `acknowledgeCount` - Acknowledgment count

#### Competition/Event Details

- `rules` - Event/competition rules
- `prizes` - Prize information
- `requirements` - Participation requirements

#### Admin & Metadata

- `createdBy` - Creator user ID
- `updatedBy` - Last updater user ID
- `createdByName` - Creator name
- `updatedByName` - Last updater name
- `slug` - SEO-friendly URL slug
- `metaDescription` - SEO meta description
- `metaKeywords` - SEO keywords array

#### Scheduling & Publishing

- `publishAt` - Scheduled publish time
- `publishedAt` - Actual publication time
- `scheduledFor` - Scheduled activation time
- `expireAt` - Expiration time

#### Notification Settings

- `sendNotification` - Send notifications
- `sendEmail` - Send email notifications
- `sendPush` - Send push notifications
- `showInDashboard` - Show in dashboard
- `showInApp` - Show in application

#### System Fields

- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- `deletedAt` - Soft deletion timestamp

## Bulk Operations

The module supports the following bulk actions via `POST /event-announcements/bulk-action`:

### Publication Control

- `publish` - Publish multiple announcements
- `unpublish` - Unpublish multiple announcements

### Visibility Control

- `activate` / `deactivate` - Control active status
- `feature` / `unfeature` - Control featured status
- `pin` / `unpin` - Control pinned status

### Priority Management

- `high-priority` / `urgent-priority` / `normal-priority` / `low-priority`

### Comment & Notification Control

- `enable-comments` / `disable-comments`
- `enable-notifications` / `disable-notifications`

### Cleanup Operations

- `delete` / `archive` - Soft delete announcements

## Scheduled Tasks

The module includes automated scheduled tasks:

### Automatic Publishing

- **Frequency**: Every minute
- **Function**: Automatically publishes announcements when their `scheduledFor` time is reached
- **Actions**: Sets `isPublished: true`, `publishedAt: current time`, `scheduledFor: null`

## Security Features

### Content Sanitization

- Automatic removal of potentially dangerous HTML elements (`<script>`, `<iframe>`)
- JavaScript URL and event handler removal
- XSS prevention measures

### Input Validation

- Comprehensive DTO validation using class-validator
- Title length validation (10-255 characters)
- Content length validation (50-5000 characters)
- URL format validation for media links
- Enum validation for type, priority, and status fields

### Slug Validation

- Automatic unique slug generation from titles
- Custom slug validation (lowercase letters, numbers, hyphens only)
- Duplicate slug prevention

## Database Indexes

The module includes optimized database indexes for:

- Announcement type filtering
- Priority-based queries
- Status filtering
- Active status queries
- Date range queries (startDate, endDate)
- Target audience filtering
- Admin user queries

## Module Architecture

### Dependencies

- **NestJS**: Core framework
- **TypeORM**: Database ORM with PostgreSQL support
- **class-validator**: DTO validation
- **class-transformer**: Query parameter transformation
- **@nestjs/schedule**: Scheduled task support

### Module Structure

```
src/event-announcements/
├── entities/
│   └── event-announcement.entity.ts    # TypeORM entity definition
├── dto/
│   ├── create-event-announcement.dto.ts # Create announcement validation
│   ├── update-event-announcement.dto.ts # Update announcement validation
│   └── query-event-announcement.dto.ts  # Query parameters validation
├── enums/
│   └── announcement.enum.ts             # Type, priority, status enums
├── event-announcements.controller.ts   # REST API endpoints
├── event-announcements.service.ts      # Business logic
├── event-announcements.module.ts       # Module configuration
└── README.md                          # This documentation
```

### Integration

The module is registered in the main application module (`app.module.ts`) and is completely standalone with no dependencies on other application modules.

## Testing

The module is designed to support comprehensive testing including:

- Unit tests for service methods
- Integration tests for module components
- End-to-end tests for complete workflows
- Edge case and error handling tests
- Performance and load tests

## Usage Examples

### Create Event Announcement

```typescript
POST /event-announcements
{
  "title": "StarkNet Gaming Tournament 2024",
  "content": "Join us for the biggest gaming tournament of the year...",
  "type": "competition",
  "priority": "high",
  "category": "gaming",
  "tags": ["tournament", "gaming", "prizes"],
  "eventDate": "2024-03-15T10:00:00Z",
  "location": "Virtual",
  "maxParticipants": 1000,
  "prizes": "1st: $10,000, 2nd: $5,000, 3rd: $2,500",
  "registrationUrl": "https://example.com/register",
  "createdBy": "admin-user-id"
}
```

### Query Announcements

```bash
GET /event-announcements?type=competition&priority=high&isPublished=true&page=1&limit=10&sortBy=eventDate&sortOrder=ASC
```

### Bulk Operations

```typescript
POST /event-announcements/bulk-action
{
  "ids": ["id1", "id2", "id3"],
  "action": "feature"
}
```

This module provides a complete, production-ready solution for managing event announcements with extensive features for content management, user engagement, and administrative control.
