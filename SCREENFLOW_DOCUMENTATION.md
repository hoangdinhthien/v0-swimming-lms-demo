# AQUALearn LMS - Manager Screen Flow Documentation

## Tổng quan hệ thống

AquaLearn là hệ thống quản lý học tập toàn diện cho việc dạy bơi, bao gồm quản lý học viên, khóa học, giáo viên và hồ bơi. Tài liệu này tập trung vào luồng điều hướng của Manager (Quản lý) với đầy đủ quyền truy cập và quản lý hệ thống.

## Luồng điều hướng chính

### 1. LOGIN (Trang đăng nhập)

**URL:** /login
**Mục đích:** Xác thực tài khoản manager
**Thao tác có sẵn:**

- Nhập email và password
- Click "Đăng nhập" → Thành công chuyển đến TENANT SELECTION
- Thất bại → Hiển thị thông báo lỗi

### 2. TENANT SELECTION (Chọn chi nhánh)

**URL:** /tenant-selection
**Mục đích:** Chọn chi nhánh/cơ sở mà manager có quyền truy cập
**Thao tác có sẵn:**

- Hiển thị danh sách chi nhánh có sẵn
- Click chọn chi nhánh → Chuyển đến DASHBOARD
- Nếu chỉ có 1 chi nhánh → Tự động chọn và chuyển đến DASHBOARD

### 3. DASHBOARD (Trang chủ quản lý)

**URL:** /dashboard/manager
**Mục đích:** Trang tổng quan với thống kê và điều hướng
**Thao tác có sẵn:**

- Xem các thống kê tổng quan (số học viên, khóa học, doanh thu, etc.)
- Điều hướng đến các module khác qua sidebar

---

## MODULES CHI TIẾT

### STUDENTS (Học Viên/Members)

**URL:** /dashboard/manager/students
**Mục đích:** Quản lý danh sách học viên
**Thao tác có sẵn:**

- Xem danh sách học viên với thông tin cơ bản
- Tìm kiếm/lọc học viên
- **Click vào 1 học viên** → Chuyển đến STUDENT DETAIL
- **Click nút "Thêm học viên"** → Chuyển đến CREATE STUDENT

#### STUDENT DETAIL (Chi tiết học viên)

**URL:** /dashboard/manager/students/[id]
**Mục đích:** Xem và chỉnh sửa thông tin học viên
**Thao tác có sẵn:**

- Xem thông tin cá nhân đầy đủ của học viên
- **Click nút "Chỉnh sửa"** → Mở modal/popup chỉnh sửa học viên
  - Điền thông tin cần chỉnh sửa
  - **Click "Hủy"** → Đóng modal, không lưu thay đổi
  - **Click "Lưu thay đổi"** → Lưu thay đổi và đóng modal
- **Click nút "Quay về danh sách"** → Trở lại trang STUDENTS

#### CREATE STUDENT (Tạo học viên mới)

**URL:** /dashboard/manager/students/create
**Mục đích:** Tạo tài khoản học viên mới
**Thao tác có sẵn:**

- Điền form thông tin học viên mới
- **Click nút "Quay về danh sách học viên"** → Trở lại trang STUDENTS
- **Click nút "Thêm học viên"** (sau khi điền thông tin) → Tạo học viên và chuyển về trang STUDENTS

---

### INSTRUCTORS (Giáo viên)

**URL:** /dashboard/manager/instructors
**Mục đích:** Quản lý danh sách giáo viên
**Thao tác có sẵn:**

- Xem danh sách giáo viên
- Tìm kiếm/lọc giáo viên
- **Click vào 1 giáo viên** → Chuyển đến INSTRUCTOR DETAIL
- **Click nút "Thêm giáo viên"** → Chuyển đến CREATE INSTRUCTOR

#### INSTRUCTOR DETAIL (Chi tiết giáo viên)

**URL:** /dashboard/manager/instructors/[id]
**Mục đích:** Xem và chỉnh sửa thông tin giáo viên
**Thao tác có sẵn:**

- Xem thông tin cá nhân đầy đủ của giáo viên
- **Click nút "Quay về danh sách"** → Trở lại trang INSTRUCTORS
- **Click nút "Chỉnh sửa"** → Mở modal/popup chỉnh sửa giáo viên
  - Điền thông tin cần chỉnh sửa
  - **Click "Hủy"** → Đóng modal, không lưu thay đổi
  - **Click "Lưu thay đổi"** → Lưu thay đổi và đóng modal

#### CREATE INSTRUCTOR (Tạo giáo viên mới)

