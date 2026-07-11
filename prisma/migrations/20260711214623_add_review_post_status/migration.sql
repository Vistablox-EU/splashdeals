-- Add REVIEW status to PostStatus enum
ALTER TYPE "marketing"."PostStatus" ADD VALUE IF NOT EXISTS 'REVIEW';
