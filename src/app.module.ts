import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { StaticModule } from './common/static/static.module';
import { UserProfile } from './users/user-profile.entity';
import { User } from './users/users.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DailyPuzzleModule } from './daily-puzzle/daily-puzzle.module';
import { PuzzleFeedbackModule } from './puzzle-feedback/puzzle-feedback.module';
import { PuzzleDependencyModule } from './puzzle-dependency/puzzle_module';
import { GameProgressModule } from './game-progress/game-progress.module';
import { NftReward } from './nft-reward/nft-reward.entity';
import { NftRewardModule } from './nft-reward/nft-reward.module';
import { GamesModule } from './games/games.module';
import { PuzzleModule } from './puzzle/puzzle.module';
import { PuzzleDraftsModule } from './puzzle-drafts/puzzle-drafts.module';
import { ImpersonationModule } from './impersonation/impersonation.module';
import { FeedbackModule } from './feedback/feedback.module';
import { DeveloperModule } from './developer/developer.module';
import { HintRecommenderModule } from './hint-recommender/hint-recommender.module';
import { AbuseDetectionModule } from './abuse-detection/abuse-detection.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: parseInt(configService.get('DATABASE_PORT')),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User, UserProfile, NftReward],
        synchronize: configService.get('DATABASE_SYNC') === 'true',
        autoLoadEntities: configService.get('DATABASE_AUTOLOAD') === 'true',
        extra: {
          client_encoding: 'utf8',
        },
      }),
    }),
    UsersModule,
    AuthModule,
    StaticModule,
    GameProgressModule,
    DailyPuzzleModule,
    PuzzleFeedbackModule,
    PuzzleDependencyModule,
    NftRewardModule,
    GamesModule,
    PuzzleModule,
    PuzzleDraftsModule,
    ImpersonationModule,
    FeedbackModule,
    DeveloperModule,
    HintRecommenderModule,
    AbuseDetectionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