**URL:** /dashboard/manager/instructors/create
**Mục đích:** Tạo tài khoản giáo viên mới
**Thao tác có sẵn:**

- Điền form thông tin giáo viên mới
- **Click nút "Quay về danh sách giáo viên"** → Trở lại trang INSTRUCTORS
- **Click nút "Thêm giáo viên"** (sau khi điền thông tin) → Tạo giáo viên và chuyển về trang INSTRUCTORS

---

### STAFFS (Nhân viên)

**URL:** /dashboard/manager/staff
**Mục đích:** Quản lý danh sách nhân viên
**Thao tác có sẵn:**

- Xem danh sách nhân viên
- Tìm kiếm/lọc nhân viên
- **Click nút "Thêm nhân viên"** → Chuyển đến CREATE STAFF
- **Click nút "Chi tiết" của 1 staff** → Chuyển đến STAFF DETAIL
- **Click nút "Quyền hạn" của 1 staff** → Mở modal chỉnh sửa permission
  - Thay đổi các quyền của staff
  - **Click "Hủy"** → Đóng modal, không lưu thay đổi
  - **Click "Lưu quyền hạn"** → Lưu thay đổi quyền và đóng modal

#### STAFF DETAIL (Chi tiết nhân viên)

**URL:** /dashboard/manager/staff/[id]
**Mục đích:** Xem và chỉnh sửa thông tin nhân viên
**Thao tác có sẵn:**

- Xem thông tin cá nhân đầy đủ của nhân viên
- **Click nút "Chỉnh sửa thông tin"** → Mở modal chỉnh sửa thông tin
  - Điền thông tin cần chỉnh sửa
  - **Click "Hủy"** → Đóng modal, không lưu thay đổi
  - **Click "Lưu thay đổi"** → Lưu thay đổi và đóng modal
- **Click nút "Quản lý quyền truy cập"** → Mở modal chỉnh sửa permission
  - Thay đổi các quyền của staff
  - **Click "Hủy"** → Đóng modal, không lưu thay đổi
  - **Click "Lưu quyền hạn"** → Lưu thay đổi quyền và đóng modal
- **Click nút "Quay về danh sách"** → Trở lại trang STAFFS

#### CREATE STAFF (Tạo nhân viên mới)

**URL:** /dashboard/manager/staff/create
**Mục đích:** Tạo tài khoản nhân viên mới
**Thao tác có sẵn:**

- Điền form thông tin nhân viên mới
- **Click nút "Quay về danh sách nhân viên"** → Trở lại trang STAFFS
- **Click nút "Hủy bỏ"** → Trở lại trang STAFFS
- **Click nút "Tạo nhân viên"** (sau khi điền thông tin) → Tạo nhân viên và chuyển về trang STAFFS

---

### COURSES (Khóa học)

**URL:** /dashboard/manager/courses
**Mục đích:** Quản lý danh sách khóa học
**Thao tác có sẵn:**

- Xem danh sách khóa học
- Tìm kiếm/lọc khóa học
- **Click nút "Quản lý danh mục"** → Mở modal COURSE CATEGORIES
  - **Điền thông tin course category mới** + toggle trạng thái hoạt động
  - **Click nút "Thêm"** → Tạo course category mới
  - **Click icon chỉnh sửa** của course category → Chỉnh sửa thông tin
  - **Click icon thùng rác** của course category → Mở modal xác nhận xóa
  - **Click nút "Đóng"** → Đóng modal COURSE CATEGORIES
- **Click nút "Thêm khóa học"** → Chuyển đến CREATE COURSE
- **Click vào một khóa học** → Chuyển đến COURSE DETAIL

#### CREATE COURSE (Tạo khóa học mới)

**URL:** /dashboard/manager/courses/create
**Mục đích:** Tạo khóa học mới
**Thao tác có sẵn:**

- Điền form thông tin khóa học mới
- **Click nút "Quay về danh sách khóa học"** → Trở lại trang COURSES
- **Click nút "Hủy"** → Trở lại trang COURSES
- **Click nút "Tạo khóa học"** (sau khi điền thông tin) → Tạo khóa học và chuyển về trang COURSES

#### COURSE DETAIL (Chi tiết khóa học)

**URL:** /dashboard/manager/courses/[id]
**Mục đích:** Xem và chỉnh sửa thông tin khóa học
**Thao tác có sẵn:**

- Xem thông tin chi tiết của khóa học
- **Click nút "Quay về danh sách"** → Trở lại trang COURSES
- **Click nút "Chỉnh sửa khóa học"** → Mở modal chỉnh sửa khóa học
  - Điền thông tin cần chỉnh sửa
  - **Click "Hủy"** → Đóng modal, không lưu thay đổi
  - **Click "Lưu thay đổi"** → Lưu thay đổi và đóng modal

