# Search Query Notes

- Đối với những API thuộc dạng **find-common**, ngoài `username` và `title` của các entity ra thì **manager/staff** có thể search theo các field khác nữa dựa theo response data API trả về.  
  → Trang `app/dashboard/manager/transactions/page.tsx` là một ví dụ. NHƯNG THANH SEARCH CHƯA ĐƯỢC ĐẸP/VỪA Ý TÔI LẮM NÊN CŨNG CẦN PHẢI CHỈNH LẠI UI CỦA PHẦN SEARCH ĐÓ 1 CHÚT

- Tôi đã chọn lựa ra những search query dựa theo các field phổ biến / thường được dùng để search cho từng entity.

- Kiểm tra lại file **search-query.document.md** và các file UI để chỉnh sửa lại **thanh search** để manager/staff có thể search theo các field.

---

## Search Query theo từng entity

### **classes**

- `search[name:contains]`
- `search[course.title:contains]`
- `search[instructor.username:contains]`
- `search[instructor.email:contains]`

### **pools**

- `search[title:contains]`

### **news**

- `search[title:contains]`

### **application-types**

- `search[title:contains]`

### **orders**

- `search[course.title:contains]`
- `search[user.username:contains]`

sửa lại thành searchOr&searchOr
formjudge: string number boolean select relation

- form_judge này khá là đặc biệt.
- logic nghiệp vụ: bên UI khi manager/staff tạo mới/chỉnh sửa 1 khóa học. trong phần nội dung khóa học khi manager/staff tạo mới/chỉnh sửa thông tin cho MỖI NỘI DUNG CỦA KHÓA HỌC(field 'detail'), manager/staff có thể thêm/chỉnh sửa 1 field tên là 'form_judge'. field 'form_judge' này sẽ chứa các thông tin để cho instructor(giáo viên/giảng viên) có thể dùng để đánh giá các học viên cho từng buổi học, và các thông tin trong 'form_judge' này sẽ không phải là cố định mà manager/staff sẽ tự tạo/thiết kể riêng cho từng nội dung của mỗi khóa học. nghĩa là khi tạo/sửa nội dung ('detail') cho khóa học, field 'form_judge' sẽ chứa 1 đoạn json schema do manager setup trên UI sau đó lưu lại và send về backend như thế này:
  "detail": [
  {
  "title": "Khởi động và làm quen với nước",
  "description": "Các bài tập nhẹ nhàng làm nóng cơ thể, hướng dẫn kỹ thuật thở và di chuyển cơ bản trong nước.",
  "form_judge": {
  "type": "object", //default
  "items": {
  "zxcv": {
  "type": "string",
  "required": true,
  "is_filter": true,
  "text_type": "long_text",
  "dependencies": []
  },
  "ZXcZXc": {
  "type": "number",
  "required": true,
  "is_filter": true,
  "is_array": true,
  "min_array_lenght": 1,
  "max_array_lenght": 5,
  "dependencies": []
  }
  }
  }
  },
  {
  "title": "Bài tập tăng cường cơ bắp chân và giữ thăng bằng",
  "description": "Thực hiện các bước đi trong nước, nâng đầu gối và đứng một chân có hỗ trợ để tăng cường cơ bắp chân và cải thiện khả năng giữ thăng bằng, giúp giảm nguy cơ té ngã.",
  "form_judge": {
  "type": "object", //default
  "items": {
  "ZXCZXC": { // field name || title
  "type": "string",
  "required": false,
  "is_filter": false,
  "text_type": "long_text"
  },
  "zxcvxzcv": {
  "type": "string",
  "required": false,
  "is_filter": false,
  "text_type": "long_text"
  }
  }
  }
  }
  ]
- đó là lý do tại sao tôi nói các thông tin trong 'form_judge' này sẽ không phải là cố định mà manager/staff sẽ tự tạo/thiết kể riêng cho từng nội dung của mỗi khóa học.
- NÓI TÓM LẠI LÀ KHI MANAGER/STAFF TẠO MỚI/CHỈNH SỬA 'detail' CHO 1 KHÓA HỌC, TRONG 'detail' CÓ FIELD 'form_judge', FIELD NÀY SẼ LÀ DO MANAGER/STAFF TỰ NGHĨ RA LÀ THIẾT KẾ SAO CHO HỢP LÝ
