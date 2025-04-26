import { Module } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import * as neo4j from 'neo4j-driver';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({ 
  imports: [ConfigModule],
  providers: [
    {
      provide: 'NEO4J_DRIVER',
      inject: [ConfigService], 
      useFactory: async (configService: ConfigService) => {
        const neo4jUri = configService.get<string>('NEO4J_URI', 'bolt://localhost:7687'); 
        const neo4jUsername = configService.get<string>('NEO4J_USER', 'neo4j');
        const neo4jPassword = configService.get<string>('NEO4J_PASS', 'password');

        try {
          const driver = neo4j.driver(
            neo4jUri,
            neo4j.auth.basic(neo4jUsername, neo4jPassword),
          );
          return driver;
        } catch (error) {
          console.log('Error connecting to Neo4j:', error);
          throw new Error('Failed to connect to Neo4j');
        }
      },
    },
    Neo4jService,
  ],
  exports: [Neo4jService],
})
export class Neo4jModule {}