---

### CLASSES (Lớp học)

**URL:** /dashboard/manager/classes
**Mục đích:** Quản lý danh sách lớp học
**Thao tác có sẵn:**

- Xem danh sách lớp học
- Tìm kiếm/lọc lớp học
- **Click vào một lớp học** → Chuyển đến CLASS DETAIL
- **Click nút "Thêm lớp học mới"** → Chuyển đến CREATE CLASS

#### CREATE CLASS (Tạo lớp học mới)

**URL:** /dashboard/manager/classes/create
**Mục đích:** Tạo lớp học mới
**Thao tác có sẵn:**

- Điền form thông tin lớp học mới
- **Click nút "Quay về Danh sách lớp học"** → Trở lại trang CLASSES
- **Click nút "Hủy"** → Trở lại trang CLASSES
- **Click nút "Tạo lớp học"** (sau khi điền thông tin) → Tạo lớp học và chuyển về trang CLASSES

#### CLASS DETAIL (Chi tiết lớp học)

**URL:** /dashboard/manager/classes/[id]
**Mục đích:** Xem và quản lý thông tin lớp học
**Thao tác có sẵn:**

- Xem thông tin chi tiết của lớp học
- **Click nút "Quay về danh sách lớp học"** → Trở lại trang CLASSES
- **Click nút "Chỉnh sửa lớp học"** → Mở modal chỉnh sửa lớp học
  - Điền thông tin cần chỉnh sửa
  - **Click "Hủy"** → Đóng modal, không lưu thay đổi
  - **Click "Lưu thay đổi"** → Lưu thay đổi và đóng modal
- **Click vào học viên hoặc giáo viên** trong phần "Thông tin lớp học" → Chuyển đến STUDENT DETAIL hoặc INSTRUCTOR DETAIL
- **Nếu lớp học chưa được xếp đủ số buổi học**: Hiển thị nút "Tự động xếp lịch học"
  - **Click nút "Tự động xếp lịch học"** → Mở modal setup thời gian
  - Thiết lập thời gian cho việc tự động xếp lịch
  - **Click nút "Tự động xếp lịch"** → Hệ thống tự động xếp lịch và đóng modal
  - **Click nút "Hủy"** → Đóng modal, không thực hiện xếp lịch

---

### NEWS (Tin tức)

**URL:** /dashboard/manager/news
**Mục đích:** Quản lý tin tức/bài viết
**Thao tác có sẵn:**

- Xem danh sách tin tức
- Tìm kiếm/lọc tin tức
- **Click nút "Tạo tin tức"** → Mở modal CREATE NEWS
  - Điền thông tin tin tức mới
  - **Click nút "Hủy"** → Đóng modal, không tạo tin tức
  - **Click nút "Tạo tin tức"** → Tạo tin tức và đóng modal
- **Click vào một tin tức** → Chuyển đến NEWS DETAIL

#### NEWS DETAIL (Chi tiết tin tức)

**URL:** /dashboard/manager/news/[id]
**Mục đích:** Xem và chỉnh sửa tin tức
**Thao tác có sẵn:**

- Xem nội dung chi tiết của tin tức
- **Click nút "Quay về danh sách"** → Trở lại trang NEWS
- **Click nút "Chỉnh sửa"** → Mở modal chỉnh sửa tin tức
  - Điền thông tin cần chỉnh sửa
  - **Click nút "Hủy"** → Đóng modal, không lưu thay đổi
  - **Click nút "Cập nhật tin tức"** → Lưu thay đổi và đóng modal

---

### APPLICATIONS (Đơn từ)

**URL:** /dashboard/manager/applications
**Mục đích:** Quản lý đơn từ/đơn xin học
**Thao tác có sẵn:**

- Xem danh sách đơn từ
- Tìm kiếm/lọc đơn từ
- **Click vào một đơn từ** → Chuyển đến APPLICATION DETAIL

#### APPLICATION DETAIL (Chi tiết đơn từ)

**URL:** /dashboard/manager/applications/[id]
**Mục đích:** Xem và xử lý đơn từ
**Thao tác có sẵn:**

- Xem thông tin chi tiết của đơn từ
- **Click nút "Quay về danh sách đơn từ"** → Trở lại trang APPLICATIONS
- **Click nút "Phản hồi đơn"** → Phản hồi đơn từ

---

### APPLICATION TYPE (Loại đơn từ)

**URL:** /dashboard/manager/application-types
**Mục đích:** Quản lý các loại đơn từ
**Thao tác có sẵn:**

