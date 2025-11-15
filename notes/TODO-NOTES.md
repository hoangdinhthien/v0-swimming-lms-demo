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
