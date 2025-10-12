import React from "react";
import { User } from "lucide-react";
import { useMediaDetails } from "@/hooks/useMediaDetails";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  user: {
    username?: string;
    featured_image?:
      | Array<{
          _id: string;
          filename?: string;
          path?: string;
        }>
      | {
          _id?: string;
          filename?: string;
          path?: string;
        }
      | null;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({
  user,
  size = "md",
  className = "",
}: UserAvatarProps) {
  // Handle different featured_image formats
  let featuredImage = null;
  if (user.featured_image) {
    if (Array.isArray(user.featured_image) && user.featured_image.length > 0) {
      featuredImage = user.featured_image[0];
    } else if (
      !Array.isArray(user.featured_image) &&
      (user.featured_image as any)?.path
    ) {
      // Handle case where featured_image is an object with path
      featuredImage = user.featured_image as any;
    }
  }

  // Get the media ID and direct path
  const mediaId = featuredImage?._id || null;
  const { imageUrl, loading } = useMediaDetails(mediaId);

  // Use direct path if available (fallback)
  const directImageUrl = featuredImage?.path;

  // Final image URL priority: fetched URL > direct path > null
  const finalImageUrl = imageUrl || directImageUrl || null;

  // Get user initials for fallback
  const userInitials = user.username
    ? user.username
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {finalImageUrl && (
        <AvatarImage
          src={finalImageUrl}
          alt={`${user.username || "User"} avatar`}
          className='object-cover'
        />
      )}
      <AvatarFallback className='bg-muted'>
        {loading ? (
          <div className='animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full' />
        ) : finalImageUrl ? (
          userInitials
        ) : (
          <User className='h-4 w-4' />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