- Xem danh sách loại đơn từ
- **Click nút "Tạo loại đơn từ mới"** → Mở modal tạo loại đơn từ
  - Điền thông tin loại đơn từ mới
  - **Click nút "Hủy"** → Đóng modal, không tạo
  - **Click nút "Tạo loại đơn từ"** → Tạo loại đơn từ và đóng modal

---

### ORDERS (Giao dịch)

**URL:** /dashboard/manager/transactions
**Mục đích:** Quản lý giao dịch thanh toán
**Thao tác có sẵn:**

- Xem danh sách giao dịch
- Tìm kiếm/lọc giao dịch
- **Click vào một giao dịch** → Chuyển đến ORDER DETAIL

#### ORDER DETAIL (Chi tiết giao dịch)

**URL:** /dashboard/manager/transactions/[id]
**Mục đích:** Xem chi tiết giao dịch
**Thao tác có sẵn:**

- Xem thông tin chi tiết của giao dịch
- Xem lịch sử thanh toán
- Xem thông tin hóa đơn (nếu có)

---

### CALENDAR (Lịch)

**URL:** /dashboard/manager/calendar
**Mục đích:** Xem và quản lý lịch trình
**Ghi chú:** Calendar hiển thị dạng view tháng
**Thao tác có sẵn:**

- Xem lịch theo tháng với các buổi học
- **Click vào một ô (cell) trên lịch** → Mở drawer hiển thị thông tin các buổi học của ngày đó
  - **Trong drawer:**
    - **Click icon thùng rác** → Xóa thông tin buổi học khỏi lịch
    - **Click icon hình con mắt** của một buổi học → Mở modal chi tiết buổi học
      - **Trong modal chi tiết buổi học:**
        - **Click nút "Đóng"** → Đóng modal
        - **Click nút "Chỉnh sửa"** → Hiện tab "Chỉnh sửa buổi học" trong drawer
        - **Click nút "Xóa lớp học"** → Xóa lớp học

---

### SETTING (Cài đặt tài khoản)

**URL:** /dashboard/manager/settings
**Mục đích:** Cài đặt tài khoản cá nhân
**Thao tác có sẵn:**

- Thay đổi mật khẩu
- Cập nhật thông tin cá nhân
- Cài đặt thông báo
- Quản lý hồ sơ cá nhân

---

### POOLS (Hồ bơi)

**URL:** /dashboard/manager/pools
**Mục đích:** Quản lý hồ bơi
**Thao tác có sẵn:**

- Xem danh sách hồ bơi
- **Click vào một hồ bơi** → Chuyển đến POOLS DETAIL

#### POOLS DETAIL (Chi tiết hồ bơi)

**URL:** /dashboard/manager/pools/[id]
**Mục đích:** Xem và quản lý thông tin hồ bơi
**Thao tác có sẵn:**

- Xem thông tin chi tiết của hồ bơi
- Chỉnh sửa thông tin hồ bơi
- Quản lý lịch sử bảo trì
- Quản lý thiết bị hồ bơi

---

## NAVIGATION (Điều hướng)

### Sidebar Navigation (Thanh điều hướng bên trái)

- **Dashboard** → /dashboard/manager
- **Students (Members)** → /dashboard/manager/students
- **Instructors (Giáo viên)** → /dashboard/manager/instructors
- **Staffs (Nhân viên)** → /dashboard/manager/staff
- **Courses (Khóa học)** → /dashboard/manager/courses
- **Classes (Lớp học)** → /dashboard/manager/classes
- **News (Tin tức)** → /dashboard/manager/news
- **Applications (Đơn từ)** → /dashboard/manager/applications
- **Application types (Loại đơn từ)** → /dashboard/manager/application-types
- **Orders (Giao dịch)** → /dashboard/manager/transactions
- **Setting (Account settings)** → /dashboard/manager/settings

### Header Navigation (Thanh điều hướng trên cùng)

- **Logo AquaLearn** → Click để về trang chủ dashboard
- **Dropdown Chi Nhánh** → Chọn chi nhánh khác để chuyển đổi
- **Theme Toggle** → Chuyển đổi chế độ sáng/tối
- **User Menu** → Click để hiển thị menu user (đăng xuất, cài đặt cá nhân)

---

## Các tính năng chung

### Modal & Popup Management

- **Create/Edit Modals**: Form tạo/sửa với validation
- **Confirmation Dialogs**: Xác nhận hành động (xóa, submit)
- **Permission Modals**: Quản lý quyền truy cập
- **Category Management Modals**: Quản lý danh mục

### Loading States

