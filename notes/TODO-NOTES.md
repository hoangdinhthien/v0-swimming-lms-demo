# Yêu cầu kiểm tra và sửa lỗi Search

## 1. Lỗi search tại trang `/dashboard/manager/instructors`

- Khi người dùng nhập ký tự vào thanh search:
  - **Toàn bộ trang bị refresh.**
  - **Giá trị trong ô search bị mất** ngay khi trang reload.
- Cần kiểm tra lại logic search, tránh gây reload trang.

---

## 2. Lỗi search tại trang `/dashboard/manager/classes`

### Hiện tượng:

- Người dùng nhập từ khóa nhưng **không có kết quả trả về trên UI**.

### Quan sát:

- Request trên UI đang gọi API theo dạng:
  GET /manager/classes?page=1&limit=1000&search[title:contains]=test

- Khi kiểm thử bằng Postman với query sau:
  GET manager/classes?search[name%3Acontains]=nc01

→ **API trả về kết quả đúng**.

### Kết luận:

- Có sự **không thống nhất** giữa query search thực tế UI đang gửi và format search mà API yêu cầu.
- Đề nghị kiểm tra dựa theo file:
  search-query.document.md

### Trường hợp đối chiếu:

- Search tại trang **News** hoạt động đúng:
  GET manager/news?search%5Btitle%3Acontains%5D=th%C3%B4ng+b%C3%A1o

---

## 3. Thiếu chức năng search tại trang Orders

Trang: `/dashboard/manager/transactions`

### Yêu cầu:

Orders phải hỗ trợ search theo các field sau:

#### a. Search theo tên học viên (user.username)

GET /manager/orders?search[user.username:contains]=member

#### b. Search theo tên khóa học (course.title)

GET manager/orders?search[course.title%3Acontains]=%C4%91%E1%BA%A7u

#### c. Search kết hợp nhiều field (user + course)

GET manager/orders?search[course.title%3Acontains]=%C4%91%E1%BA%A7u&search[user.username%3Acontains]=member

### Yêu cầu UI:

- UI **chỉ hiển thị một thanh search duy nhất và dài hơn một xíu**.
- Người dùng được phép chọn field muốn search (username, course title, v.v.).

---

## 4. Quy tắc chung cho các API sử dụng cơ chế "find common"

### Mô tả:

- Các API thuộc nhóm **find common** cho phép search **nhiều field**, không bị giới hạn như API dùng dạng `searchKey`.

### Yêu cầu:

- Giống như phần Orders:
  - Manager/staff được chọn field trong UI.
  - Nhưng UI **vẫn chỉ có một thanh search duy nhất**.
- Cần đồng bộ format query để đảm bảo API hiểu đúng:
  search[fieldName:contains]=value

yaml
Copy code

---

## Mục tiêu tổng quát

- Sửa lại **logic search** cho đồng nhất ở tất cả module.
- Đảm bảo:
- Không reload trang khi gõ search.
- Query format đúng chuẩn API.
- UI chỉ có **1 ô search**, nhưng có thể chọn field để filter.

- đối với những api thuộc dạng find-common, ngoài username và title của các entity ra thì manager/staff có thể search theo các field khác nữa dựa theo response data của api trả ra như thế nào. trang app\dashboard\manager\transactions\page.tsx là một ví dụ.

- classes: search[name:contains], search[course.title:contains], search[instructor.username:contains], search[instructor.email:contains]
- pools: search[title:contains]
- news: search[title:contains]
-
