


# HỆ THỐNG QUẢN LÝ HỌC SINH

<p align="center">
  <a href="https://www.uit.edu.vn/">
    <img src="https://i.imgur.com/WmMnSRt.png" alt="UIT" width="400"/>
  </a>
</p>

<h2 align="center">NHẬP MÔN CÔNG NGHỆ PHẦN MỀM - SE104.Q21</h2>
<h3 align="center">ĐỒ ÁN CUỐI KỲ: HỆ THỐNG QUẢN LÝ HỌC SINH</h3>

---

## Thành viên nhóm

| STT | MSSV     | Họ và Tên           | Chức vụ     | Github                        | Email                                                   |
| --- | -------- | ------------------- | ----------- | ----------------------------- | ------------------------------------------------------- |
| 1   | 24520212 | ĐÀO THỊ MAI CHI     | Nhóm trưởng | https://github.com/maichidao  | [24520212@gm.uit.edu.vn](mailto:24520212@gm.uit.edu.vn) |
| 2   | 24520109 | NGUYỄN NGỌC LAN ANH | Thành viên  | https://github.com/ngnlananh  | [24520109@gm.uit.edu.vn](mailto:24520109@gm.uit.edu.vn) |
| 3   | 24520071 | PHẠM THỊ THÁI AN    | Thành viên  | https://github.com/HufaCung   | [24520071@gm.uit.edu.vn](mailto:24520071@gm.uit.edu.vn) |
| 4   | 23521717 | NGUYỄN ANH TUẤN     | Thành viên  | https://github.com/blastvious | [23521717@gm.uit.edu.vn](mailto:23521717@gm.uit.edu.vn) |

---

# GIỚI THIỆU MÔN HỌC

* **Tên môn học:** Nhập môn Công nghệ Phần mềm
* **Mã môn học:** SE104
* **Mã lớp:** SE104.Q21
* **Năm học:** Học kỳ 2 (2025 - 2026)
* **Giảng viên hướng dẫn:** Đỗ Thị Thanh Tuyền

---

# GIỚI THIỆU ĐỀ TÀI

Hệ thống Quản lý Học sinh là một ứng dụng web được xây dựng nhằm hỗ trợ nhà trường trong việc quản lý toàn bộ quá trình học tập của học sinh từ khi tiếp nhận hồ sơ, phân lớp, nhập điểm, đánh giá kết quả học tập cho đến thống kê và báo cáo.

Hệ thống được phát triển dựa trên các quy định nghiệp vụ của trường trung học, giúp:

* Giảm thiểu thao tác thủ công.
* Đảm bảo tính chính xác của dữ liệu.
* Tăng tốc độ xử lý nghiệp vụ.
* Hỗ trợ tra cứu và thống kê nhanh chóng.
* Đảm bảo tính nhất quán trong quản lý học sinh.

---

# MỤC TIÊU HỆ THỐNG

## Quản lý học sinh

* Tiếp nhận hồ sơ học sinh.
* Cập nhật thông tin học sinh.
* Tìm kiếm học sinh.
* Theo dõi trạng thái học tập.

## Quản lý lớp học

* Quản lý danh sách lớp.
* Xếp lớp học sinh.
* Chuyển lớp.
* Lên lớp theo năm học.

## Quản lý môn học

* Quản lý danh sách môn học.
* Cập nhật hệ số môn học.
* Thiết lập quy định môn học.

## Quản lý điểm số

* Nhập điểm học sinh.
* Cập nhật điểm.
* Tính điểm trung bình môn.
* Tính điểm trung bình học kỳ.
* Tính điểm trung bình năm.

## Báo cáo và thống kê

* Báo cáo tổng kết môn.
* Báo cáo tổng kết học kỳ.
* Thống kê tỷ lệ đạt.
* Thống kê kết quả học tập theo lớp.

## Quản lý quy định

* Quy định độ tuổi học sinh.
* Quy định sĩ số lớp.
* Quy định điểm đạt.
* Quy định số lượng lớp.

---

# CHỨC NĂNG CHÍNH

## 1. Quản lý tài khoản

* Đăng nhập hệ thống.
* Phân quyền người dùng.
* Quản lý phiên đăng nhập.

## 2. Quản lý học sinh

* Thêm học sinh.
* Cập nhật thông tin học sinh.
* Xóa học sinh.
* Tra cứu học sinh.

## 3. Quản lý lớp học

* Tạo lớp học.
* Phân công học sinh vào lớp.
* Chuyển lớp.
* Xem danh sách lớp.

## 4. Quản lý môn học

* Thêm môn học.
* Cập nhật môn học.
* Xóa môn học.

## 5. Quản lý điểm

