# Data Review – Tài liệu mô tả chức năng

## 1. Giới thiệu

**Data-Review** là module dành cho **Manager** sử dụng để **review, kiểm tra, và duyệt (approve/reject)** những dữ liệu mà **Staff** gửi lên.

Các **Staff** có quyền tạo hoặc cập nhật dữ liệu của một số module nhất định, nhưng **không có quyền cập nhật trực tiếp** vào hệ thống chính. Thay vào đó, họ phải gửi nội dung thay đổi thông qua **Data-Review workflow**, để Manager xem xét trước khi thông tin được ghi nhận chính thức.

## 2. Mục đích hệ thống Data-Review

- Đảm bảo dữ liệu luôn chính xác, hạn chế sai sót.
- Tạo quy trình kiểm duyệt rõ ràng giữa Staff → Manager.
- Giúp hệ thống theo dõi lịch sử, ai tạo, ai đề xuất, ai duyệt.
- Cho phép quản lý tập trung các bản cập nhật đến từ nhiều module khác nhau.

## 3. API Lấy danh sách dữ liệu cần duyệt

### **GET LIST DATA-REVIEW**

**Method:** `GET`

**Endpoint:**

```
https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api/v1/workflow-process/manager/data-review
```

API này dùng để lấy danh sách các bản ghi mà Staff đã gửi yêu cầu update/create và đang chờ Manager review.

# 4. Response Data Structure

Dưới đây là response mẫu của API:

```json
{
    "data": [
        [
            {
                "limit": 10,
                "skip": 0,
                "count": 22,
                "documents": [
                    {
                        "_id": "6900e59f0bf4cf207a710bc2",
                        "type": ["Pool"],
                        "data": {
                            "title": "test 2",
                            "dimensions": "test pool 2 m^ét",
                            "depth": "test pool 2 m^ét",
                            "capacity": 100,
                            "is_active": true,
                            "_id": "68ff56bf041dc4f22797953a",
                            "type": "test"
                        },
                        "method": ["PUT"],
                        "status": ["pending"],
                        "created_at": "2025-10-28T22:47:43.000Z",
                        "created_by": { ... },
                        "updated_at": "2025-10-28T22:47:43.000Z",
                        "updated_by": { ... },
                        "tenant_id": "67cabc98c87dc080914265d4"
                    },

                    // ... Các document khác
                ]
            }
        ]
    ]
}
```

---

# 5. Giải thích từng field quan trọng

## **5.1. Pagination fields**

| Field   | Giải thích                                    |
| ------- | --------------------------------------------- |
| `limit` | Số lượng bản ghi tối đa trong 1 lần fetch API |
| `skip`  | Dùng cho phân trang – số lượng bản ghi bỏ qua |
| `count` | Tổng số bản ghi trong hệ thống đang chờ duyệt |

---

## **5.2. Document fields**

Mỗi `document` là một yêu cầu của Staff để tạo/cập nhật dữ liệu.

### **Các field chính:**

| Field        | Giải thích                                             |
| ------------ | ------------------------------------------------------ |
| `_id`        | ID của yêu cầu review                                  |
| `type`       | Loại dữ liệu (ví dụ: Pool, Instructor, Class...)       |
| `data`       | Dữ liệu mà Staff gửi lên để yêu cầu update/create      |
| `method`     | Hành động: `POST` (tạo mới) hoặc `PUT` (cập nhật)      |
| `status`     | Trạng thái yêu cầu (`pending`, `approved`, `rejected`) |
| `created_at` | Thời điểm Staff tạo yêu cầu                            |
| `created_by` | Thông tin Staff tạo yêu cầu                            |
| `updated_at` | Lần cuối Staff chỉnh sửa yêu cầu                       |
| `updated_by` | Người chỉnh sửa gần nhất (đa số vẫn là Staff)          |
| `tenant_id`  | Định danh tenant cho hệ thống đa tenant                |

---

# 6. Giải thích chi tiết field `data`

Field `data` chứa **payload** mà Staff muốn cập nhật vào database.

Ví dụ:

```json
{
  "title": "test 2",
  "dimensions": "test pool 2 m^ét",
  "depth": "test pool 2 m^ét",
  "capacity": 100,
  "is_active": true,
  "_id": "68ff56bf041dc4f22797953a",
  "type": "test"
}
```

Tùy module mà fields trong `data` sẽ khác nhau.

---

