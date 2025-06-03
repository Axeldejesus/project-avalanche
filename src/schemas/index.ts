import { z } from 'zod';

// User Profile Schema
export const UserProfileSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email format"),
  profilePicture: z.boolean().optional(),
  profileImageUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional()
});

// Review Schema
export const ReviewSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
  username: z.string().min(1, "Username is required"),
  userProfileImage: z.string().optional(),
  gameId: z.number().int().positive("Game ID must be a positive integer"),
  gameName: z.string().min(1, "Game name is required"),
  gameCover: z.string().min(1, "Game cover is required"),
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z.string().min(1, "Comment is required"),
  createdAt: z.string(),
  updatedAt: z.string()
});

// List Schema
export const ListSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "List name is required").max(100, "List name too long"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// List Game Schema
export const ListGameSchema = z.object({
  gameId: z.number().int().positive("Game ID must be a positive integer"),
  gameName: z.string().min(1, "Game name is required"),
  gameCover: z.string().min(1, "Game cover is required"),
  addedAt: z.string(),
  notes: z.string().optional()
});

// Collection Item Schema
export const CollectionItemSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
  gameId: z.number().int().positive("Game ID must be a positive integer"),
  gameName: z.string().min(1, "Game name is required"),
  gameCover: z.string().min(1, "Game cover is required"),
  platform: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  genre: z.string().optional(),
  genres: z.array(z.string()).optional(),
  status: z.enum(["completed", "playing", "toPlay", "abandoned", "wishlist"]),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  hoursPlayed: z.number().min(0).optional(),
  addedAt: z.string(),
  updatedAt: z.string()
});

// Collection Stats Schema
export const CollectionStatsSchema = z.object({
  total: z.number().min(0),
  completed: z.number().min(0),
  playing: z.number().min(0),
  toPlay: z.number().min(0),
  abandoned: z.number().min(0),
  wishlist: z.number().min(0)
});

// Input validation schemas
export const LoginInputSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const RegisterInputSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long")
});

export const ReviewInputSchema = z.object({
  gameId: z.number().int().positive("Game ID must be a positive integer"),
  gameName: z.string().min(1, "Game name is required"),
  gameCover: z.string().min(1, "Game cover is required"),
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z.string().min(1, "Comment is required").or(z.literal("")).transform(val => val === "" ? "No comment provided" : val)
});

export const UpdateReviewInputSchema = z.object({
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5").optional(),
  comment: z.string().min(1, "Comment cannot be empty").optional()
}).refine(data => data.rating !== undefined || data.comment !== undefined, {
  message: "At least one field (rating or comment) must be provided"
});

export const CreateListInputSchema = z.object({
  name: z.string().min(1, "List name is required").max(100, "List name too long"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional()
});

export const UpdateListInputSchema = z.object({
  name: z.string().min(1, "List name is required").max(100, "List name too long").optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional()
}).refine(data => Object.values(data).some(val => val !== undefined), {
  message: "At least one field must be provided"
});

// Add input schemas for collection operations
export const AddToCollectionInputSchema = z.object({
  gameId: z.number().int().positive("Game ID must be a positive integer"),
  gameName: z.string().min(1, "Game name is required"),
  gameCover: z.string().min(1, "Game cover is required"),
  status: z.enum(["completed", "playing", "toPlay", "abandoned", "wishlist"]),
  platform: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  genre: z.string().optional(),
  genres: z.array(z.string()).optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  hoursPlayed: z.number().min(0).optional()
});

export const UpdateCollectionItemInputSchema = z.object({
  status: z.enum(["completed", "playing", "toPlay", "abandoned", "wishlist"]).optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  hoursPlayed: z.number().min(0).optional(),
  platform: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  genre: z.string().optional(),
  genres: z.array(z.string()).optional()
}).refine(data => Object.values(data).some(val => val !== undefined), {
  message: "At least one field must be provided"
});

// Add list management input schemas
export const AddToListInputSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  gameId: z.number().int().positive("Game ID must be a positive integer"),
  gameName: z.string().min(1, "Game name is required"),
  gameCover: z.string().min(1, "Game cover is required"),
  notes: z.string().optional()
});

// Type exports
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type List = z.infer<typeof ListSchema>;
export type ListGame = z.infer<typeof ListGameSchema>;
export type CollectionItem = z.infer<typeof CollectionItemSchema>;
export type CollectionStats = z.infer<typeof CollectionStatsSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type ReviewInput = z.infer<typeof ReviewInputSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewInputSchema>;
export type CreateListInput = z.infer<typeof CreateListInputSchema>;
export type UpdateListInput = z.infer<typeof UpdateListInputSchema>;
export type AddToCollectionInput = z.infer<typeof AddToCollectionInputSchema>;
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionItemInputSchema>;
export type AddToListInput = z.infer<typeof AddToListInputSchema>;
