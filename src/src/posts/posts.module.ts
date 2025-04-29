import { Module } from '@nestjs/common';
import { PostService } from './providers/post.service';
import { PostsController } from './posts.controller';

@Module({
  providers: [PostService],
  controllers: [PostsController],
})
export class PostsModule {}
