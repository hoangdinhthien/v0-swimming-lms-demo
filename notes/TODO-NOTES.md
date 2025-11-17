# Search Query Notes

- Đối với những API thuộc dạng **find-common**, ngoài `username` và `title` của các entity ra thì **manager/staff** có thể search theo các field khác nữa dựa theo response data API trả về.  
  → Trang `app/dashboard/manager/transactions/page.tsx` là một ví dụ. NHƯNG THANH SEARCH CHƯA ĐƯỢC ĐẸP/VỪA Ý TÔI LẮM NÊN CŨNG CẦN PHẢI CHỈNH LẠI UI CỦA PHẦN SEARCH ĐÓ 1 CHÚT CHO NÓ DÀI HƠN

- Tôi đã chọn lựa ra những search query dựa theo các field phổ biến / thường được dùng để search cho từng entity.

- Kiểm tra lại file **search-query.document.md** và các file UI để chỉnh sửa lại **thanh search** để manager/staff có thể search các field cùng 1 lúc trên UI.

---

## Search Query theo từng entity

### **classes**

- `searchOr[name:contains]=Lớp moibile&searchOr[course.title:contains]=Lớp moibile&searchOr[instructor.username:contains]=Lớp moibile&searchOr[instructor.email:contains]=Lớp moibile`

(`searchOr[name%3Acontains]=L%E1%BB%9Bp%20moibile&searchOr[course.title%3Acontains]=L%E1%BB%9Bp%20moibile&searchOr[instructor.username%3Acontains]=L%E1%BB%9Bp%20moibile&searchOr[instructor.email%3Acontains]=L%E1%BB%9Bp%20moibile`)

### **pools**

- `searchOr[title:contains]`

### **news**

- `searchOr[title:contains]`

### **application-types**

- `searchOr[title:contains]`

### **orders**

- `searchOr[course.title:contains]=Khoá học bơi dành cho trẻ mới bắt đầu&searchOr[user.username:contains]=Khoá học bơi dành cho trẻ mới bắt đầu`
  (`searchOr[course.title%3Acontains]=Kho%C3%A1%20h%E1%BB%8Dc%20b%C6%A1i%20d%C3%A0nh%20cho%20tr%E1%BA%BB%20m%E1%BB%9Bi%20b%E1%BA%AFt%20%C4%91%E1%BA%A7u&searchOr[user.username%3Acontains]=Kho%C3%A1%20h%E1%BB%8Dc%20b%C6%A1i%20d%C3%A0nh%20cho%20tr%E1%BA%BB%20m%E1%BB%9Bi%20b%E1%BA%AFt%20%C4%91%E1%BA%A7u`)

- hiện tại classes và orders đang sử dụng searchOr (theo kiểu find common). vì classes và orders trên UI đang có thể searchOr theo nhiều field, nên tôi muốn sau khi manager/staff gõ kỹ tự trên search và đã trả ra kết quả search thì nên highlight những tên nào mà nó match với ký tự mà manager/staff muốn tìm kiến trên UI
