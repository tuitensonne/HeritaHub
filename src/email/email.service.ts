import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        const transport = {
            service: 'gmail',  
            auth: {
              user: configService.get<string>('EMAIL_USER'), 
              pass: configService.get<string>('EMAIL_PASS')
            }
        }
        
        this.transporter = nodemailer.createTransport(transport);
    }
}