- Card-style loader cho các trang danh sách
- Skeleton loading cho chi tiết
- Loading spinner cho các thao tác async

### Error Handling

- Toast notifications cho success/error
- Form validation với thông báo lỗi
- Error boundaries cho runtime errors

### Responsive Design

- Mobile-friendly với collapsible sidebar
- Adaptive layout cho các kích thước màn hình
- Touch-friendly cho mobile devices

---

## Quy tắc phân quyền Manager

Manager có quyền truy cập đầy đủ tất cả các module và chức năng:

- Tạo/Sửa/Xóa tất cả dữ liệu
- Quản lý nhân viên và phân quyền
- Xem tất cả báo cáo và thống kê
- Truy cập tất cả chi nhánh (nếu có quyền)
- Quản lý hệ thống và cài đặt
  **Mục đích:** Trang giới thiệu và quảng bá hệ thống AquaLearn LMS
  **Thao tác có sẵn:**

- Xem thông tin tổng quan về hệ thống
- Xem các tính năng chính của LMS
- **Click nút "Bảng điều khiển"** → Chuyển đến trang đăng nhập manager (/login)
- **Click nút "Đăng nhập"** → Chuyển đến trang đăng nhập (/login)
- Xem thông tin liên hệ và giới thiệu công ty

### 2. Trang Đăng Nhập (/login)

**URL:** /login
**Mục đích:** Xác thực người dùng
**Thao tác có sẵn:**

- Nhập email/password và đăng nhập
- Thành công → Chuyển đến /tenant-selection
- Thất bại → Hiển thị lỗi

### 3. Chọn Chi Nhánh (/tenant-selection)

**URL:** /tenant-selection
**Mục đích:** Chọn chi nhánh/cơ sở để làm việc
**Thao tác có sẵn:**

- Hiển thị danh sách chi nhánh có sẵn
- Chọn chi nhánh → Chuyển đến /dashboard
- Nếu chỉ có 1 chi nhánh → Tự động chọn

### 4. Dashboard Redirect (/dashboard)

**URL:** /dashboard
**Mục đích:** Chuyển hướng dựa trên vai trò người dùng
**Logic chuyển hướng:**

- Role = "staff" → /dashboard/staff
- Role = "manager" hoặc "admin" → /dashboard/manager

---

## MANAGER DASHBOARD (/dashboard/manager)

### Trang chủ Manager (/dashboard/manager)

**Mục đích:** Dashboard tổng quan cho manager
**Thao tác có sẵn:**

- Xem thống kê tổng quan
- Điều hướng đến các module khác qua sidebar

### Học Viên (Students/Members) (/dashboard/manager/students)

**URL:** /dashboard/manager/students
**Mục đích:** Quản lý danh sách học viên
**Thao tác có sẵn:**

- Xem danh sách học viên với thông tin cơ bản (tên, email, số điện thoại, trạng thái)
- Tìm kiếm/lọc học viên theo tên, email, trạng thái
- **Click vào 1 học viên** → Chuyển đến trang chi tiết học viên (/dashboard/manager/students/[id])
- **Click nút "Thêm học viên"** → Chuyển đến trang tạo học viên (/dashboard/manager/students/create)
- Phân trang và sắp xếp danh sách
- Export danh sách học viên (nếu có)

#### Chi Tiết Học Viên (Student Detail) (/dashboard/manager/students/[id])

**URL:** /dashboard/manager/students/[id]
**Mục đích:** Xem và chỉnh sửa thông tin chi tiết của học viên
**Thao tác có sẵn:**

- Xem thông tin cá nhân đầy đủ (họ tên, email, số điện thoại, ngày sinh, địa chỉ)
- Xem lịch sử đăng ký khóa học
- Xem lịch sử thanh toán/giao dịch
- Xem trạng thái học tập hiện tại
- **Chỉnh sửa thông tin** học viên
- **Thêm ghi chú** về học viên
- **Xem/Xem chi tiết** các khóa học đã đăng ký
- **Quay về danh sách học viên** → Trở lại trang danh sách (/dashboard/manager/students)

#### Tạo Học Viên Mới (Create Student) (/dashboard/manager/students/create)

**URL:** /dashboard/manager/students/create
**Mục đích:** Tạo tài khoản và thông tin cho học viên mới
**Thao tác có sẵn:**

