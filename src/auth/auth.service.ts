import { ForbiddenException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as argon from 'argon2'
import { AuthSignInDto, AuthSignUpDto } from './dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ApiResponseService } from 'src/api-response/api-response.service';
import { ApiResponseDto } from 'src/api-response/api-response.dto';
import { error } from 'console';
import { Neo4jService } from 'src/neo4j/neo4j.service';


@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService,
                private readonly jwtService: JwtService,
                private readonly configService: ConfigService,
                private readonly apiResponse: ApiResponseService,
                private readonly neo4j: Neo4jService
    ) { }

    async signin(authDto: AuthSignInDto): Promise<ApiResponseDto> {
        // Find user in database
        const user = await this.prisma.user.findUnique({
            where: {
                email: authDto.email
            }
        })
        if (!user) {
            throw new ForbiddenException(this.apiResponse.error("Can't find user"));
        }
        // Verify password
        const passMatch = await argon.verify(
            user.password,
            authDto.password
        )

        if (!passMatch) {
            throw new ForbiddenException(this.apiResponse.error('Credentials incorrect'));
        }

        const payload = { sub: user.id, username: user.username }
        const access_token = await this.jwtService.signAsync(
            payload,
            { expiresIn: '15m' }
        )
        const refresh_token = await this.jwtService.signAsync(
            payload, 
            { expiresIn: '2h' }
        )

        return this.apiResponse.success("Sign in successfully",  
            {
                access_token,
                refresh_token
            }
        )
    }

    async signup(authDto: AuthSignUpDto): Promise<ApiResponseDto> {
        const hash = await argon.hash(authDto.password)
    
        const prismaTransaction = await this.prisma.$transaction(async (prisma) => {
            try {
                const user = await prisma.user.create({
                    data: {
                        username: authDto.username,
                        email: authDto.email,
                        password: hash,
                        date_of_birth: authDto.dob,
                        gender: authDto.gender,
                    }
                })
                const neo4jResult = await this.neo4j.createUser(user.id, user.username, authDto.avatar_url ? authDto.avatar_url: null )
            } catch (error) {
                throw error;
            }
        });
        return this.apiResponse.success("Sign up successfully");
    }
    
    async refreshToken(refreshToken: string) {
        try {
            const oldPayload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_SECRET_KEY'),
            })
            
            const {iat, exp, ...payload} = oldPayload
            if (!payload) {
                throw new UnauthorizedException("Invalid refresh token");
            }

            const access_token = await this.jwtService.signAsync(
                payload,
                { expiresIn: '15m' }
            );
            const newRefreshToken = await this.jwtService.signAsync(
                payload, 
                { expiresIn: '1h' }
            );
            
            return this.apiResponse.success("Refresh token successful", {
                access_token,
                refresh_token: newRefreshToken
            });
        } catch (error) {
            console.log(error)
            if (error instanceof TokenExpiredError) {
                throw new UnauthorizedException(this.apiResponse.error("Refresh Token expired"), error); 
            } else {
                throw new InternalServerErrorException(this.apiResponse.error("An unexpected error occurred during refresh token", error));
            }
        }
    }
} 
    