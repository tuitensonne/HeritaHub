import { IsDateString, IsEmail, IsEnum, IsOptional, IsString } from "class-validator"

export enum Gender {
    Male = 'Male',
    Female = 'Female',
    Other = 'Other',
}

export class updateProfile { 
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;
  
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}