- Điền form thông tin học viên (họ tên, email, số điện thoại, ngày sinh, địa chỉ, v.v.)
- Upload ảnh đại diện (tùy chọn)
- Chọn gói học tập/khóa học ban đầu (tùy chọn)
- **Click nút "Quay về danh sách học viên"** → Trở lại trang danh sách (/dashboard/manager/students)
- **Click nút "Thêm học viên"** (sau khi điền đầy đủ thông tin) → Tạo học viên thành công và chuyển về trang danh sách (/dashboard/manager/students)
- Validation form với thông báo lỗi chi tiết
- Hiển thị loading trong khi tạo học viên

### Giáo Viên (/dashboard/manager/instructors)

**Mục đích:** Quản lý danh sách giáo viên
**Thao tác có sẵn:**

- Xem danh sách giáo viên
- Tìm kiếm/lọc giáo viên
- Thêm giáo viên mới
- Click vào giáo viên → Chi tiết giáo viên

### Nhân Viên (/dashboard/manager/staff)

**Mục đích:** Quản lý danh sách nhân viên
**Thao tác có sẵn:**

- Xem danh sách nhân viên
- Tìm kiếm/lọc nhân viên
- Thêm nhân viên mới
- Phân quyền cho nhân viên
- Click vào nhân viên → Chi tiết nhân viên

### Khóa Học (/dashboard/manager/courses)

**Mục đích:** Quản lý danh sách khóa học
**Thao tác có sẵn:**

- Xem danh sách khóa học
- Tìm kiếm/lọc khóa học
- Thêm khóa học mới
- Click vào khóa học → Chi tiết khóa học

### Lớp Học (/dashboard/manager/classes)

**Mục đích:** Quản lý danh sách lớp học
**Thao tác có sẵn:**

- Xem danh sách lớp học
- Tìm kiếm/lọc lớp học
- Thêm lớp học mới
- Click vào lớp học → Chi tiết lớp học

### Tin Tức (/dashboard/manager/news)

**Mục đích:** Quản lý tin tức/bài viết
**Thao tác có sẵn:**

- Xem danh sách tin tức
- Tìm kiếm/lọc tin tức
- Thêm tin tức mới
- Click vào tin tức → Chi tiết tin tức (/dashboard/manager/news/[id])

#### Chi Tiết Tin Tức (/dashboard/manager/news/[id])

**Mục đích:** Xem và chỉnh sửa tin tức
**Thao tác có sẵn:**

- Xem nội dung tin tức
- Chỉnh sửa tin tức
- Upload ảnh bìa
- Quay về danh sách

### Lịch (/dashboard/manager/calendar)

**Mục đích:** Xem lịch trình tổng quan
**Thao tác có sẵn:**

- Xem lịch theo ngày/tuần/tháng
- Xem các lớp học trong ngày
- Điều hướng đến chi tiết lớp học

### Đơn Từ (/dashboard/manager/applications)

**Mục đích:** Quản lý đơn từ/đơn xin học
**Thao tác có sẵn:**

- Xem danh sách đơn từ
- Duyệt/từ chối đơn từ
- Click vào đơn từ → Chi tiết đơn từ

### Loại Đơn Từ (/dashboard/manager/application-types)

**Mục đích:** Quản lý các loại đơn từ
**Thao tác có sẵn:**

- Xem danh sách loại đơn từ
- Thêm/sửa/xóa loại đơn từ

### Giao Dịch (/dashboard/manager/transactions)

**Mục đích:** Quản lý giao dịch thanh toán
**Thao tác có sẵn:**

- Xem danh sách giao dịch
- Tìm kiếm/lọc giao dịch
- Xem chi tiết giao dịch

### Khuyến Mãi (/dashboard/manager/promotions)

**Mục đích:** Quản lý chương trình khuyến mãi
**Thao tác có sẵn:**

- Xem danh sách khuyến mãi
- Thêm/sửa/xóa khuyến mãi

### Cài Đặt Tài Khoản (/dashboard/manager/settings)

**Mục đích:** Cài đặt tài khoản cá nhân
**Thao tác có sẵn:**

- Thay đổi mật khẩu
- Cài đặt thông báo
- Quản lý hồ sơ cá nhân

---

## STAFF DASHBOARD (/dashboard/staff)

### Trang chủ Staff (/dashboard/staff)

**Mục đích:** Dashboard tổng quan cho staff (giới hạn quyền)
**Thao tác có sẵn:**

- Xem thống kê cơ bản
- Điều hướng đến các module được phép

### Học Viên (/dashboard/staff/students)

**Mục đích:** Xem danh sách học viên (chỉ đọc)
**Thao tác có sẵn:**

- Xem danh sách học viên với thông tin cơ bản
- Tìm kiếm/lọc học viên theo tên, email, trạng thái
- **Click vào 1 học viên** → Xem chi tiết học viên (chỉ xem, không chỉnh sửa)
- Phân trang và sắp xếp danh sách
- **Không có quyền thêm/sửa/xóa học viên**

