/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { GetUsersParamsDto } from '../dto/get-usersParam.dto';

@Injectable()
export class UsersService {
  public findAllUsers(
    getUsersParamsDto: GetUsersParamsDto,
    limit: number,
    page: number,
  ) {
    return [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@gmail.com',
        password: '@Password789',
      },
      {
        firstName: 'Mary',
        lastName: 'Joe',
        email: 'maryjoe@gmail.com',
        password: '@Password456',
      },
    ];
  }
  public findOneById(id: number) {
    return [
      {
        id: 123,
        firstName: 'James',
        lastName: 'Doyce',
        email: 'jamesdoyce@gmail.com',
        password: '@Password1011',
      },
    ];
  }
}
