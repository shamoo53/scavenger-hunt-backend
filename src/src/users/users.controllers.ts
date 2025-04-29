import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUsersDto } from 'src/users/dto/create-user.dto';
import { GetUsersParamsDto } from 'src/users/dto/get-usersParam.dto';
import { UsersService } from './providers/users.services';

@Controller('users')
@ApiTags('Users')
export class UsersControllers {
  constructor(private readonly usersService: UsersService) {}
  @ApiResponse({
    status: 200,
    description: 'Users fetched successfully based on the query',
  })
  @ApiOperation({
    summary: 'Fetches all the users',
  })
  @Get('/:id?/')
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'The number of entries returned per query',
    example: '10',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'The page number the entry returns',
    example: '1',
  })
  public getUsers(
    @Param() getUsersParamsDto: GetUsersParamsDto,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    console.log(getUsersParamsDto);
    console.log(typeof getUsersParamsDto);

    return this.usersService.findAllUsers(getUsersParamsDto, limit, page);
  }

  @Post()
  public createUsers(@Body() createUsersDto: CreateUsersDto) {
    console.log(createUsersDto instanceof CreateUsersDto);
    return 'You have sent a post user request ';
  }
  //
  @Patch()
  public editUsers(@Body() body: any) {
    console.log(body);
    return 'You have made an edit to the user request';
  }
  //
  @Delete()
  public deleteUsers() {
    return 'You have sent a delete user request';
  }
}
