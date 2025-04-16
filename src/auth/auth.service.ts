import { ForbiddenException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as argon from 'argon2'
import { AuthSignInDto, AuthSignUpDto } from './dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';


@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService,
                private readonly jwtService: JwtService
    ) { }

    async signin(authDto: AuthSignInDto): Promise<{ access_token: string , refresh_token: string }> {
        // Find user in database
        const user = await this.prisma.user.findUnique({
            where: {
                email: authDto.email
            }
        })
        if (!user) {
            throw new ForbiddenException('Credentials incorrect')
        }
        // Verify password
        const passMatch = await argon.verify(
            user.password,
            authDto.password
        )

        if (!passMatch) {
            throw new ForbiddenException("Credentials incorrect")
        }

        

        const payload = { sub: user.ID, email: user.email }
        const access_token = await this.jwtService.signAsync(
            payload,
            { expiresIn: '15m' }
        )
        const refresh_token = await this.jwtService.signAsync(
            payload, 
            { expiresIn: '2h' }
        )

        return {
            access_token,
            refresh_token
        }
    }

    async signup(authDto: AuthSignUpDto) {
        const hash = await argon.hash(authDto.password)

        try {
            const user = await this.prisma.user.create({
                data: {
                    username: authDto.username,
                    email: authDto.email,
                    password: hash,
                }
            })
            return user
        } catch (error) {
            console.log(error)
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code == 'P2002')
                    throw new ForbiddenException('Email has been used')
            }
            throw new Error("Error occured! Please try again");
        }

    }

    async refreshToken(refreshToken: string) {
        try {
            const oldPayload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_SECRET_KEY,
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
            
            return {
                access_token,
                refresh_token: newRefreshToken
            };
        } catch (error) {
            console.log(error)
            if (error instanceof TokenExpiredError) {
                throw new UnauthorizedException({statusCode: 1001, message: 'Refresh token expired', error: error}); 
            } else {
                throw new InternalServerErrorException("An unexpected error occurred during refresh token");
            }
        }
    }
} 
    