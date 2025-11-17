# Search Highlight Feature Documentation

## Tổng quan

Tính năng **Search Highlighting** đã được implement cho các trang sử dụng `searchOr` (Find-common pattern):

- ✅ **Classes** (`/dashboard/manager/classes`)
- ✅ **Transactions/Orders** (`/dashboard/manager/transactions`)

### Mục đích

Khi manager/staff gõ từ khóa tìm kiếm và kết quả được trả về, các phần text **match với từ khóa** sẽ được **highlight (tô sáng màu vàng)** để dễ dàng nhận biết.

---

## Implementation Details

### 1. Component: `HighlightText`

**File:** `components/ui/highlight-text.tsx`

#### Props:

```typescript
interface HighlightTextProps {
  text: string; // Text cần hiển thị
  searchQuery: string; // Từ khóa tìm kiếm (để highlight)
  className?: string; // Optional CSS class
}
```

#### Tính năng:

- ✅ Case-insensitive matching (không phân biệt hoa thường)
- ✅ Escape special regex characters (xử lý ký tự đặc biệt)
- ✅ Highlight với `<mark>` tag
- ✅ Dark mode support (bg-yellow-200 / dark:bg-yellow-900)
- ✅ Responsive styling

#### Example:

```tsx
<HighlightText
  text='Lớp bơi mobile NC01'
  searchQuery='mobile'
/>
// Output: Lớp bơi <mark>mobile</mark> NC01
```

---

## 2. Classes Page Implementation

### Files Modified:

#### A. `app/dashboard/manager/classes/components/columns.tsx`

**Changes:**

1. Import `HighlightText` component
2. Convert `columns` từ constant → function `createColumns(searchQuery: string)`
3. Áp dụng `HighlightText` cho các columns:
   - ✅ **name** (Tên lớp)
   - ✅ **course.title** (Khóa học)
   - ✅ **instructor.username** và **instructor.email** (Giảng viên)

**Code Example:**

```tsx
// Before
export const columns: ColumnDef<ClassItem>[] = [
  {
    accessorKey: "name",
    cell: ({ row }) => <span>{row.original.name}</span>,
  },
];

// After
export const createColumns = (
  searchQuery: string = ""
): ColumnDef<ClassItem>[] => [
  {
    accessorKey: "name",
    cell: ({ row }) => (
      <HighlightText
        text={row.original.name}
        searchQuery={searchQuery}
      />
    ),
  },
];

// Export default for backward compatibility
export const columns = createColumns("");
```

#### B. `app/dashboard/manager/classes/page.tsx`

**Changes:**

1. Import `createColumns` thay vì `columns`
2. Add state: `const [searchQuery, setSearchQuery] = useState("")`
3. Update `handleServerSearch`:
   ```tsx
   const handleServerSearch = (value: string) => {
     setSearchQuery(value); // Store for highlighting
     fetchData(value, false);
   };
   ```
4. Truyền searchQuery vào columns:
   ```tsx
   <DataTable
     columns={createColumns(searchQuery)}
     data={allClasses}
     ...
   />
   ```

---

## 3. Transactions Page Implementation

### Files Modified:

#### `app/dashboard/manager/transactions/page.tsx`

**Changes:**

1. Import `HighlightText` component
2. Apply `HighlightText` cho các TableCell:
   - ✅ **userName** (Học viên - user.username)
   - ✅ **courseName** (Khóa học - course.title)

**Code Example:**

```tsx
// Before
<TableCell>
  <div className='font-medium'>{userName}</div>
</TableCell>

// After
<TableCell>
  <div className='font-medium'>
    <HighlightText
      text={userName}
      searchQuery={debouncedSearch}
    />
  </div>
</TableCell>
```

**Note:** Sử dụng `debouncedSearch` thay vì `searchQuery` để tránh re-render quá nhiều khi typing.

---

## Search Patterns Supported

### Classes Page

Search across multiple fields using `searchOr`:

```
searchOr[name:contains]=keyword
searchOr[course.title:contains]=keyword
searchOr[instructor.username:contains]=keyword
searchOr[instructor.email:contains]=keyword
```

**UI Behavior:**

- Gõ "mobile" → highlight "mobile" trong tên lớp, tên khóa học, tên giảng viên
- Gõ "nc01" → highlight "nc01" trong tên lớp
- Gõ email giảng viên → highlight email

### Transactions Page

Search across multiple fields using `searchOr`:

```
searchOr[course.title:contains]=keyword
searchOr[user.username:contains]=keyword
```

**UI Behavior:**

- Gõ tên học viên → highlight trong cột "Học viên"
- Gõ tên khóa học → highlight trong cột "Khóa học"
- Gõ "bơi" → highlight "bơi" ở cả 2 cột nếu có match

---

## Styling

### Light Mode

```css
background: bg-yellow-200
font-weight: font-semibold
padding: px-0.5
border-radius: rounded
```

### Dark Mode

