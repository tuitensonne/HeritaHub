import { Inject, Injectable } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService {
    constructor(@Inject('NEO4J_DRIVER') private readonly driver: Driver) {}

    async getFriends(personId: number): Promise<any[]> {
        const session: Session = this.driver.session();
        try {
            const result = await session.run(
                `MATCH (p:Person {id: $id})-[r:ADD_FRIEND]->(friend:Person)
                RETURN friend`,
                { id: personId } 
            );
    
            const friends = result.records.map(record => record.get('friend').properties);
            return friends;  
        } catch (error) {
            console.error('Error while getting friends:', error);
            throw error;
        } finally {
            await session.close();  
        }
    }
    
    
}
