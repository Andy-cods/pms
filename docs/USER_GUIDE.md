# Hướng Dẫn Sử Dụng BC Agency PMS

## Mục lục

1. [Đăng nhập](#đăng-nhập)
2. [Dashboard - Tổng quan](#dashboard---tổng-quan)
3. [Quản lý Dự án](#quản-lý-dự-án)
4. [Quản lý Task](#quản-lý-task)
5. [Quy trình Phê duyệt](#quy-trình-phê-duyệt)
6. [Lịch và Sự kiện](#lịch-và-sự-kiện)
7. [Báo cáo](#báo-cáo)
8. [Quản lý File](#quản-lý-file)
9. [Trang quản trị (Admin)](#trang-quản-trị-admin)

---

## Đăng nhập

### Đăng nhập cho Nhân viên Nội bộ

1. Truy cập trang đăng nhập: `https://pms.bcagency.com/login`
2. Nhập **Email** và **Mật khẩu** của bạn
3. Nhấn **Đăng nhập**

**Phân quyền người dùng:**
- **SUPER_ADMIN**: Toàn quyền quản trị hệ thống
- **ADMIN**: Quản trị hệ thống cấp cao
- **PM** (Project Manager): Quản lý dự án
- **PLANNER**: Lập kế hoạch dự án
- **ACCOUNT**: Quản lý khách hàng
- **DESIGNER**: Thiết kế
- **DEVELOPER**: Lập trình viên
- **NVKD** (Nhân viên kinh doanh): Phê duyệt dự án

### Đăng nhập cho Khách hàng

1. Truy cập trang đăng nhập khách hàng: `https://pms.bcagency.com/client-login`
2. Nhập **Email** và **Mật khẩu** được cấp
3. Nhấn **Đăng nhập**

**Lưu ý:** Khách hàng chỉ xem được các dự án mà họ sở hữu.

---

## Dashboard - Tổng quan

Sau khi đăng nhập, bạn sẽ thấy Dashboard hiển thị:

### Thống kê tổng quan
- **Số dự án đang hoạt động** (Active projects)
- **Số task đang làm** (Tasks in progress)
- **Task sắp đến hạn** (Upcoming deadlines)
- **Phê duyệt đang chờ** (Pending approvals)

### Biểu đồ và báo cáo
- **Task theo trạng thái**: Pie chart hiển thị tỷ lệ TODO / In Progress / Done
- **Dự án theo giai đoạn**: Bar chart hiển thị số dự án ở từng giai đoạn
- **Tiến độ dự án**: Timeline chart

### Danh sách nhanh
- **Task của tôi**: Task được giao cho bạn
- **Sự kiện sắp tới**: Meeting, deadline trong 7 ngày tới
- **Thông báo mới**: Cập nhật về dự án, task

---

## Quản lý Dự án

### Xem danh sách dự án

1. Vào menu **Projects** (Dự án)
2. Bộ lọc hiển thị:
   - **Trạng thái**: ACTIVE, ON_HOLD, COMPLETED, CANCELLED
   - **Giai đoạn**: PLANNING, UNDER_REVIEW, PROPOSAL_PITCH, ONGOING, FINAL_REVIEW, COMPLETED
   - **Khách hàng**: Lọc theo client
   - **Tìm kiếm**: Tìm theo tên, mã dự án

### Tạo dự án mới (PM/Admin)

1. Nhấn nút **+ Tạo dự án mới**
2. Điền thông tin:
   - **Mã dự án** (tự động sinh nếu bỏ trống): VD: `PRJ0001`
   - **Tên dự án**: VD: "Website Công ty ABC"
   - **Mô tả**: Chi tiết về dự án
   - **Loại sản phẩm**: Website, App, Branding, Marketing, etc.
   - **Khách hàng**: Chọn từ danh sách
   - **Ngày bắt đầu/kết thúc**
   - **Link Drive**: Link thư mục Google Drive
   - **Link kế hoạch**: Link file kế hoạch
   - **Link tracking**: Link công cụ theo dõi
3. Nhấn **Tạo dự án**

### Chi tiết dự án

Nhấn vào tên dự án để xem chi tiết:

**Thông tin chung:**
- Mã dự án, tên, mô tả
- Trạng thái, giai đoạn, tiến độ
- Khách hàng
- Các link liên quan (Drive, Plan, Tracking)

**Tab Task:**
- Kanban board hiển thị task theo trạng thái
- Drag & drop để thay đổi trạng thái task

**Tab Team:**
- Danh sách thành viên dự án
- Vai trò của từng người (PM, Designer, Developer, etc.)
- Thêm/xóa thành viên (chỉ PM/Admin)

**Tab Files:**
- Danh sách file đính kèm
- Upload file mới
- Download file

**Tab Timeline:**
- Gantt chart hiển thị timeline dự án
- Các milestone quan trọng

### Cập nhật dự án (PM/Admin)

1. Vào chi tiết dự án
2. Nhấn **Chỉnh sửa**
3. Cập nhật thông tin cần thiết
4. Nhấn **Lưu**

### Giai đoạn dự án

1. **PLANNING**: Lập kế hoạch ban đầu
2. **UNDER_REVIEW**: Đang chờ phê duyệt từ NVKD
3. **PROPOSAL_PITCH**: Trình bày proposal cho khách hàng
4. **ONGOING**: Đang triển khai
5. **FINAL_REVIEW**: Kiểm tra cuối cùng
6. **COMPLETED**: Hoàn thành

---

## Quản lý Task

### Xem danh sách Task

1. Vào menu **Tasks** (Công việc)
2. Bộ lọc:
   - **Dự án**: Lọc theo dự án cụ thể
   - **Trạng thái**: TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED, CANCELLED
   - **Độ ưu tiên**: LOW, MEDIUM, HIGH, URGENT
   - **Người được giao**: Lọc theo assignee
   - **Tìm kiếm**: Tìm theo tiêu đề

### Kanban Board

1. Vào chi tiết dự án → Tab **Task**
2. Xem task theo các cột:
   - **To Do**: Task chưa bắt đầu
   - **In Progress**: Task đang làm
   - **Review**: Task đang review
   - **Done**: Task hoàn thành
   - **Blocked**: Task bị chặn

**Thao tác drag & drop:**
- Kéo task sang cột khác để thay đổi trạng thái
- Hệ thống tự động cập nhật thời gian bắt đầu/hoàn thành

### Tạo Task mới

1. Vào dự án → Tab **Task** → Nhấn **+ Tạo task**
2. Điền thông tin:
   - **Tiêu đề**: Tên công việc
   - **Mô tả**: Chi tiết công việc
   - **Độ ưu tiên**: LOW, MEDIUM, HIGH, URGENT
   - **Người được giao**: Chọn nhiều người
   - **Reviewer**: Người review task
   - **Thời gian ước tính** (giờ)
   - **Deadline**: Hạn hoàn thành
3. Nhấn **Tạo**

### Chi tiết Task

Nhấn vào task để xem chi tiết:

**Thông tin:**
- Tiêu đề, mô tả
- Trạng thái, độ ưu tiên
- Người được giao, reviewer
- Thời gian: ước tính / thực tế
- Deadline

**Subtasks:**
- Tạo subtask con
- Track tiến độ subtask

**Comments:**
- Thảo luận về task
- Tag người khác với `@tên`

**File đính kèm:**
- Upload file liên quan
- Download file

**Lịch sử:**
- Xem các thay đổi của task

### Cập nhật Task

**Thay đổi trạng thái:**
- Drag & drop trên Kanban board, hoặc
- Vào chi tiết task → Chọn trạng thái mới

**Cập nhật thông tin:**
1. Vào chi tiết task
2. Nhấn **Chỉnh sửa**
3. Cập nhật thông tin
4. Nhấn **Lưu**

**Cập nhật thời gian thực tế:**
1. Vào chi tiết task
2. Nhập **Actual Hours** (giờ thực tế)
3. Nhấn **Lưu**

### Task của tôi

1. Vào menu **My Tasks** (Task của tôi)
2. Xem tất cả task được giao cho bạn
3. Sắp xếp theo deadline hoặc độ ưu tiên

---

## Quy trình Phê duyệt

### Gửi duyệt (PM/Planner)

1. Vào menu **Approvals** (Phê duyệt)
2. Nhấn **+ Gửi phê duyệt**
3. Chọn:
   - **Dự án**: Chọn dự án cần duyệt
   - **Loại phê duyệt**:
     - `PLAN`: Phê duyệt kế hoạch
     - `DESIGN`: Phê duyệt thiết kế
     - `PROPOSAL`: Phê duyệt proposal
     - `OTHER`: Khác
   - **Tiêu đề**: VD: "Phê duyệt kế hoạch Q1"
   - **Mô tả**: Chi tiết nội dung cần duyệt
   - **Deadline**: Hạn phê duyệt
   - **File đính kèm**: Upload file cần duyệt
4. Nhấn **Gửi**

**Lưu ý:** Sau khi gửi, trạng thái dự án sẽ chuyển sang **UNDER_REVIEW**.

### Xem phê duyệt đang chờ (NVKD)

1. Vào menu **Approvals** → Tab **Pending**
2. Xem danh sách phê duyệt đang chờ
3. Nhấn vào item để xem chi tiết

### Phê duyệt (NVKD/Admin)

1. Vào chi tiết phê duyệt
2. Xem nội dung, file đính kèm
3. Chọn một trong các hành động:

**Phê duyệt (Approve):**
- Nhấn **Approve**
- Nhập comment (nếu có)
- Nhấn **Xác nhận**
- Dự án sẽ chuyển sang giai đoạn tiếp theo

**Yêu cầu sửa (Request Changes):**
- Nhấn **Request Changes**
- Nhập comment yêu cầu sửa đổi
- Nhấn **Xác nhận**
- PM/Planner sẽ nhận được thông báo và cập nhật lại

**Từ chối (Reject):**
- Nhấn **Reject**
- Nhập lý do từ chối
- Nhấn **Xác nhận**
- Dự án sẽ quay về giai đoạn **PLANNING**

### Cập nhật sau khi yêu cầu sửa

1. PM/Planner vào chi tiết phê duyệt
2. Nhấn **Edit**
3. Cập nhật nội dung, file
4. Nhấn **Resubmit** (Gửi lại)
5. Trạng thái chuyển về **PENDING**

### Lịch sử phê duyệt

Mỗi phê duyệt có section **History** hiển thị:
- Thời gian gửi, người gửi
- Các lần approve/reject/request changes
- Comment của người duyệt
- Người thực hiện hành động

---

## Lịch và Sự kiện

### Xem Lịch

1. Vào menu **Calendar** (Lịch)
2. Chọn chế độ xem:
   - **Tháng** (Month): Xem tổng quan cả tháng
   - **Tuần** (Week): Xem chi tiết từng tuần
   - **Ngày** (Day): Xem chi tiết từng ngày

### Tạo Sự kiện mới

1. Nhấn **+ Tạo sự kiện** hoặc nhấn vào ngày trên lịch
2. Điền thông tin:
   - **Tiêu đề**: Tên sự kiện
   - **Mô tả**: Chi tiết sự kiện
   - **Loại sự kiện**:
     - `MEETING`: Họp
     - `DEADLINE`: Hạn deadline
     - `MILESTONE`: Cột mốc dự án
     - `OTHER`: Khác
   - **Thời gian bắt đầu/kết thúc**
   - **All day**: Tick nếu sự kiện cả ngày
   - **Địa điểm**: Nơi diễn ra
   - **Link meeting**: Link Zoom/Google Meet
   - **Dự án**: Liên kết với dự án (nếu có)
   - **Người tham gia**: Chọn người tham gia
   - **Lặp lại** (optional): Tạo sự kiện định kỳ
     - Hàng ngày, tuần, tháng
     - Cấu hình bằng RRule format
   - **Nhắc nhở trước** (phút): VD: 15, 30, 60
3. Nhấn **Tạo**

### Sự kiện định kỳ

**Ví dụ:**
- Họp stand-up hàng ngày: `FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR`
- Họp tuần: `FREQ=WEEKLY;BYDAY=MO`
- Báo cáo tháng: `FREQ=MONTHLY;BYMONTHDAY=1`

### Deadline từ Task

Task có deadline sẽ tự động hiển thị trên lịch với icon deadline.

### Phản hồi sự kiện

Khi được mời tham gia sự kiện:
1. Vào chi tiết sự kiện
2. Chọn:
   - **Accepted**: Chấp nhận tham gia
   - **Declined**: Từ chối
3. Trạng thái của bạn sẽ hiển thị cho người tạo sự kiện

---

## Báo cáo

### Tạo Báo cáo

1. Vào menu **Reports** (Báo cáo)
2. Nhấn **+ Tạo báo cáo**
3. Chọn:
   - **Loại báo cáo**:
     - `WEEKLY`: Báo cáo tuần
     - `MONTHLY`: Báo cáo tháng
     - `CUSTOM`: Báo cáo tùy chỉnh (chọn khoảng thời gian)
   - **Dự án** (optional): Lọc theo dự án cụ thể
   - **Định dạng**:
     - `PDF`: File PDF
     - `EXCEL`: File Excel (.xlsx)
4. Nhấn **Tạo và Download**

**Lưu ý:** Báo cáo tùy chỉnh có thể chọn khoảng thời gian tối đa 1 năm.

### Nội dung Báo cáo

Báo cáo bao gồm:
- **Tổng quan dự án**: Số dự án, trạng thái
- **Tiến độ task**: Tỷ lệ hoàn thành
- **Thời gian làm việc**: So sánh estimated vs actual hours
- **Team performance**: Số task hoàn thành theo người
- **Deadline**: Số task đúng/trễ hạn

---

## Quản lý File

### Upload File

1. Vào dự án hoặc task
2. Tab **Files** → Nhấn **Upload**
3. Chọn file (tối đa 50MB)
4. Điền thông tin:
   - **Danh mục**:
     - `DOCUMENT`: Tài liệu
     - `IMAGE`: Hình ảnh
     - `VIDEO`: Video
     - `DESIGN`: File thiết kế
     - `CODE`: Source code
     - `OTHER`: Khác
   - **Tags**: Gắn thẻ để dễ tìm kiếm
5. Nhấn **Upload**

### Tìm kiếm File

1. Vào menu **Files** (Quản lý file)
2. Bộ lọc:
   - Dự án
   - Task
   - Danh mục
   - Tìm kiếm theo tên, tag

### Download File

1. Vào danh sách file
2. Nhấn vào tên file → **Download**
3. Hoặc nhấn **Preview** để xem trước (nếu hỗ trợ)

### Quản lý File

**Cập nhật thông tin:**
- Đổi tên file
- Thay đổi category, tags

**Xóa file:**
- Chỉ người upload hoặc Admin mới xóa được
- File sẽ bị xóa vĩnh viễn khỏi hệ thống

---

## Trang quản trị (Admin)

Chỉ dành cho **SUPER_ADMIN** và **ADMIN**.

### Quản lý Người dùng

**Xem danh sách người dùng:**
1. Vào **Admin Panel** → **Users**
2. Bộ lọc theo vai trò, trạng thái

**Tạo người dùng mới:**
1. Nhấn **+ Tạo người dùng**
2. Điền thông tin:
   - Email, tên
   - Mật khẩu
   - Vai trò (Role)
3. Nhấn **Tạo**
4. Gửi thông tin đăng nhập cho người dùng

**Cập nhật người dùng:**
- Đổi tên, vai trò
- Vô hiệu hóa (Deactivate) người dùng

**Reset mật khẩu:**
1. Chọn người dùng
2. Nhấn **Reset Password**
3. Hệ thống tạo mật khẩu tạm thời
4. Gửi mật khẩu cho người dùng

### Quản lý Khách hàng

**Xem danh sách khách hàng:**
1. Vào **Admin Panel** → **Clients**

**Tạo khách hàng mới:**
1. Nhấn **+ Tạo khách hàng**
2. Điền thông tin:
   - Email, tên công ty
   - Mật khẩu
   - Người liên hệ
   - Thông tin công ty
3. Nhấn **Tạo**

**Cập nhật khách hàng:**
- Đổi thông tin công ty
- Vô hiệu hóa tài khoản

### Cài đặt Hệ thống

**Cấu hình thông báo:**
- Telegram bot token
- Email settings

**Backup/Restore:**
- Tạo backup database
- Restore từ file backup

### Audit Logs (Nhật ký Hệ thống)

1. Vào **Admin Panel** → **Audit Logs**
2. Xem lịch sử:
   - Người dùng đăng nhập/đăng xuất
   - Tạo/cập nhật/xóa dữ liệu
   - Thời gian thực hiện
   - IP address
3. Bộ lọc theo:
   - Người dùng
   - Hành động
   - Khoảng thời gian

---

## Hỗ trợ

Nếu bạn gặp vấn đề hoặc cần hỗ trợ:
- Liên hệ Admin qua email: admin@bcagency.com
- Hoặc liên hệ qua Telegram

---

**Phiên bản:** 1.0.0
**Cập nhật lần cuối:** 2026-01-23
