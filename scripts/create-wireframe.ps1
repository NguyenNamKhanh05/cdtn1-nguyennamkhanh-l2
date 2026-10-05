Add-Type -AssemblyName System.Drawing
$width = 1800
$height = 1300
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::White)
$fontTitle = New-Object System.Drawing.Font('Arial', 20, [System.Drawing.FontStyle]::Bold)
$font = New-Object System.Drawing.Font('Arial', 12)
$fontBold = New-Object System.Drawing.Font('Arial', 12, [System.Drawing.FontStyle]::Bold)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(35, 53, 72), 2)
$headerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, 53, 72))
$lightBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 242, 247))
$accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(222, 126, 38))
$errorBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 230, 230))
$errorTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::DarkRed)
$blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 30, 30))

function Draw-Screen($x, $title, $body) {
  $graphics.DrawRectangle($pen, $x, 80, 520, 1080)
  $graphics.FillRectangle($headerBrush, $x, 80, 520, 65)
  $graphics.DrawString($title, $fontTitle, [System.Drawing.Brushes]::White, $x + 18, 96)
  $y = 175
  foreach ($line in $body) {
    if ($line -eq '---') {
      $graphics.DrawLine($pen, $x + 18, $y, $x + 502, $y)
      $y += 20
    } elseif ($line.StartsWith('[button]')) {
      $graphics.FillRectangle($accentBrush, $x + 18, $y, 190, 42)
      $graphics.DrawString($line.Substring(8), $fontBold, [System.Drawing.Brushes]::White, $x + 35, $y + 10)
      $y += 50
    } elseif ($line.StartsWith('[label]')) {
      $graphics.DrawString($line.Substring(7), $fontBold, $blackBrush, $x + 18, $y)
      $y += 28
    } elseif ($line.StartsWith('[error]')) {
      $graphics.FillRectangle($errorBrush, $x + 18, $y, 484, 42)
      $graphics.DrawString($line.Substring(7), $font, $errorTextBrush, $x + 28, $y + 10)
      $y += 48
    } else {
      $graphics.FillRectangle($lightBrush, $x + 18, $y, 484, 38)
      $graphics.DrawString($line, $font, $blackBrush, $x + 28, $y + 7)
      $y += 42
    }
  }
}

$graphics.DrawString('WIREFRAME - LUỒNG L2 TIẾP NHẬN VÀ PHÂN LOẠI BẢO HÀNH', $fontTitle, $blackBrush, 35, 25)
Draw-Screen 35 '1. DANH SÁCH PHIẾU' @('[label]Bộ lọc', 'Trạng thái: Tất cả', 'Hạn cam kết trước: 01/10/2026 [Lọc]', '---', 'Mã phiếu | Khách hàng | Nhóm sự cố | Ưu tiên | Trạng thái | SLA', 'BH-0001 | Nguyễn A | SAC | CAO | MOI | 2h', 'BH-0002 | Trần B | PIN | TRUNG_BINH | DANG_XU_LY | 1d', '---', '[button]TẠO PHIẾU MỚI', 'Trang 1 / 20')
Draw-Screen 640 '2. TẠO PHIẾU' @('[label]Thông tin khách hàng', 'Số điện thoại: 0901234567 [Tra cứu]', 'Họ tên: Nguyễn Văn Bình', 'Địa chỉ: Cần Thơ', '[label]Thiết bị và lỗi', 'Serial/IMEI: SN541017338391', 'Ngày mua: 20/02/2026', 'Trung tâm: Cần Thơ', 'Loại yêu cầu: BAO_HANH', 'Mô tả lỗi: Máy không sạc được', 'Nhóm sự cố: SAC', 'Mức ưu tiên: TRUNG_BINH', 'Hạn cam kết: Tự động sinh', '[error]Số điện thoại sai / thiết bị hết hạn', '[button]HỦY', '[button]LƯU PHIẾU')
Draw-Screen 1245 '3. CHI TIẾT PHIẾU' @('[label]BH-000123/2026', 'Khách hàng: Nguyễn Văn Bình', 'Số điện thoại: 090****567', 'Thiết bị: SN541017338391', 'Trung tâm: Cần Thơ', 'Loại yêu cầu: BAO_HANH', 'Nhóm sự cố: SAC', 'Mức ưu tiên: TRUNG_BINH', 'Hạn cam kết: 01/10/2026', 'Trạng thái: MOI', '---', '[label]Mô tả lỗi', 'Máy không sạc được', '---', '[label]Lịch sử trạng thái', 'Thời điểm | Từ -> Đến | Người', '28/09 10:00 | (trống) -> MOI | NV01', '28/09 11:30 | MOI -> DA_PHAN_CONG | QL02', '---', 'Chuyển trạng thái: DA_PHAN_CONG', 'Ghi chú: Cập nhật xử lý', '[error]Không thể chuyển trạng thái QT-06', '[button]LƯU THAY ĐỔI')
$bitmap.Save((Join-Path (Get-Location) 'docs\wireframe.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
Write-Output 'Created docs/wireframe.png'
