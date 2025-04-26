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
              CREATE (b)-[:FOLLOWS {createdAt: datetime()}]->(a);` ,
              { followingUserId: followingUserId, followedUserId: followedUserId } 
          );
          return { message: "Following user successfully"}
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
              { followingUserId, followedUserId }
          );
          return { message: "Unfollowed user successfully" };
      } catch (error) {
          console.log('Error while unfollowing user:', error);
          throw error;
      } finally {
          await session.close();  
      }
  }
  
  async createUser(userId: string, username: string, avatar_url: (string | null)) {
      const session: Session = this.driver.session();
      try { 
          const result = await session.run(
              `CREATE (n:User {id: $id, name: $name, avatar_url: $avatar_url})`,
              { id: userId, name: username, avatar_url: avatar_url } 
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
          { id: userId, avatar_url }
        );
    
        return result.records[0]?.get("u");  
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
          { userId, friendId }
        );
        return result.records.map(record => ({
          ...record.get("followed").properties,
          isFollowing: record.get("isFollowing")
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
        { userId, friendId }
      );
      return result.records.map(record => ({
        ...record.get("follower").properties,
        isFollowing: record.get("isFollowing")
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
              { userId, friendId }
          );
          return result.records[0].get("isFollowing");
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
              { userId, postId }
          );
          return result.records[0].get("isLike");
      } catch (error) {
          console.log('Error while checking like relationship:', error);
          throw error;
      } finally {
          await session.close();
      }
  }

  async reactToPost(userId: string, postId: string, action: string) {
    const session = this.driver.session();
    try {
      if (action === "like") {
        const result = await session.run(
          `MATCH (u:User {id: $userId}), (p:Post {id: $postId})
          MERGE (u)-[r:LIKE]->(p)
          ON CREATE SET r.createdAt = datetime()
          RETURN p`,
          { userId, postId }
        );
        
        if (result.records.length === 0) {
          throw new Error("Không tìm thấy người dùng hoặc bài đăng");
        }
        
        return result.records[0].get("p").properties;
      } else if (action === "unlike") {
        const result = await session.run(
          `MATCH (u:User {id: $userId})-[r:LIKE]->(p:Post {id: $postId})
          DELETE r
          RETURN p`,
          { userId, postId }
        );
        
        if (result.records.length === 0) {
          const checkPost = await session.run(
            `MATCH (p:Post {id: $postId}) RETURN p`,
            { postId }
          );
          
          if (checkPost.records.length === 0) {
            throw new Error("Không tìm thấy bài đăng");
          } else {
            return checkPost.records[0].get("p").properties;
          }
        }
        
        return result.records[0].get("p").properties;
      } else {
        throw new Error("Hành động không hợp lệ. Chỉ hỗ trợ 'like' hoặc 'unlike'");
      }
    } catch (error) {
      console.log('Lỗi khi tương tác với bài đăng:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async createPost(postId: string) {
    const session: Session = this.driver.session();
    try {
        const result = await session.run(
            `CREATE (p:Post {id: $postId})`,
            { postId } 
        );

        return result;  
    } catch (error) {
        console.log('Error while creating post:', error);
        throw error;
    } finally {
        await session.close();
    }
  }

  async commentToPost(userId: string, postId: string, content: string) {
    const session: Session = this.driver.session();
    const commentId = `${userId}_${Date.now()}`;
  
    try {
      const result = await session.executeWrite(async tx => {
        const res = await tx.run(
          `
          MATCH (u:User {id: $userId})
          MATCH (p:Post {id: $postId})
          CREATE (c:Comment {
            id: $commentId,
            content: $content,
            created_at: datetime()
          })
          CREATE (u)-[:WROTE]->(c)
          CREATE (p)-[:HAS_COMMENT]->(c)
          RETURN c, u
          `,
          { userId, postId, content, commentId }
        );
        return res;
      });
  
      const comment = result.records[0].get('c').properties;
      const user = result.records[0].get('u').properties;
      const createdAt = comment.created_at?.toStandardDate?.().toISOString?.() ?? null;
  
      return {
        comment: {
          id: comment.id,
          content: comment.content,
          created_at: createdAt,
        },
        user: {
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url ?? null,
        },
      };
    } catch (error) {
      console.error('Failed to comment on post:', error);
      throw error;
    } finally {
      await session.close();
    }
  }  

  async deletePost(postId: string) {
    const session: Session = this.driver.session();
    try {
        const result = await session.run(
            `MATCH (p:Post {id: $postId})
            DETACH DELETE p
            `,
            { postId } 
        );

        return result;  
    } catch (error) {
        console.log('Error while creating post:', error);
        throw error;
    } finally {
        await session.close();
    }
  }
}
