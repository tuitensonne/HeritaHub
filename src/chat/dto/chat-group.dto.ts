import { IsString } from 'class-validator';

export class ChatGroupMessageDto {
  @IsString()
  senderId: string;
  @IsString()
  groupId: string;
  @IsString()
  content: string;
}
