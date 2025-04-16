import { IsString } from "class-validator"

export class AuthSignUpDto {
    @IsString()
    username: string

    @IsString()
    email: string

    @IsString()
    password: string
}

export class AuthSignInDto {
    @IsString()
    email: string

    @IsString()
    password: string
}

