# API Search Query Documentation cho Frontend Team

## Mục Lục
1. [Tổng quan](#tổng-quan)
2. [Cú pháp cơ bản](#cú-pháp-cơ-bản)
3. [Các loại operators](#các-loại-operators)
4. [Search Logic (AND/OR)](#search-logic-andor)
5. [Sắp xếp](#sắp-xếp)
6. [Projection (Field Selection)](#projection-field-selection)
7. [Ví dụ thực tế](#ví-dụ-thực-tế)

## 1. Tổng quan

Backend hỗ trợ query search mạnh mẽ thông qua URL parameters sử dụng MongoDB query syntax.

**Base URL Format:**
```
GET /api/[entity]?[query_parameters]
```

## 2. Cú pháp cơ bản

### Format chung
```
search[field:operator]=value
searchOr[field:operator]=value
sort[field]=asc|desc
projection[field]=1|0
```

### Ví dụ cơ bản
```
// Tìm user có name chứa "John"
GET /api/users?search[name:contains]=John

// Tìm sản phẩm có giá lớn hơn 100
GET /api/products?search[price:gt]=100

// Tìm đơn hàng có status là "completed"
GET /api/orders?search[status:equal]=completed
```

## 3. Các loại Operators

### 3.1 Text Search Operators

| Operator | Mô tả | Ví dụ |
|----------|-------|-------|
| `contains` | Tìm text chứa giá trị (case-insensitive) | `search[title:contains]=iPhone` |
| `doesNotContain` | Tìm text KHÔNG chứa giá trị | `search[name:doesNotContain]=test` |
| `beginsWith` | Bắt đầu với | `search[name:beginsWith]=John` |
| `endsWith` | Kết thúc với | `search[email:endsWith]=@gmail.com` |
| `equal` | So sánh bằng chính xác | `search[status:equal]=active` |
| `notEqual` | So sánh khác | `search[status:notEqual]=deleted` |

**Lưu ý:**
- `contains` hỗ trợ wildcard `%` (convert thành `.*` trong regex)
- Tất cả text operators đều case-insensitive

### 3.2 Number/Date Comparison Operators

| Operator | Mô tả | Ví dụ |
|----------|-------|-------|
| `gt` | Lớn hơn | `search[price:gt]=100` |
| `gte` | Lớn hơn hoặc bằng | `search[quantity:gte]=10` |
| `lt` | Nhỏ hơn | `search[age:lt]=30` |
| `lte` | Nhỏ hơn hoặc bằng | `search[discount:lte]=50` |
| `between` | Trong khoảng (bao gồm cả 2 đầu) | `search[price:between]=100,500` |
| `notBetween` | Ngoài khoảng | `search[price:notBetween]=100,500` |
| `range` | Alias của `between` | `search[age:range]=18,65` |

**Lưu ý về Date:**
- Format hợp lệ: `YYYY-MM-DD` hoặc `YYYY-MM-DD HH:mm:ss`
- Tự động detect và convert sang Date object
- Nếu không phải date, sẽ parse thành số

### 3.3 Array/List Operators

| Operator | Mô tả | Ví dụ |
|----------|-------|-------|
| `in` | Giá trị nằm trong danh sách | `search[status:in]=pending,processing,shipped` |
| `notIn` | Giá trị KHÔNG nằm trong danh sách | `search[category:notIn]=electronics,clothing` |
| `all` | Mảng chứa TẤT CẢ các giá trị | `search[tags:all]=urgent,important` |
| `size` | Kích thước mảng | `search[items:size]=5` |

**Lưu ý về `in`:**
- Hỗ trợ `null`: `search[field:in]=value1,null,value3`
- Tự động convert ObjectId cho field `_id` hoặc field kết thúc bằng `._id`

### 3.4 Existence/Null Operators

| Operator | Mô tả | Ví dụ |
|----------|-------|-------|
| `exists` | Kiểm tra field tồn tại | `search[deletedAt:exists]=true` |
| `notExists` | Kiểm tra field không tồn tại | `search[deletedAt:notExists]=true` |
| `null` | Giá trị là null | `search[deletedAt:null]=true` |
| `notNull` | Giá trị khác null | `search[email:notNull]=true` |

### 3.5 Advanced Array Operators

| Operator | Mô tả | Ví dụ |
|----------|-------|-------|
| `elemMatch` | Match phần tử trong mảng theo điều kiện phức tạp | `search[items:elemMatch]={"price":{"$gt":100}}` |

**Lưu ý:** Giá trị phải là JSON string hợp lệ

## 4. Search Logic (AND/OR)

### 4.1 AND Logic (Default)
Sử dụng prefix `search[...]` - tất cả điều kiện phải thỏa mãn

```
// Tìm sản phẩm có giá > 100 VÀ category = "electronics"
GET /api/products?search[price:gt]=100&search[category:equal]=electronics
```

### 4.2 OR Logic
Sử dụng prefix `searchOr[...]` - một trong các điều kiện thỏa mãn là đủ

```
// Tìm user có role là "admin" HOẶC "moderator"
GET /api/users?searchOr[role:equal]=admin&searchOr[role:equal]=moderator
```

### 4.3 Combine AND + OR

```
// Tìm sản phẩm có giá > 100 VÀ (category = "electronics" HOẶC category = "gadgets")
GET /api/products?search[price:gt]=100&searchOr[category:equal]=electronics&searchOr[category:equal]=gadgets
```

## 5. Sắp xếp

### 5.1 Syntax
```
sort[field]=asc|desc
```

### 5.2 Single field sorting
```
GET /api/products?sort[price]=asc
GET /api/products?sort[created_at]=desc
```

### 5.3 Multiple field sorting
```
// Sắp xếp theo giá giảm dần, sau đó theo tên tăng dần
GET /api/products?sort[price]=desc&sort[name]=asc
```

### 5.4 Default sorting
**QUAN TRỌNG:** Nếu không chỉ định sort, backend tự động sort theo `created_at` DESC (mới nhất trước)

## 6. Projection (Field Selection)

### 6.1 Syntax
```
projection[field]=1|0
```
- `1` = include field
- `0` = exclude field

### 6.2 Include specific fields
```
// Chỉ lấy name và email
GET /api/users?projection[name]=1&projection[email]=1
```

### 6.3 Exclude fields
```
// Loại bỏ password và refreshToken
GET /api/users?projection[password]=0&projection[refreshToken]=0
```

### 6.4 Nested field projection
```
GET /api/orders?projection[user.name]=1&projection[user.email]=1
```

## 7. Ví dụ thực tế

### 7.1 E-commerce Product Search
```
GET /api/products?search[name:contains]=iPhone&search[price:between]=500,1500&search[category:equal]=electronics&search[inStock:equal]=true&sort[price]=asc&projection[name]=1&projection[price]=1&projection[images]=1
```

### 7.2 User Management with OR Logic
```
GET /api/users?searchOr[role:equal]=admin&searchOr[role:equal]=moderator&search[emailVerified:equal]=true&search[deletedAt:null]=true&sort[created_at]=desc
```

**Hoặc viết gọn hơn:**
```
GET /api/users?search[role:in]=admin,moderator&search[emailVerified:equal]=true&search[deletedAt:null]=true&sort[created_at]=desc
```

### 7.3 Complex Order Search
```
// Đơn hàng pending/processing, tổng tiền > 1000, tạo trong tháng này
GET /api/orders?search[status:in]=pending,processing&search[totalAmount:gt]=1000&search[created_at:between]=2024-01-01,2024-01-31&search[deletedAt:null]=true&sort[created_at]=desc&projection[customer]=1&projection[totalAmount]=1&projection[status]=1
```

### 7.4 Search with Nested Fields
```
GET /api/orders?search[customer.type:equal]=VIP&search[status:notEqual]=cancelled&sort[created_at]=desc
```

### 7.5 Array Field Search
```
// Product có tags chứa cả "premium" và "limited"
GET /api/products?search[tags:all]=premium,limited&search[inStock:equal]=true
```

### 7.6 Date Range Search
```
// Users đăng ký trong Q1 2024
GET /api/users?search[created_at:between]=2024-01-01,2024-03-31&projection[password]=0&projection[refreshToken]=0
```

### 7.7 Active Records Only
```
// Lọc records chưa bị soft delete
GET /api/products?search[deletedAt:null]=true&search[status:equal]=active
```

### 7.8 Recent Records (7 ngày gần nhất)
```
GET /api/orders?search[created_at:gte]=2024-01-15&sort[created_at]=desc
```

### 7.9 Full-text Search (nhiều fields)
```
GET /api/products?searchOr[name:contains]=phone&searchOr[description:contains]=phone&searchOr[sku:contains]=phone
```

### 7.10 Search with Exclusions
```
// Products KHÔNG thuộc các categories archived, discontinued
GET /api/products?search[category:notIn]=archived,discontinued&search[inStock:equal]=true&search[price:gt]=0
```

## 8. Common Issues & Tips

### 8.1 URL Encoding
Luôn encode URL parameters đúng cách, đặc biệt với special characters

### 8.2 Date Format
- Sử dụng format: `YYYY-MM-DD` hoặc `YYYY-MM-DD HH:mm:ss`
- Tránh format: `DD/MM/YYYY` hoặc `MM-DD-YYYY`

### 8.3 ObjectId Validation
- Field `_id` hoặc field kết thúc bằng `._id` yêu cầu valid ObjectId (24 hex characters)
- Invalid ObjectId sẽ trả về error 400

### 8.4 Default Sorting
- Nếu không muốn sort theo `created_at`, phải explicitly set sort khác
- Ví dụ: `sort[name]=asc` sẽ override default sort

### 8.5 Projection Notes
- `_id` luôn được include trừ khi explicitly exclude với `projection[_id]=0`
- Không thể mix include và exclude (ngoại trừ `_id`)

### 8.6 Boolean Values
- Operator `equal` tự động detect: `true`, `false` → boolean
- Operator `equal` tự động detect ObjectId cho `_id` fields
- Các giá trị khác được xử lý như string

### 8.7 Null Values
- String `"null"` trong operator `in` sẽ được convert thành `null`
- Ví dụ: `search[field:in]=value1,null` → tìm value1 hoặc null
