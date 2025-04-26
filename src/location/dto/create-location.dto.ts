import { IsNumber, IsOptional, IsString } from "class-validator"

export class CreateLocationDto {
    @IsString()
    name: string
    
    @IsString()
    @IsOptional()
    address?: string

    @IsNumber({ allowInfinity: false, allowNaN: false})
    latitude: number

    @IsNumber({ allowInfinity: false, allowNaN: false})
    longitude: number
}
