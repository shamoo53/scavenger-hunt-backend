# StarkNet News Module

A standalone module for managing and displaying latest news articles from the StarkNet ecosystem.

## Features

- **Full CRUD Operations**: Create, read, update, and delete news articles
- **Advanced Search**: Search through titles, content, and summaries
- **Category Management**: Organize news by categories with automatic category listing
- **Publication Status**: Control article visibility with published/unpublished states
- **Pagination**: Built-in pagination support for efficient data loading
- **Rich Content**: Support for summaries, images, source URLs, and author information
- **Sorting**: Flexible sorting by publication date, creation date, title, or category

## API Endpoints

### News Management

- `POST /starknet-news` - Create a new news article
- `GET /starknet-news` - Get paginated list of news articles with filtering
- `GET /starknet-news/:id` - Get a specific news article
- `PATCH /starknet-news/:id` - Update a news article
- `DELETE /starknet-news/:id` - Delete a news article

### Public Endpoints

- `GET /starknet-news/published` - Get all published news articles
- `GET /starknet-news/categories` - Get list of available categories
- `GET /starknet-news/category/:category` - Get news articles by category

## Query Parameters

The main `GET /starknet-news` endpoint supports the following query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `category` - Filter by category
- `isPublished` - Filter by publication status (true/false)
- `search` - Search in title, content, and summary
- `sortBy` - Sort field (publishedAt, createdAt, title, category)
- `sortOrder` - Sort direction (ASC, DESC)

## Example Requests

### Create News Article

```bash
POST /starknet-news
Content-Type: application/json

{
  "title": "StarkNet Mainnet Alpha Launch",
  "content": "StarkNet has officially launched its mainnet alpha...",
  "summary": "StarkNet launches mainnet alpha with improved scalability",
  "category": "announcement",
  "imageUrl": "https://example.com/image.jpg",
  "sourceUrl": "https://starkware.co/announcement",
  "author": "StarkWare Team",
  "isPublished": true
}
```

### Get Published News with Pagination

```bash
GET /starknet-news?isPublished=true&page=1&limit=10&sortBy=publishedAt&sortOrder=DESC
```

### Search News Articles

```bash
GET /starknet-news?search=mainnet&category=announcement
```

## Data Model

The news entity includes the following fields:

- `id` - UUID primary key
- `title` - Article title (required, max 255 chars)
- `content` - Full article content (required, max 10,000 chars)
- `summary` - Optional summary (max 500 chars)
- `imageUrl` - Optional featured image URL
- `sourceUrl` - Optional source/reference URL
- `category` - Article category (default: 'general')
- `isPublished` - Publication status (default: true)
- `author` - Optional author name
- `publishedAt` - Publication timestamp (auto-set when published)
- `createdAt` - Creation timestamp (auto-generated)
- `updatedAt` - Last update timestamp (auto-updated)

## Database Indexes

The module includes optimized database indexes for:

- Publication date sorting
- Publication status filtering
- Category filtering

## Dependencies

- NestJS framework
- TypeORM for database operations
- class-validator for DTO validation
- class-transformer for query parameter transformation

## Module Structure

```
src/starknet-news/
├── entities/
│   └── news.entity.ts           # TypeORM entity definition
├── dto/
│   ├── create-news.dto.ts       # Create news validation
│   ├── update-news.dto.ts       # Update news validation
│   └── query-news.dto.ts        # Query parameters validation
├── starknet-news.controller.ts  # REST API endpoints
├── starknet-news.service.ts     # Business logic
├── starknet-news.module.ts      # Module configuration
├── starknet-news.service.spec.ts    # Service unit tests
└── starknet-news.controller.spec.ts # Controller unit tests
```

## Testing

The module includes comprehensive unit tests for both the service and controller layers, ensuring reliability and maintainability.
