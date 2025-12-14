# Sample Application Request Bodies

Below are 5 example JSON request bodies you can use to create applications via the API (copy each JSON block into Postman body -> raw -> application/json).

---

## 1) Đơn đăng ký: Yêu cầu báo cáo tiến độ (Học viên)
```json
{
  "title": "Yêu cầu báo cáo tiến độ - Nguyễn Văn A",
  "content": "Xin gửi yêu cầu báo cáo tiến độ học viên sau 4 buổi. Vui lòng phản hồi kèm kết quả đánh giá.",
  "type": ["member"],
  "status": ["pending"]
}
```

## 2) Đơn đăng ký: Đăng ký lớp bổ sung (Phụ huynh)
```json
{
  "title": "Đăng ký lớp bổ sung - Trẻ em: Lê Thị B",
  "content": "Tôi muốn đăng ký thêm 1 suất cho con tên Lê Thị B vào lớp Bơi Cơ Bản, ca 17:00.",
  "type": ["member"],
  "status": ["pending"]
}
```

## 3) Đơn liên hệ: Khiếu nại / Phản ánh (Khách hàng)
```json
{
  "title": "Phản ánh: Điều kiện hồ bơi",
  "content": "Hồ bơi hôm nay có nước đục và cần vệ sinh. Vui lòng kiểm tra và phản hồi.",
  "type": ["member"],
  "status": ["pending"]
}
```

## 4) Đơn yêu cầu tuyển dụng HLV (Staff → internal)
```json
{
  "title": "Yêu cầu tuyển HLV bơi - Chi nhánh Hà Nội",
  "content": "Cần tuyển 2 HLV bơi bán thời gian, yêu cầu có kinh nghiệm dạy trẻ em. Xin phê duyệt ngân sách.",
  "type": ["staff"],
  "status": ["pending"]
}
```

## 5) Đơn đề xuất chương trình mới (Manager)
```json
{
  "title": "Đề xuất: Khóa đào tạo 'Bơi sơ cứu'",
  "content": "Đề xuất mở khóa ngắn hạn về cứu hộ và sơ cứu để nâng cao an toàn cho học viên. Kèm dự toán chi phí.",
  "type": ["manager"],
  "status": ["pending"]
}
```

---
Notes:
- Adjust `type` values to match your platform's expected identifiers (they may be role names or ApplicationType IDs).
- The API may require additional fields (tenant headers, auth token). Use your existing authenticated Postman setup.
