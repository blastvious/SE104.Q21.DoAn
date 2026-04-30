🚀 BACKEND TASKS - HỆ THỐNG QUẢN LÝ HỌC SINH
📋 1. StudyProcess Controller (study-process.controller.js)
Mục tiêu: Kết nối Học sinh, Lớp và Học kỳ.

[ ] Task 3.1: API Xếp lớp (Enrollment)

Nhận MaHS, MaLop, MaHocKy.

Kiểm tra sĩ số lớp hiện tại so với quy định.

Kiểm tra ràng buộc: Học sinh không được học 2 lớp trong cùng 1 học kỳ.

[ ] Task 3.2: API Lấy danh sách lớp

Query từ bảng QUATRINHHOC lọc theo MaLop và MaHocKy.

Sử dụng include để lấy thông tin chi tiết từ bảng HOCSINH.

[ ] Task 3.3: API Chuyển lớp

Cập nhật MaLop mới cho bản ghi hiện tại trong QUATRINHHOC.

[ ] Task 3.4: API Tổng kết học kỳ

Tính toán điểm trung bình từ các môn và cập nhật vào cột DiemTBHocKy.

📚 2. Academic Controller (academic.controller.js)
Mục tiêu: Quản lý danh mục Môn học và các quy định về điểm.

[ ] Task 4.1: API Môn học

createSubject: Tạo môn học mới, tự động sinh mã MH001, MH002...

getAllSubjects: Lấy danh sách tất cả các môn đang giảng dạy.

[ ] Task 4.2: API Loại hình kiểm tra

getTestTypes: Lấy danh sách (Miệng, 15p, 1 tiết, Thi).

Quản lý hệ số điểm (HeSo) cho từng loại hình.

[ ] Task 4.3: API Quản lý quy định (Optional)

Lưu trữ điểm đạt, tuổi tối thiểu/tối đa của học sinh.

💯 3. Score Controller (score.controller.js)
Mục tiêu: Xử lý nghiệp vụ phức tạp nhất - Quản lý điểm số.

[ ] Task 5.1: API Nhập điểm (Single Entry)

Sử dụng findOrCreate để tự động khởi tạo bảng điểm nếu chưa có.

Lưu điểm vào CT_BANGDIEMMON_LHKT.

[ ] Task 5.2: API Nhập điểm hàng loạt (Bulk Entry)

Hỗ trợ giáo viên nhập điểm cho cả lớp cùng lúc từ giao diện bảng.

[ ] Task 5.3: API Truy xuất bảng điểm môn

Lấy toàn bộ điểm lẻ của một lớp theo Môn + Học kỳ.

Cấu trúc JSON trả về phải phân cấp: Học sinh -> Loại điểm -> Danh sách điểm.

[ ] Task 5.4: Logic tính Điểm trung bình môn

Viết hàm helper tính ĐTB môn dựa trên trọng số (hệ số) của các đầu điểm.

Cập nhật vào bảng CT_BANGDIEMMON_HS.