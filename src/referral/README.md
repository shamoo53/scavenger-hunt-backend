# Referral Module

A standalone NestJS module for handling user referrals in a gamified blockchain application.

## Features

- Unique referral code generation for each user
- Referral relationship tracking
- Referral statistics and leaderboard
- Metadata storage for analytics (IP address, user agent, referral date)

## Installation

The module is designed to be standalone and only requires TypeORM for PostgreSQL as an external dependency.

1. Ensure you have the required dependencies in your NestJS project:
```bash
npm install @nestjs/typeorm typeorm pg nanoid
```

2. Import the ReferralModule into your AppModule:

```typescript
import { ReferralModule } from './referral/referral.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // your database configuration
    }),
    ReferralModule,
  ],
})
export class AppModule {}
```

## API Endpoints

### Register a Referral

```http
POST /referral/register
```

Request body:
```json
{
  "userId": "uuid",
  "referralCode": "optional-referral-code",
  "ipAddress": "optional-ip-address",
  "userAgent": "optional-user-agent"
}
```

Response:
```json
{
  "success": true,
  "referralCode": "ABC12345",
  "message": "Referral registration successful"
}
```

### Get Referral Stats

```http
GET /referral/:userId
```

Response:
```json
{
  "userId": "uuid",
  "referralCode": "ABC12345",
  "totalReferrals": 5,
  "referredUsers": [
    {
      "userId": "uuid",
      "joinedAt": "2025-04-30T..."
    }
  ]
}
```

### Get Leaderboard

```http
GET /referral?limit=10
```

Response:
```json
[
  {
    "userId": "uuid",
    "referralCount": 10
  }
]
```

## Error Handling

The module includes proper error handling for common scenarios:

- `ConflictException`: When a user already has a referral code
- `NotFoundException`: When an invalid referral code is used or user not found
- Automatic retry for referral code generation collisions

## Database Schema

The module uses TypeORM with a PostgreSQL database. The schema includes:

- `id`: UUID primary key
- `userId`: UUID of the user
- `referralCode`: Unique 8-character code
- `referredBy`: UUID of the referring user (nullable)
- `referralCount`: Number of successful referrals
- `metadata`: JSONB field for analytics data
- `createdAt`: Timestamp of referral creation

## Testing

Run the unit tests:

```bash
npm run test src/referral/tests/referral.service.spec.ts
```

## License

MIT