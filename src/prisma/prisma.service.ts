import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient {
    constructor(private readonly configService: ConfigService) {
        super({
            datasources: {
                db: {
                    url: configService.get<string>('DATABASE_URL')
                }
           }
        });
        console.log("Connected to Database")
    }
}
