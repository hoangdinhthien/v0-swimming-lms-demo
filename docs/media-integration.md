# Media API và UserAvatar Component

## Tổng quan

Chúng ta đã tích hợp `media-api.ts` để xử lý và hiển thị hình ảnh profile của user trong các trang staff/students và staff/instructors.

## Các component đã được tạo

### 1. `useMediaDetails` Hook

**File**: `/hooks/useMediaDetails.ts`

Hook này fetch media details từ API và trả về image URL.

```typescript
const { imageUrl, loading, error } = useMediaDetails(mediaId);
```

### 2. `UserAvatar` Component

**File**: `/components/ui/user-avatar.tsx`

Component hiển thị avatar của user với các tính năng:

- Hỗ trợ nhiều định dạng `featured_image` (array hoặc object)
- Fallback sang initials nếu không có ảnh
- Responsive sizing (sm, md, lg)
- Loading state

```typescript
<UserAvatar
  user={user}
  size='md'
  className='custom-class'
/>
```

## Cách hoạt động

### 1. Dữ liệu Featured Image

Component xử lý 2 định dạng `featured_image`:

**Array format:**

```json
{
  "featured_image": [
    {
      "_id": "68ea3319eb4dbf2dde1c55b9",
      "path": "https://cdn.example.com/image.jpg"
    }
  ]
}
```

**Object format:**

```json
{
  "featured_image": {
    "path": "https://cdn.example.com/image.jpg"
  }
}
```

### 2. Priority Logic

1. **imageUrl** từ `getMediaDetails(mediaId)` (cao nhất)
2. **directImageUrl** từ `featured_image.path` (fallback)
3. **User initials** hoặc **User icon** (cuối cùng)

### 3. Integration trong Pages

**Students Page** (`/app/dashboard/staff/students/page.tsx`):

```tsx
import { UserAvatar } from "@/components/ui/user-avatar";

// Trong table cell:
<UserAvatar
  user={student.user}
  size='md'
/>;
```

**Instructors Page** (`/app/dashboard/staff/instructors/page.tsx`):

```tsx
import { UserAvatar } from "@/components/ui/user-avatar";

// Trong table cell:
<UserAvatar
  user={instructor.user}
  size='md'
/>;
```

## API Functions

### `getMediaDetails(mediaId: string)`

**File**: `/api/media-api.ts`

Fetch media details bằng media ID và trả về image URL.

```typescript
const imageUrl = await getMediaDetails("68ea3319eb4dbf2dde1c55b9");
```

### `uploadMedia()` và `deleteMedia()`

Các functions khác trong `media-api.ts` để upload và delete media files.

## Kết quả

✅ **Hoàn thành:**

- ✅ Tích hợp `media-api.ts`
- ✅ Tạo `UserAvatar` component
- ✅ Hiển thị profile images trong staff/students page
- ✅ Hiển thị profile images trong staff/instructors page
- ✅ Fallback UI khi không có ảnh
- ✅ Xử lý multiple image formats
- ✅ Responsive sizing

**Features:**

- Automatic image loading với `useMediaDetails` hook
- Graceful fallbacks (initials → user icon)
- Support cho cả array và object `featured_image` formats
- Loading states và error handling
- Clean, reusable component architecture

Bây giờ users sẽ thấy avatar thực sự thay vì chỉ icon generic trong danh sách students và instructors! 🎉
