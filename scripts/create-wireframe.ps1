Add-Type -AssemblyName System.Drawing
$width = 1800
$height = 1100
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::White)
$fontTitle = New-Object System.Drawing.Font('Arial', 22, [System.Drawing.FontStyle]::Bold)
$font = New-Object System.Drawing.Font('Arial', 14)
$fontBold = New-Object System.Drawing.Font('Arial', 14, [System.Drawing.FontStyle]::Bold)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(35, 53, 72), 2)
$headerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, 53, 72))
$lightBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 242, 247))
$accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(222, 126, 38))
$blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 30, 30))

function Draw-Screen($x, $title, $body) {
  $graphics.DrawRectangle($pen, $x, 80, 520, 900)
  $graphics.FillRectangle($headerBrush, $x, 80, 520, 65)
  $graphics.DrawString($title, $fontTitle, [System.Drawing.Brushes]::White, $x + 18, 96)
  $y = 175
  foreach ($line in $body) {
    if ($line -eq '---') {
      $graphics.DrawLine($pen, $x + 18, $y, $x + 502, $y)
      $y += 25
    } elseif ($line.StartsWith('[button]')) {
      $graphics.FillRectangle($accentBrush, $x + 18, $y, 190, 42)
      $graphics.DrawString($line.Substring(8), $fontBold, [System.Drawing.Brushes]::White, $x + 35, $y + 10)
      $y += 62
    } elseif ($line.StartsWith('[label]')) {
      $graphics.DrawString($line.Substring(7), $fontBold, $blackBrush, $x + 18, $y)
      $y += 34
    } else {
      $graphics.FillRectangle($lightBrush, $x + 18, $y, 484, 38)
      $graphics.DrawString($line, $font, $blackBrush, $x + 28, $y + 7)
      $y += 52
    }
  }
}

$graphics.DrawString('WIREFRAME - LUONG L2 TIEP NHAN VA PHAN LOAI BAO HANH', $fontTitle, $blackBrush, 35, 25)
Draw-Screen 35 '1. DANH SACH PHIEU' @('[label]Bo loc', 'Trang thai: Tat ca', 'Han cam ket truoc: 01/10/2026', '---', 'BH-0001 | Nguyen A | SAC | CAO | MOI', 'BH-0002 | Tran B | PIN | TB | DANG_XU_LY', 'BH-0003 | Le C | MAN_HINH | CAO | QUA HAN', '---', '[button]TAO PHIEU MOI')
Draw-Screen 640 '2. TAO PHIEU' @('[label]Thong tin khach hang', 'So dien thoai: 0901234567', 'Ho ten: Nguyen Van Binh', '[label]Thiet bi va loi', 'Serial/IMEI: SN541017338391', 'Ngay mua: 20/02/2026', 'Mo ta loi: May khong sac duoc', 'Nhom su co: SAC', 'Muc uu tien: TRUNG_BINH', 'Han cam ket: Tu dong sinh', '[button]LUU PHIEU')
Draw-Screen 1245 '3. CHI TIET PHIEU' @('[label]BH-000123/2026', 'Khach hang: Nguyen Van Binh', 'So dien thoai: 090****567', 'Thiet bi: SN541017338391', 'Trang thai: MOI', 'Han cam ket: 01/10/2026', '---', '[label]Lich su trang thai', 'MOI - 28/09 10:00 - NV01', 'DA_PHAN_CONG - 28/09 11:30 - QL02', '---', 'Chuyen trang thai: DA_PHAN_CONG', '[button]LUU THAY DOI')
$bitmap.Save((Join-Path (Get-Location) 'docs\wireframe.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
Write-Output 'Created docs/wireframe.png'