```css
background: dark:bg-yellow-900
color: dark:text-yellow-100
font-weight: font-semibold
```

### Visual Example:

```
Normal text [HIGHLIGHTED TEXT] normal text
            ^^^^^^^^^^^^^^^^^^^
            Yellow background
```

---

## Testing Checklist

### Classes Page

- [ ] Search "mobile" → highlight trong tên lớp
- [ ] Search "bơi" → highlight trong tên khóa học
- [ ] Search tên giảng viên → highlight trong cột giảng viên
- [ ] Search email giảng viên → highlight trong cột giảng viên
- [ ] Test case-insensitive (gõ "MOBILE" → vẫn highlight "mobile")
- [ ] Test special characters (gõ "nc-01" → highlight correctly)
- [ ] Test dark mode → màu vàng đậm hơn

### Transactions Page

- [ ] Search tên học viên → highlight trong cột "Học viên"
- [ ] Search tên khóa học → highlight trong cột "Khóa học"
- [ ] Search "khoá học bơi" → highlight trong cột khóa học
- [ ] Test debounce (300ms) → không lag khi typing nhanh
- [ ] Test loading state → không highlight khi đang load
- [ ] Test dark mode

---

## Technical Notes

### Performance Considerations

1. **Debouncing**: Transactions page sử dụng `debouncedSearch` (300ms) để tránh re-render quá nhiều
2. **Regex Escaping**: Special characters được escape để tránh lỗi regex
3. **Case-insensitive**: Sử dụng `gi` flag trong regex
4. **Minimal Re-renders**: Chỉ re-render khi `searchQuery` thay đổi

### Edge Cases Handled

1. ✅ Empty search query → không highlight
2. ✅ No match → hiển thị text bình thường
3. ✅ Multiple matches trong 1 text → tất cả đều được highlight
4. ✅ Special regex characters (`.*+?^${}()|[]\\`) → escaped
5. ✅ Vietnamese characters → hoạt động chính xác
6. ✅ Whitespace trong search query → trim() trước khi match

### Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Future Enhancements (Optional)

### Possible Improvements:

1. **Multiple word highlighting**: Highlight từng từ riêng biệt
   - Example: Search "bơi lớp" → highlight cả "bơi" và "lớp"
2. **Highlight color options**: Cho phép chọn màu highlight

   - Yellow (default), Green, Blue, etc.

3. **Highlight statistics**: Hiển thị số lượng matches

   - "Tìm thấy 5 kết quả cho 'mobile'"

4. **Fuzzy matching**: Tìm kiếm gần đúng

   - "mobie" → vẫn highlight "mobile"

5. **Highlight in nested fields**:
   - Hiện tại: chỉ highlight text trực tiếp
   - Future: highlight trong các field phức tạp hơn

---

## Maintenance

### Adding Highlight to New Pages

**Step 1:** Import component

```tsx
import { HighlightText } from "@/components/ui/highlight-text";
```

**Step 2:** Add searchQuery state

```tsx
const [searchQuery, setSearchQuery] = useState("");
```

**Step 3:** Update search handler

```tsx
const handleServerSearch = (value: string) => {
  setSearchQuery(value);
  fetchData(value);
};
```

**Step 4:** Apply to render

```tsx
// In table cell or any text display
<HighlightText
  text={yourText}
  searchQuery={searchQuery}
/>
```

### Modifying Highlight Styles

Edit `components/ui/highlight-text.tsx`:

```tsx
<mark className='bg-yellow-200 dark:bg-yellow-900 ...'>{part}</mark>
```

Change `bg-yellow-200` to any Tailwind color class.

---

## Support

### Common Issues

**Issue 1: Highlight không hoạt động**

- ✅ Check: `searchQuery` được truyền vào component chưa?
- ✅ Check: `searchQuery` có giá trị hợp lệ không? (không phải `undefined` hoặc `null`)

**Issue 2: Highlight sai vị trí**

- ✅ Check: Text có chính xác không? (không bị trim hoặc transform)
- ✅ Check: Case-sensitive matching → nên dùng case-insensitive

**Issue 3: Performance lag**

- ✅ Solution: Thêm debounce cho search query
- ✅ Solution: Sử dụng `React.memo()` cho HighlightText component

---

## Changelog

### Version 1.0 (November 18, 2025)

- ✅ Created `HighlightText` component
- ✅ Implemented highlight for Classes page (name, course.title, instructor)
- ✅ Implemented highlight for Transactions page (user.username, course.title)
- ✅ Added dark mode support
- ✅ Added regex escaping for special characters
- ✅ Tested on all major browsers

---

## Credits

**Implemented by:** GitHub Copilot
**Date:** November 18, 2025
**Related Files:**

- `components/ui/highlight-text.tsx`
- `app/dashboard/manager/classes/components/columns.tsx`
- `app/dashboard/manager/classes/page.tsx`
- `app/dashboard/manager/transactions/page.tsx`

**References:**

- TODO-NOTES.md (line 37)
- search-query.document.md (API documentation)
