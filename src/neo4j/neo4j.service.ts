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
        { id: personId },
      );

      const friends = result.records.map(
        (record) => record.get('friend').properties,
      );
      return friends;
    } catch (error) {
      console.log('Error while getting friends:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async followUser(followingUserId: string, followedUserId: string) {
    const session: Session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (b:User {id: $followingUserId}), (a:User {id: $followedUserId})
              CREATE (b)-[:FOLLOWS {createdAt: datetime()}]->(a);`,
        { followingUserId: followingUserId, followedUserId: followedUserId },
      );
      return { message: 'Following user successfully' };
    } catch (error) {
      console.log('Error while getting friends:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async unFollowUser(followingUserId: string, followedUserId: string) {
    const session: Session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (b:User {id: $followingUserId})-[r:FOLLOWS]->(a:User {id: $followedUserId})
                DELETE r`,
        { followingUserId, followedUserId },
      );
      return { message: 'Unfollowed user successfully' };
    } catch (error) {
      console.log('Error while unfollowing user:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async createUser(
    userId: string,
    username: string,
    avatar_url: string | null,
  ) {
    const session: Session = this.driver.session();
    try {
      const result = await session.run(
        `CREATE (n:User {id: $id, name: $name, avatar_url: $avatar_url})`,
        { id: userId, name: username, avatar_url: avatar_url },
      );

      return result;
    } catch (error) {
      console.log('Error while getting friends:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async updateProfileAvatar(userId: string, avatar_url: string) {
    const session: Session = this.driver.session();
    try {
      const result = await session.run(
        `
          MATCH (u:User {id: $id})
          SET u.avatar_url = $avatar_url
          RETURN u
          `,
        { id: userId, avatar_url },
      );

      return result.records[0]?.get('u');
    } catch (error) {
      console.log('Error while updating avatar_url:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getFollowing(userId: string, friendId: string) {
    const session: Session = this.driver.session();
    try {
      const result = await session.run(
        `
          MATCH (user:User {id: $userId})
          MATCH (friend:User {id: $friendId})-[:FOLLOWS]->(followed:User)
          OPTIONAL MATCH (user)-[f:FOLLOWS]->(followed)
          RETURN followed, CASE WHEN f IS NOT NULL THEN true ELSE false END as isFollowing
          `,
        { userId, friendId },
      );
      return result.records.map((record) => ({
        ...record.get('followed').properties,
        isFollowing: record.get('isFollowing'),
      }));
    } catch (error) {
      console.log('Error while getting following list:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getFollowed(userId: string, friendId: string) {
    const session: Session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (user:User {id: $userId})
        MATCH (friend:User {id: $friendId})<-[:FOLLOWS]-(follower:User)
        OPTIONAL MATCH (user)-[f:FOLLOWS]->(follower)
        RETURN follower, CASE WHEN f IS NOT NULL THEN true ELSE false END as isFollowing
        `,
        { userId, friendId },
      );
      return result.records.map((record) => ({
        ...record.get('follower').properties,
        isFollowing: record.get('isFollowing'),
      }));
    } catch (error) {
      console.log('Error while getting followers list:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async isFollowing(userId: string, friendId: string): Promise<boolean> {
    const session: Session = this.driver.session();
    try {
      const result = await session.run(
        `
              MATCH (u:User {id: $userId})-[:FOLLOWS]->(f:User {id: $friendId})
              RETURN COUNT(*) > 0 AS isFollowing
              `,
        { userId, friendId },
      );
      return result.records[0].get('isFollowing');
    } catch (error) {
      console.log('Error while checking follow relationship:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async isLike(userId: string, postId: string) {
    const session: Session = this.driver.session();
    try {
      const result = await session.run(
        `
              MATCH (u:User {id: $userId})-[r:LIKE]->(p:Post {id: $postId})
              RETURN COUNT(*) > 0 AS isLike
              `,
        { userId, postId },
      );
      return result.records[0].get('isLike');
    } catch (error) {
      console.log('Error while checking like relationship:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async reactToPost(userId: string, postId: string, action: string) {
    const session: Session = this.driver.session();
    try {
      if (action === 'like') {
        const result = await session.run(
          `MATCH (u:User {id: $userId}), (p:Post {id: $postId})
            MERGE (u)-[r:LIKE]->(p)
            ON CREATE SET r.createdAt = datetime()
            ON MATCH SET r.createdAt = datetime()
            RETURN p, r`,
          { userId, postId },
        );
        return result.records[0].get('p').properties;
      } else {
        const result = await session.run(
          `MATCH (u:User {id: $userId})-[r:LIKE]->(p:Post {id: $postId})
            DELETE r
            RETURN p`,
          { userId, postId },
        );
        return result.records[0].get('p').properties;
      }
    } catch (error) {
      console.log('Error while reacting to post:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
  async checkFollow(userId: string, targetId: string): Promise<boolean> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[f:FOLLOWS]->(t:User {id: $targetId})
        RETURN COUNT(f) > 0 AS isFollowing
        `,
        { userId, targetId },
      );
      return result.records[0]?.get('isFollowing') ?? false;
    } finally {
      await session.close();
    }
  }
  async createGroup(
    groupId: string,
    groupName: string,
    memberIds: string[],
  ): Promise<any> {
    const session: Session = this.driver.session();
    try {
      const result = await session.run(
        `
        CREATE (g:Group {id: $groupId, name: $groupName, createdAt: datetime()})
        WITH g
        UNWIND $memberIds AS memberId
        MATCH (u:User {id: memberId})
        CREATE (u)-[:MEMBER_OF {joinedAt: datetime()}]->(g)
        RETURN g, COLLECT(u) AS members
        `,
        { groupId, groupName, memberIds },
      );

      const group = result.records[0].get('g').properties;
      const members = result.records[0]
        .get('members')
        .map((record: any) => record.properties);

      return {
        id: group.id,
        name: group.name,
        createdAt: group.createdAt,
        members,
      };
    } catch (error) {
      console.log('Error while creating group:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
}
