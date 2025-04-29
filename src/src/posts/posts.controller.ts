import {
  Controller,
  // Get,
  // Param,
  // Query,
  // DefaultValuePipe,
  // ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';
// import { GetPostsParamsDto } from './dto/get-postsParam.dto';
import { PostService } from './providers/post.service';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postService: PostService) {}

  @Post()
  public createPost(@Body() createPostDto: CreatePostDto) {}
  // @Get('/:id?')
  // public getPosts(
  //   @Param() getPostsParamsDto: GetPostsParamsDto,
  //   @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  //   @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  // ) {
  //   return this.postService.findAllPosts();
  // }
}
