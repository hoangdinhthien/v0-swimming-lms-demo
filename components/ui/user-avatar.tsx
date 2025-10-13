import React from "react";
import { User } from "lucide-react";
import { useMediaDetails } from "@/hooks/useMediaDetails";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  user: {
    username?: string;
    featured_image?:
      | string[] // Array of media IDs (new format)
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
  let mediaId = null;
  let directImageUrl = null;

  if (user.featured_image) {
    if (Array.isArray(user.featured_image) && user.featured_image.length > 0) {
      const firstImage = user.featured_image[0];

      // Check if it's a string (media ID) or object
      if (typeof firstImage === "string") {
        // New format: array of media IDs
        mediaId = firstImage;
      } else if (typeof firstImage === "object" && firstImage._id) {
        // Old format: array of objects with _id
        mediaId = firstImage._id;
        directImageUrl = firstImage.path;
      }
    } else if (
      !Array.isArray(user.featured_image) &&
      typeof user.featured_image === "object" &&
      user.featured_image
    ) {
      // Handle case where featured_image is a single object
      mediaId = (user.featured_image as any)._id;
      directImageUrl = (user.featured_image as any).path;
    }
  }

  const { imageUrl, loading } = useMediaDetails(mediaId);

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
