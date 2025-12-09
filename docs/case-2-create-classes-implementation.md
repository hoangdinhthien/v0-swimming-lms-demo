# CASE 2 Implementation: Tạo lớp hàng loạt

## Overview
CASE 2 allows users to create multiple classes at once with validation, and optionally proceed to CASE 1 for scheduling.

## Files Modified

### 1. New Component: `components/manager/create-classes-modal.tsx`
Main modal for batch class creation with validation.

**Features:**
- Create multiple classes in a single operation
- Real-time validation of instructor qualifications
- Visual warnings for mismatches (category, age_types, missing specialist data)
- Clean table-based UI with add/remove rows
- Proceed to CASE 1 after successful creation

**Validation Rules:**
1. **Missing Specialist Data**: Warn if instructor has no specialist.category or specialist.age_types
2. **Category Mismatch**: Warn if instructor's specialist.category doesn't include any of course.category
3. **Age Type Mismatch**: Warn if instructor's specialist.age_types doesn't include course.type_of_age

**UI Components:**
- Table with editable rows
- Course dropdown (Select)
- Class name input (Input)
- Instructor dropdown (Select)
- Show on registration toggle (Select)
- Warning icons and expandable warning messages
- Summary alert showing total warnings

### 2. Updated: `app/dashboard/manager/calendar/page.tsx`

**Added States:**
```typescript
const [isCreateClassesModalOpen, setIsCreateClassesModalOpen] = useState(false);
const [newlyCreatedClassIds, setNewlyCreatedClassIds] = useState<string[]>([]);
```

**New Functions:**
- `handleOpenCreateClassesModal()`: Opens CASE 2 modal, loads courses and instructors
- `handleCreateClassesComplete(insertedIds)`: Handles successful creation, optionally proceeds to CASE 1

**Workflow:**
1. User clicks "Tạo lớp học" from dropdown
2. Modal opens with courses and instructors loaded
3. User adds multiple classes with validation feedback
4. User clicks "Tạo X lớp học"
5. API creates all classes, returns insertedIds
6. Confirmation dialog: "Bạn có muốn tiếp tục xếp lịch cho các lớp này không?"
7. If yes: Fetch newly created classes → Open CASE 1 modal
8. If no: Refresh calendar

### 3. Updated: `api/manager/class-api.ts`

**Modified Interface:**
```typescript
export interface CreateClassData {
  course: string;
  name: string;
  instructor: string;
  member?: string[]; // Now optional
  show_on_regist_course?: boolean; // Added
}
```

**Existing APIs Used:**
- `createClass(data: CreateClassData | CreateClassData[])`: Already supports array input
- `fetchClassesByIds(classIds: string[])`: Uses `search[_id:in]` parameter

### 4. Updated: `components/manager/schedule-preview-modal.tsx`

**Type Fix:**
- Replaced local `ClassItem` interface with import from `@/api/manager/class-api`
- Ensures type compatibility across components

## User Flow

### Creating Classes (CASE 2)
```
1. Click "Quản lý lớp học" dropdown button
2. Select "Tạo lớp học"
3. Modal opens
4. Click "Thêm lớp học" to add rows
5. For each class:
   - Select Course
   - Enter Class Name
   - Select Instructor
   - Set Show on Registration
6. System validates:
   - ✅ Green checkmark: All valid
   - ⚠️ Amber warning: Validation issues (but can still create)
7. Click "Tạo X lớp học"
8. Classes created successfully
```

### Proceeding to CASE 1 (Optional)
```
9. Confirmation dialog appears
10. Click "OK" to proceed to scheduling
11. CASE 1 modal opens with newly created classes
12. Follow CASE 1 workflow (4 steps)
```

### Validation Warnings
User sees warnings for:
- **Missing Specialist**: "Giáo viên chưa có thông tin chuyên môn (category, age_types)"
- **Category Mismatch**: "Chuyên môn giáo viên không khớp với danh mục khóa học"
- **Age Type Mismatch**: "Độ tuổi giảng dạy của giáo viên không khớp với khóa học"

Warnings are **informative only** - users can still create classes despite warnings.

## API Integration

### Create Classes Request
```javascript
POST /v1/workflow-process/manager/class
Headers:
  - Content-Type: application/json
  - x-tenant-id: <tenant_id>
  - Authorization: Bearer <token>

Body:
[
  {
    "course": "course_id_1",
    "name": "Class A",
    "instructor": "instructor_id_1",
    "show_on_regist_course": true
  },
  {
    "course": "course_id_2",
    "name": "Class B",
    "instructor": "instructor_id_2",
    "show_on_regist_course": false
  }
]
```

### Response
```javascript
{
  "data": {
    "insertedIds": ["class_id_1", "class_id_2"]
  },
  "message": "Success",
  "statusCode": 200
}
```

### Fetch Newly Created Classes
```javascript
GET /v1/workflow-process/manager/classes/find-common?search[_id:in]=class_id_1,class_id_2
Headers:
  - Content-Type: application/json
  - x-tenant-id: <tenant_id>
  - Authorization: Bearer <token>

Response:
{
  "data": [
    { "_id": "class_id_1", "name": "Class A", "course": {...}, ... },
    { "_id": "class_id_2", "name": "Class B", "course": {...}, ... }
  ]
}
```

## Key Features

### Real-time Validation
- Validates on instructor or course change
- Shows warnings immediately in UI
- Non-blocking: warnings don't prevent creation
- Summary alert shows total warning count

### Clean UX
- Table layout with clear columns
- Status column with icons (✅/⚠️)
- Expandable warning rows below each class
- Add/remove rows easily
- Disabled state during creation

### Integration with CASE 1
- Seamless transition after creation
- Newly created classes pre-loaded
- User can skip scheduling if desired
- Refresh calendar if skipped

## Testing Checklist

- [ ] Create single class successfully
- [ ] Create multiple classes (5+) successfully
- [ ] Validation warnings appear for category mismatch
- [ ] Validation warnings appear for age type mismatch
- [ ] Validation warnings appear for missing specialist data
- [ ] Can still create despite warnings
- [ ] Confirmation dialog appears after creation
- [ ] Click "OK" opens CASE 1 with new classes
- [ ] Click "Cancel" refreshes calendar
- [ ] Loading states work correctly
- [ ] Error handling displays properly
- [ ] Modal closes after successful creation

## Notes

- **member field**: Now optional in CreateClassData (was required before)
- **show_on_regist_course**: New optional field for registration visibility
- **Validation logic**: Instructor specialist data structure:
  ```typescript
  specialist: {
    category?: string[];  // e.g., ["swimming", "diving"]
    age_types?: string[]; // e.g., ["age_type_id_1", "age_type_id_2"]
  }
  ```
- **Type compatibility**: ClassItem from API now shared across components
- **Old modal**: AutoScheduleModal (Tab 2) still exists but not used in new flow