# 7. Quy trình xử lý của Manager

1. Staff gửi yêu cầu update → tạo 1 document trong Data-Review.
2. Manager mở trang Data-Review → xem danh sách.
3. Nhấn vào từng item → xem chi tiết `data` + thông tin người gửi.
4. Manager chọn:

   - ✔ **Approve** → dữ liệu chính thức được cập nhật.
   - ✖ **Reject** → yêu cầu bị từ chối, không cập nhật.

---

# 8. Gợi ý UI/UX cho trang Data-Review

- Hiển thị danh sách theo dạng bảng (table).
- Filter theo: `type`, `method`, `status`, `created_by`.
- Preview chi tiết JSON ở dạng tree-view.
- Có tính năng compare: **current data vs updated data**.

---

# 9. Ghi chú quan trọng

- Response trả về theo dạng mảng lồng nhiều lớp → cần unwrap.
- Mỗi document có thể chứa nhiều thông tin người dùng (created_by, updated_by). Hãy map ra các field quan trọng để hiển thị.
- Module Data-Review hỗ trợ multi-module → Manager chỉ cần xem ở một nơi.

---

- LƯU Ý QUAN TRỌNG: ĐỐI VỚI PUT METHOD CỦA DATA REVIEW THÌ PHẢI BẮT BUỘC PHẢI CÓ "service: 'tên module'" VÀO TRONG PHẦN HEADER, NHƯ VÍ DỤ NÀY:
  curl --location --request PUT 'https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api/v1/workflow-process/manager/data-review?id=6900e59f0bf4cf207a710bc2' \
  --header 'x-tenant-id: 67cabc98c87dc080914265d4' \
  --header 'service: Pool' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzFkMzVhOTVhYzQ2Y2M5YjY4NjAwMSIsImVtYWlsIjoibWFuYWdlcjFAZ21haWwuY29tIiwidXNlcm5hbWUiOiJtYW5hZ2VyMSIsInBob25lIjoiMDcwODc5NzcyMiIsInJvbGVfc3lzdGVtIjoidXNlciIsInJvbGUiOlsiNjg4YTQ1YjYwZjAwMzA2MWUzMGZiYTlmIiwiNjgzOWI3Nzc1OWQxNGZiN2UxMzhmYzQxIl0sImZlYXR1cmVkX2ltYWdlIjp7Il9pZCI6IjY4OGNkYjUyZTU3NjEzNGY3YTYzNmE1ZiIsImZpbGVuYW1lIjoiMzFhMmViMDMtNGRlNi00ZGE4LWJjYTktYjIzNWRjM2Y5MDI4IiwiZGlzayI6InVwbG9hZHMiLCJtaW1lIjoiaW1hZ2UvanBlZyIsInNpemUiOjEwNjg3MDcsInRpdGxlIjoiQXZhdGFyIGZvciBjaGlsZDUiLCJhbHQiOiJBdmF0YXIgZm9yIGNoaWxkNSIsInRlbmFudF9pZCI6IjY3Y2FiYzk4Yzg3ZGMwODA5MTQyNjVkNCIsImNyZWF0ZWRfYnkiOiI2ODMxZDM1YTk1YWM0NmNjOWI2ODYwMDEiLCJjcmVhdGVkX2F0IjoiMjAyNS0wOC0wMVQyMjoyMDo1MC4wMDBaIiwidXBkYXRlZF9hdCI6IjIwMjUtMDgtMDFUMjI6MjA6NTAuMDAwWiIsImlzX2RyYWZ0IjpmYWxzZSwiX192IjowLCJwYXRoIjoiaHR0cHM6Ly9wdWItZmFmMmQ1NmYzNTBhNDY0ZjkxN2IxZGUwNThmZWQzZWYucjIuZGV2L3VwbG9hZHMvMzFhMmViMDMtNGRlNi00ZGE4LWJjYTktYjIzNWRjM2Y5MDI4In0sInJvbGVfZnJvbnQiOlsibWFuYWdlciJdLCJoYXNoS2V5IjoiNmhtMWd5c3ZoZ2IwNzkwbnVqcmt0IiwiaWF0IjoxNzYzMjQ4MzMxLCJleHAiOjE3NjM1MDc1MzF9.4rk9ZMHIYKFvyx1Ox5yGLGFqFTIGVBw-Exie0uzMjm8' \
  --data '{
  "status": [
  "approved"
      ],
      "note": "approved"
  }'
