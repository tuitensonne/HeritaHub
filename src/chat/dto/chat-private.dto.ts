import { IsString } from 'class-validator';
export class ChatPrivateMessageDto {
  @IsString()
  senderId: string;
  @IsString()
  receiverId: string;
  @IsString()
  content: string;
}
