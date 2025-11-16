# Tài liệu kỹ thuật: Các loại field & cấu trúc JSON lưu trong `form_judge`

## 1. Tổng quan cấu trúc

`form_judge` lưu dữ liệu dưới dạng JSON Schema tùy biến. Mỗi field là do
manager/staff tự thiết kế trên UI.

```json
{
  "type": "object",
  "items": {
    "<field_name>": {
      "type": "<string|number|boolean|select>",
      "required": true,
      "is_filter": true
    }
  }
}
```

---

## 2. Các thuộc tính chung

---

Thuộc tính Loại Ý nghĩa

---

`type` string Loại field

`required` boolean Bắt buộc nhập

`is_filter` boolean Dùng để filter

`text_type` string Áp dụng cho string

`is_array` boolean Dạng mảng

`min` / `max` number Giới hạn

`min_array_lenght` / number Giới hạn phần tử array
`max_array_lenght`

`number_type` string Dạng số đặc biệt
(coordinates)

`select_values` string Options của select

---

---

## 3. Chi tiết từng loại field

### String (text)

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
      "max": 5
    }
  }
}
```

---

### Number

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

### Number (coordinates)

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

### Boolean

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

### Select

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