#### Chi Tiết Học Viên (Staff View) (/dashboard/staff/students/[id])

**Mục đích:** Xem thông tin chi tiết học viên (chỉ đọc)
**Thao tác có sẵn:**

- Xem thông tin cá nhân đầy đủ (chỉ xem)
- Xem lịch sử đăng ký khóa học (chỉ xem)
- Xem lịch sử thanh toán/giao dịch (chỉ xem)
- Xem trạng thái học tập hiện tại (chỉ xem)
- **Không có quyền chỉnh sửa thông tin**
- **Quay về danh sách học viên** → Trở lại trang danh sách (/dashboard/staff/students)

### Giáo Viên (/dashboard/staff/instructors)

**Mục đích:** Xem danh sách giáo viên (chỉ đọc)
**Thao tác có sẵn:**

- Xem danh sách giáo viên
- Tìm kiếm/lọc giáo viên

### Khóa Học (/dashboard/staff/courses)

**Mục đích:** Xem danh sách khóa học (chỉ đọc)
**Thao tác có sẵn:**

- Xem danh sách khóa học
- Tìm kiếm/lọc khóa học

### Lớp Học (/dashboard/staff/classes)

**Mục đích:** Xem danh sách lớp học (chỉ đọc)
**Thao tác có sẵn:**

- Xem danh sách lớp học
- Tìm kiếm/lọc lớp học

### Tin Tức (/dashboard/staff/news)

**Mục đích:** Xem tin tức (chỉ đọc)
**Thao tác có sẵn:**

- Xem danh sách tin tức
- Đọc tin tức

### Lịch (/dashboard/staff/calendar)

**Mục đích:** Xem lịch trình (chỉ đọc)
**Thao tác có sẵn:**

- Xem lịch theo ngày/tuần/tháng
- Xem các lớp học trong ngày

### Đơn Từ (/dashboard/staff/applications)

**Mục đích:** Xem và xử lý đơn từ (theo quyền)
**Thao tác có sẵn:**

- Xem danh sách đơn từ
- Xử lý đơn từ (nếu có quyền)

### Giao Dịch (/dashboard/staff/transactions)

**Mục đích:** Xem giao dịch (theo quyền)
**Thao tác có sẵn:**

- Xem danh sách giao dịch
- Xem chi tiết giao dịch

---

## Quy tắc phân quyền

### Manager (Quản lý)

- Quyền truy cập đầy đủ tất cả module
- Có thể thêm/sửa/xóa tất cả dữ liệu
- Quản lý nhân viên và phân quyền
- Xem tất cả báo cáo và thống kê

### Staff (Nhân viên)

- Quyền truy cập giới hạn theo phân quyền từ manager
- Các module có thể truy cập:
  - students (GET)
  - instructors (GET)
  - courses (GET)
  - classes (GET)
  - news (GET)
  - calendar (GET)
  - applications (theo quyền)
  - transactions (theo quyền)
- Chỉ có quyền xem, không thể chỉnh sửa

---

## Các tính năng chung

## Các tính năng chung

### Navigation (Điều hướng)

**Sidebar Navigation (Thanh điều hướng bên trái):**

- Dashboard (Trang chủ) - Luôn hiển thị
- Học Viên (Students) - Click → /dashboard/manager/students
- Giáo Viên (Instructors) - Click → /dashboard/manager/instructors
- Nhân Viên (Staff) - Click → /dashboard/manager/staff
- Khóa Học (Courses) - Click → /dashboard/manager/courses
- Lớp Học (Classes) - Click → /dashboard/manager/classes
- Tin Tức (News) - Click → /dashboard/manager/news
- Lịch (Calendar) - Click → /dashboard/manager/calendar
- Đơn Từ (Applications) - Click → /dashboard/manager/applications
- Loại Đơn Từ (Application Types) - Click → /dashboard/manager/application-types
- Giao Dịch (Transactions) - Click → /dashboard/manager/transactions
- Khuyến Mãi (Promotions) - Click → /dashboard/manager/promotions
- Cài Đặt (Settings) - Click → /dashboard/manager/settings

**Header Navigation (Thanh điều hướng trên cùng):**

- Logo AquaLearn - Click → Về trang chủ dashboard
- Dropdown Chi Nhánh - Chọn chi nhánh khác → Reload dashboard với tenant mới
- Theme Toggle - Chuyển đổi sáng/tối
- User Menu - Click → Hiển thị menu user (đăng xuất, cài đặt cá nhân)

**Breadcrumb Navigation:**

