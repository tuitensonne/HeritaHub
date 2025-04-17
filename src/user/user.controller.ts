import { Body, Controller, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { Neo4jService } from 'src/neo4j/neo4j.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService,
    private readonly neo4j: Neo4jService
  ) {}

  @Post() 
  async addFriend(
    @Query('user1') user1: number
  ) {
    return this.neo4j.getFriends(+user1)
  }
}
