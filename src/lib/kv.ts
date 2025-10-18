import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";
import { APP_NAME } from "./constants";
import type { Transaction } from "./blockchain";

export interface Post {
  id: string;
  fid: number;
  walletAddress: string;
  transaction: Transaction;
  comment: string;
  createdAt: number;
  likes: number;
  likedBy: number[]; // Array of fids who liked this post
}

// In-memory fallback storage
const localStore = new Map<string, FrameNotificationDetails>();

// Use Redis if KV env vars are present, otherwise use in-memory
const useRedis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
const redis = useRedis ? new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
}) : null;

function getUserNotificationDetailsKey(fid: number): string {
  return `${APP_NAME}:user:${fid}`;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<FrameNotificationDetails | null> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    return await redis.get<FrameNotificationDetails>(key);
  }
  return localStore.get(key) || null;
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    await redis.set(key, notificationDetails);
  } else {
    localStore.set(key, notificationDetails);
  }
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    await redis.del(key);
  } else {
    localStore.delete(key);
  }
}

// Posts storage functions
function getPostKey(postId: string): string {
  return `${APP_NAME}:post:${postId}`;
}

function getPostsIndexKey(): string {
  return `${APP_NAME}:posts:index`;
}

function getUserPostsKey(fid: number): string {
  return `${APP_NAME}:user:${fid}:posts`;
}

export async function createPost(post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'likedBy'>): Promise<Post> {
  const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fullPost: Post = {
    ...post,
    id,
    createdAt: Date.now(),
    likes: 0,
    likedBy: []
  };

  const postKey = getPostKey(id);
  const postsIndexKey = getPostsIndexKey();
  const userPostsKey = getUserPostsKey(post.fid);

  if (redis) {
    // Store the post
    await redis.set(postKey, fullPost);
    
    // Add to global posts index (sorted by timestamp)
    await redis.zadd(postsIndexKey, { score: fullPost.createdAt, member: id });
    
    // Add to user's posts index
    await redis.zadd(userPostsKey, { score: fullPost.createdAt, member: id });
  } else {
    // In-memory fallback
    localStore.set(postKey, fullPost as any);
  }

  return fullPost;
}

export async function getPost(postId: string): Promise<Post | null> {
  const key = getPostKey(postId);
  if (redis) {
    return await redis.get<Post>(key);
  }
  const stored = localStore.get(key);
  return stored ? (stored as unknown as Post) : null;
}

export async function getRecentPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
  const postsIndexKey = getPostsIndexKey();
  
  if (redis) {
    // Get post IDs sorted by timestamp (newest first)
    const postIds = await redis.zrange(postsIndexKey, offset, offset + limit - 1, { rev: true });
    
    if (postIds.length === 0) return [];
    
    // Fetch all posts
    const posts = await Promise.all(
      (postIds as string[]).map(id => redis.get<Post>(getPostKey(id)))
    );
    
    return posts.filter((post: Post | null) => post !== null) as Post[];
  }
  
  // In-memory fallback - not ideal for production
  return [];
}

export async function getUserPosts(fid: number, limit: number = 10): Promise<Post[]> {
  const userPostsKey = getUserPostsKey(fid);
  
  if (redis) {
    const postIds = await redis.zrange(userPostsKey, 0, limit - 1, { rev: true });
    
    if (postIds.length === 0) return [];
    
    const posts = await Promise.all(
      (postIds as string[]).map(id => redis.get<Post>(getPostKey(id)))
    );
    
    return posts.filter((post: Post | null) => post !== null) as Post[];
  }
  
  return [];
}

export async function likePost(postId: string, fid: number): Promise<boolean> {
  const postKey = getPostKey(postId);
  
  if (redis) {
    const post = await redis.get<Post>(postKey);
    if (!post) return false;
    
    // Check if already liked
    if (post.likedBy.includes(fid)) return false;
    
    // Add like
    post.likes += 1;
    post.likedBy.push(fid);
    
    await redis.set(postKey, post);
    return true;
  }
  
  return false;
}

export async function unlikePost(postId: string, fid: number): Promise<boolean> {
  const postKey = getPostKey(postId);
  
  if (redis) {
    const post = await redis.get<Post>(postKey);
    if (!post) return false;
    
    // Check if not liked
    if (!post.likedBy.includes(fid)) return false;
    
    // Remove like
    post.likes -= 1;
    post.likedBy = post.likedBy.filter(id => id !== fid);
    
    await redis.set(postKey, post);
    return true;
  }
  
  return false;
}