* Nhập điểm kiểm tra.
* Nhập điểm học kỳ.
* Cập nhật điểm.
* Tính điểm trung bình.

## 6. Thống kê báo cáo

* Báo cáo tổng kết môn.
* Báo cáo tổng kết học kỳ.
* Báo cáo học sinh đạt.
* Báo cáo học sinh chưa đạt.

---

# KIẾN TRÚC HỆ THỐNG

Hệ thống được xây dựng theo mô hình Client - Server.

```text
Frontend (HTML/CSS/JavaScript)
            │
            ▼
RESTful API (ExpressJS)
            │
            ▼
Microsoft SQL Server
```

---

# CÔNG NGHỆ SỬ DỤNG

## Backend

* Node.js
* Express.js
* Sequelize ORM
* JWT Authentication
* Joi Validation
* Helmet
* CORS
* MSSQL
* dotenv

## Database

* Microsoft SQL Server

## Frontend

* HTML5
* CSS3
* JavaScript (ES6)
* Bootstrap 5

## Công cụ phát triển

* Visual Studio Code
* SQL Server Management Studio (SSMS)
* Postman
* Git & GitHub

---

# CẤU TRÚC THƯ MỤC

```
├── 📁 backend
│   ├── 📁 libs
│   │   └── 📄 db.js
│   ├── 📁 middlewares
│   │   ├── 📄 auth.middleware.js
│   │   ├── 📄 role.validation.js
│   │   ├── 📄 student.validation.js
│   │   ├── 📄 studyProcess.validation.js
│   │   └── 📄 user.validation.js
│   ├── 📁 models
│   │   ├── 📁 professional_requirements
│   │   │   ├── 📄 Score.models.js
│   │   │   ├── 📄 ScoreDetail.models.js
│   │   │   ├── 📄 StudyProcess.models.js
│   │   │   └── 📄 TypeTestDetail.models.js
│   │   ├── 📄 Class.models.js
│   │   ├── 📄 Grade.models.js
│   │   ├── 📄 Semester.models.js
│   │   ├── 📄 Subject.models.js
│   │   ├── 📄 TypeTest.models.js
│   │   ├── 📄 User.models.js
│   │   ├── 📄 Year.models.js
│   │   └── 📄 student.Models.js
│   ├── 📁 routes
│   │   ├── 📄 academic.router.js
│   │   ├── 📄 auth.Route.js
│   │   ├── 📄 class.router.js
│   │   ├── 📄 dashboard.router.js
│   │   ├── 📄 parameter.router.js
│   │   ├── 📄 reportSemester.router.js
│   │   ├── 📄 reportSubjects.router.js
│   │   ├── 📄 score.router.js
│   │   ├── 📄 search.router.js
│   │   ├── 📄 student.Route.js
│   │   └── 📄 studyProcess.router.js
│   ├── 📁 src
│   │   ├── 📁 controllers
│   │   │   ├── 📄 academic.controller.js
│   │   │   ├── 📄 auth.controller.js
│   │   │   ├── 📄 class.controller.js
│   │   │   ├── 📄 dashboard.controller.js
│   │   │   ├── 📄 parameter.controller.js
│   │   │   ├── 📄 reportSemester.controller.js
│   │   │   ├── 📄 reportSubjects.controller.js
│   │   │   ├── 📄 score.controller.js
│   │   │   ├── 📄 search.controller.js
│   │   │   ├── 📄 student.Controller.js
│   │   │   └── 📄 studyProcess.controller.js
│   │   ├── 📄 finalizeYear.js
│   │   ├── 📄 role.js
│   │   └── 📄 server.js
│   ├── ⚙️ package-lock.json
│   └── ⚙️ package.json
├── 📁 frontend
│   ├── 📁 assets
│   │   ├── 📁 css
│   │   │   ├── 🎨 account.css
│   │   │   ├── 🎨 class-assignment.css
│   │   │   ├── 🎨 dashboard.css
│   │   │   ├── 🎨 examtype.css
│   │   │   ├── 🎨 layout.css
│   │   │   ├── 🎨 login.css
│   │   │   ├── 🎨 regulations.css
│   │   │   ├── 🎨 report-semester.css
│   │   │   ├── 🎨 report-subjects.css
│   │   │   ├── 🎨 reset.css
│   │   │   ├── 🎨 scores.css
│   │   │   ├── 🎨 search.css
│   │   │   ├── 🎨 settings.css
│   │   │   ├── 🎨 students.css
│   │   │   ├── 🎨 style.css
│   │   │   ├── 🎨 subjects.css
│   │   │   └── 🎨 toast.css
│   │   ├── 📁 images
│   │   │   ├── 🖼️ LOGO-new.png
│   │   │   ├── 🖼️ LOGO.png
│   │   │   ├── 🖼️ LOGO_1.png
│   │   │   └── 🖼️ background.jpg
│   │   └── 📁 js
│   │       ├── 📁 api
│   │       ├── 📁 config
│   │       │   └── 📄 role.js
│   │       ├── 📁 pages
│   │       │   ├── 📄 account.page.js
│   │       │   ├── 📄 class-assignment.page.js
│   │       │   ├── 📄 dashboard.page.js
│   │       │   ├── 📄 examtype.page.js
│   │       │   ├── 📄 login.page.js
│   │       │   ├── 📄 parameter.page.js
│   │       │   ├── 📄 report-semester.page.js
│   │       │   ├── 📄 report-subjects.page.js
│   │       │   ├── 📄 scores.page.js
│   │       │   ├── 📄 search.page.js
│   │       │   ├── 📄 settings.page.js
│   │       │   ├── 📄 student.page.js
│   │       │   └── 📄 subjects.page.js
│   │       ├── 📁 service
│   │       │   ├── 📄 auth.service.js
│   │       │   ├── 📄 examtype.service.js
│   │       │   ├── 📄 parameter.service.js
│   │       │   ├── 📄 settings.service.js
│   │       │   ├── 📄 student.service.js
│   │       │   ├── 📄 studyProcess.service.js
│   │       │   └── 📄 subject.service.js
│   │       ├── 📄 permission.js
│   │       ├── 📄 router.js
│   │       └── 📄 toast.js
│   ├── 📁 pages
│   │   ├── 🌐 account.html
│   │   ├── 🌐 class-assignment.html
│   │   ├── 🌐 dashboard.html
│   │   ├── 🌐 examtype.html
│   │   ├── 🌐 login.html
│   │   ├── 🌐 regulations.html
│   │   ├── 🌐 report-semester.html
│   │   ├── 🌐 report-subjects.html
│   │   ├── 🌐 scores.html
│   │   ├── 🌐 search.html
│   │   ├── 🌐 settings.html
│   │   ├── 🌐 students.html
│   │   └── 🌐 subjects.html
│   └── 🌐 index.html
├── ⚙️ .gitattributes
├── ⚙️ .gitignore
├── 📝 README.md
├── 📝 TASK.md
├── ⚙️ package-lock.json
└── ⚙️ package.json
```

