# Hướng Dẫn Chi Tiết Các Items Manager/Staff Có Thể Dùng Để Generate JSON Schema

Tài liệu này giải thích rõ ràng và chi tiết về từng loại item mà Manager/Staff có thể sử dụng để cấu hình và generate JSON Schema cho hệ thống.\n\n## Lưu ý chung về Dependencies\nTất cả các item **đều có thể khai báo dependencies**, không chỉ riêng text field. Vì vậy trong hệ thống sẽ có một mục riêng cho Manager/Staff cấu hình dependencies cho từng item trong `form_judge`. Dependencies cho phép hiển thị hoặc ẩn một field dựa vào giá trị của field khác. Mỗi mục bao gồm: mô tả, mục đích, danh sách các thuộc tính, và ví dụ minh họa.

---

## 1. Text Short / Text Field

### **Mục đích**

Dùng để tạo các trường nhập văn bản ngắn, dài, email, URL, datetime, date, time, color hoặc HTML.

### **Các thuộc tính**

- **type**: `string`
- **required**: bắt buộc hay không
- **is_filter**: dùng làm filter trong trang list
- **text_type**: loại text (`short_text`, `long_text`, `email`, `url`, `datetime`, `date`, `time`, `color`, `html`)
- **min / max**: số ký tự tối thiểu / tối đa
- **dependencies**: hiển thị field này khi field khác có giá trị cụ thể

### **Ví dụ**

```json
{
  "type": "object",
  "items": {
    "test": {
      "type": "string",
      "required": true,
      "is_filter": true,
      "text_type": "short_text",
      "min": 1,
      "max": 5,
      "dependencies": [
        {
          "field": "test1",
          "value": "test1"
        },
        {
          "field": "test2",
          "value": "test2"
        }
      ]
    }
  }
}
```

---

## 2. Number

### **Mục đích**

Tạo trường số, có thể đặt giới hạn min/max và hỗ trợ dạng mảng.

### **Các thuộc tính**

- **type**: `number`
- **is_array**: bật nếu là danh sách số
- **min / max**: giá trị nhỏ nhất/lớn nhất
- **min_array_lenght / max_array_lenght**: số lượng phần tử tối thiểu/tối đa

### **Ví dụ**

```json
{
  "type": "object",
  "items": {
    "test": {
      "type": "number",
      "required": true,
      "is_filter": true,
      "is_array": true,
      "min": 1,
      "max": 9,
      "min_array_lenght": 1,
      "max_array_lenght": 10
    }
  }
}
```

---

## 3. Number Coordinates

### **Mục đích**

Trường số đặc biệt dạng tọa độ (latitude/longitude). Bắt buộc bật `is_array`.

### **Thuộc tính bổ sung**

- **number_type**: `coordinates`

### **Ví dụ**

```json
{
  "type": "object",
  "items": {
    "test": {
      "type": "number",
      "required": true,
      "is_filter": true,
      "is_array": true,
      "number_type": "coordinates",
      "min": 1,
      "max": 9,
      "min_array_lenght": 1,
      "max_array_lenght": 10
    }
  }
}
```

---

## 4. Boolean

### **Mục đích**

Tạo field dạng `true/false`.

### **Ví dụ**

```json
{
  "type": "object",
  "items": {
    "test": {
      "type": "boolean",
      "required": true,
      "is_filter": true,
      "min": 1,
      "max": 9,
      "min_array_lenght": 1,
      "max_array_lenght": 10
    }
  }
}
```

---

## 5. Select

### **Mục đích**

Tạo dropdown có danh sách giá trị.

### **Thuộc tính**

- **select_values**: dạng `label:value,label2:value2`

### **Ví dụ**

```json
{
  "type": "object",
  "items": {
    "test": {
      "type": "select",
      "required": true,
      "is_filter": true,
      "min": 1,
      "max": 9,
      "min_array_lenght": 1,
      "max_array_lenght": 10,
      "select_values": "lable1:option1,lable2:option2"
    }
  }
}
```

---

## 6. Relation

### **Mục đích**

Tạo liên kết (relation) với entity khác trong hệ thống.

### **Thuộc tính**

- **entity**: tên entity cần liên kết
- **relation_type**: `1-1`, `1-n`, `n-n`
- **query_search**: query tùy chỉnh
- **dependencies**: điều kiện hiển thị

### **Ví dụ**

```json
{
  "type": "object",
  "items": {
    "test": {
      "type": "relation",
      "required": true,
      "is_filter": true,
      "min": 1,
      "max": 9,
      "min_array_lenght": 1,
      "max_array_lenght": 10,
      "entity": "dashboard",
      "relation_type": "1-1",
      "query_search": "example[query]search",
      "dependencies": []
    }
  }
}
```

---

Nếu bạn muốn tôi bổ sung mục **giải thích use-case**, **so sánh các loại field**, hoặc làm thêm **bảng tổng hợp**, hãy cho tôi biết!