- Hiển thị đường dẫn hiện tại (VD: Dashboard > Học Viên > Chi Tiết Học Viên)
- Click vào từng level → Quay về trang đó

### Loading States

- Card-style loader cho các trang danh sách
- Skeleton loading cho chi tiết
- Loading screen cho các thao tác chuyển trang

### Action Buttons & Modal Dialogs

**Common Action Buttons:**

- **"Thêm mới" / "Tạo mới"** - Mở modal/form tạo item mới
- **"Chỉnh sửa" / "Sửa"** - Mở modal/form chỉnh sửa
- **"Xóa" / "Xóa bỏ"** - Hiển thị confirmation dialog
- **"Lưu" / "Cập nhật"** - Lưu thay đổi và đóng modal
- **"Hủy" / "Cancel"** - Đóng modal mà không lưu thay đổi
- **"Quay về" / "Back"** - Trở lại trang trước đó
- **"Xem chi tiết" / "Detail"** - Chuyển đến trang chi tiết

**Modal Types:**

- **Create/Edit Forms** - Form tạo/sửa với validation
- **Confirmation Dialogs** - Xác nhận hành động (xóa, submit, etc.)
- **Detail View Modals** - Hiển thị thông tin chi tiết mà không chuyển trang
- **Image/File Upload Modals** - Upload và preview files

**Toast Notifications:**

- Success: "Thao tác thành công" (màu xanh)
- Error: "Có lỗi xảy ra" (màu đỏ)
- Warning: "Cảnh báo" (màu vàng)
- Info: "Thông tin" (màu xanh dương)

### Responsive Design

- Mobile-friendly với collapsible sidebar
- Adaptive layout cho các kích thước màn hình
- Touch-friendly cho mobile devices

---

## API Integration

### Authentication Flow

1. Login → Nhận JWT token
2. Chọn tenant → Set tenant context
3. Tất cả API calls sau đó include:
   - Authorization: Bearer {token}
   - x-tenant-id: {tenantId}

### Permission System

- Staff permissions được fetch từ API
- Navigation items được filter dựa trên quyền
- UI components ẩn/hiện theo quyền

### Data Management

- React Query cho caching
- Optimistic updates
- Error retry logic
- Request deduplication

---

## Performance Optimizations

### Code Splitting

- Dynamic imports cho các trang lớn
- Lazy loading components
- Bundle splitting theo route

### Caching Strategy

- API response caching
- Image optimization
- Static asset caching

### UI Optimizations

- Virtual scrolling cho danh sách lớn
- Skeleton loading
- Progressive loading
- Debounced search

---

## Deployment & Environment

### Environments

- Development: Local development
- Staging: Testing environment
- Production: Live system

### Build Process

- Next.js build optimization
- Static generation where possible
- CDN integration
- Environment-specific configs

---

## Workflow Tổng Thể

### Quy Trình Đăng Ký Học Viên Mới

1. **Manager đăng nhập** → Dashboard Manager
2. **Vào Học Viên** → Xem danh sách học viên hiện tại
3. **Click "Thêm học viên"** → Mở trang tạo học viên
4. **Điền thông tin học viên** → Validate form
5. **Click "Thêm học viên"** → Tạo thành công → Trở về danh sách
6. **Học viên mới hiển thị** trong danh sách

### Quy Trình Quản Lý Khóa Học

1. **Manager vào Khóa Học** → Xem danh sách khóa học
2. **Click "Thêm khóa học"** → Tạo khóa học mới
3. **Sau khi tạo** → Vào Lớp Học để tạo lớp từ khóa học đó
4. **Phân công giáo viên** cho lớp học
5. **Học viên đăng ký** → Duyệt đơn trong Đơn Từ
6. **Theo dõi tiến độ** qua Lịch và Báo cáo

### Quy Trình Xử Lý Đơn Từ

1. **Học viên nộp đơn** → Đơn từ xuất hiện trong Applications
2. **Staff/Manager xem đơn** → Review thông tin
3. **Duyệt/Từ chối** → Cập nhật trạng thái đơn
4. **Nếu duyệt** → Tạo tài khoản học viên hoặc thêm vào lớp
5. **Thông báo kết quả** cho học viên qua email/tin tức

### Quy Trình Thanh Toán

1. **Học viên đăng ký** → Tạo đơn hàng trong hệ thống
2. **Xem chi tiết thanh toán** trong Giao Dịch
3. **Xử lý thanh toán** → Cập nhật trạng thái
4. **Xuất hóa đơn** và gửi thông tin cho học viên
5. **Theo dõi doanh thu** qua báo cáo tổng quan

---