---

# CÀI ĐẶT DỰ ÁN

## 1. Clone repository

```bash
git clone <repository-url>
cd QLHS
```

## 2. Cài đặt Backend

```bash
cd backend

npm install
```

Nếu gặp lỗi package:

```bash
npm install bcrypt
```

hoặc

```bash
npm install bcryptjs
```

## 3. Cấu hình môi trường

Tạo file:

```env
backend/.env
```

Ví dụ:

```env
PORT=3000

DB_SERVER=localhost
DB_NAME=QLHS
DB_USER=sa
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
```

## 4. Chạy Backend

```bash
npm run dev
```

hoặc

```bash
npm start
```

---

# API CHÍNH

## Authentication

```http
POST /api/auth/login
POST /api/auth/register
```

## Student

```http
GET    /api/students
GET    /api/students/:id
POST   /api/students
PUT    /api/students/:id
DELETE /api/students/:id
```

## Class

```http
GET    /api/classes
POST   /api/classes
PUT    /api/classes/:id
DELETE /api/classes/:id
```

## Subject

```http
GET    /api/subjects
POST   /api/subjects
PUT    /api/subjects/:id
DELETE /api/subjects/:id
```

## Score

```http
GET  /api/scores
POST /api/scores
PUT  /api/scores/:id
```

---

# TIẾN ĐỘ THỰC HIỆN

* [x] Phân tích yêu cầu
* [x] Thiết kế cơ sở dữ liệu
* [x] Thiết kế giao diện
* [x] Xây dựng Backend API
* [x] Xây dựng Frontend
* [x] Kiểm thử hệ thống
* [ ] Triển khai thực tế

---

# KẾT QUẢ ĐẠT ĐƯỢC

* Xây dựng thành công hệ thống quản lý học sinh theo đặc tả nghiệp vụ.
* Thực hiện đầy đủ các chức năng quản lý học sinh, lớp học và điểm số.
* Hỗ trợ thống kê và báo cáo học tập.
* Áp dụng kiến thức về phân tích thiết kế phần mềm, cơ sở dữ liệu và phát triển ứng dụng web.

---

# GIẢNG VIÊN HƯỚNG DẪN

**Đỗ Thị Thanh Tuyền**

Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM

---

<p align="center">
  <b>SE104.Q21 - Hệ thống Quản lý Học sinh</b>
  <br>
  University of Information Technology - VNUHCM
</p>
