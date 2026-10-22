import { docPhien, xoaPhien } from '../auth';

/**
 * Lớp gọi API duy nhất của giao diện.
 *
 * Vì sao không gọi `fetch` rải trong component: mọi request phải gửi cùng
 * header vai trò, cùng cách xử lý lỗi và cùng cách phát hiện mất phiên. Nếu mỗi
 * màn hình tự gọi, chỉ cần một chỗ quên header là QT-14/QT-15 bị lách, hoặc
 * một chỗ quên bắt lỗi là màn hình trắng.
 */

const TIEN_TO = '/api/v1';

/**
 * Lỗi API đã chuẩn hóa để giao diện hiển thị.
 *
 * Thuộc tính `code` là mã máy đọc (ví dụ `PHIEU_DANG_MO`), `message` là câu
 * người đọc. Giao diện rẽ nhánh theo `code`, không theo câu chữ — đúng quy ước
 * định dạng lỗi của Buổi 9.
 */
export class LoiApi extends Error {
  /**
   * @param {string} message Câu thông báo cho người dùng.
   * @param {object} [tuyChon]
   * @param {string} [tuyChon.code='LOI_KHONG_XAC_DINH'] Mã lỗi máy đọc.
   * @param {number} [tuyChon.status=0] Mã HTTP; 0 nghĩa là không kết nối được.
   * @param {Array|object|null} [tuyChon.fields=null] Lỗi theo từng trường.
   */
  constructor(message, { code = 'LOI_KHONG_XAC_DINH', status = 0, fields = null } = {}) {
    super(message);
    this.name = 'LoiApi';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

/**
 * Gọi một endpoint dưới `/api/v1` và trả body JSON.
 *
 * @param {string} duongDan Đường dẫn bắt đầu bằng `/`, ví dụ `/tickets`.
 * @param {object} [tuyChon]
 * @param {'GET'|'POST'|'PUT'|'DELETE'} [tuyChon.method='GET']
 * @param {object} [tuyChon.body] Body sẽ được JSON.stringify.
 * @param {AbortSignal} [tuyChon.signal] Tín hiệu hủy khi component unmount.
 * @returns {Promise<any>} Body JSON đã parse.
 * @throws {LoiApi} Khi mất mạng, hết thời gian chờ, hoặc HTTP >= 400.
 * @throws {DOMException} `AbortError` khi bên gọi chủ động hủy — component phải
 *   bỏ qua lỗi này, không hiển thị thành lỗi hệ thống.
 */
export async function goiApi(duongDan, { method = 'GET', body, signal } = {}) {
  const phien = docPhien();
  const headers = { 'Content-Type': 'application/json' };

  // QT-14/QT-15: vai trò đi qua header cho tới khi có JWT thật.
  if (phien?.vaiTro) headers['X-User-Role'] = phien.vaiTro;
  if (phien?.centerId) headers['X-Center-Id'] = String(phien.centerId);

  // Hết thời gian chờ 12 giây: nếu server treo, người dùng thấy trạng thái lỗi
  // có nút thử lại thay vì màn hình quay vô hạn.
  const tinHieu = signal || (typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(12000)
    : undefined);

  let phanHoi;
  try {
    phanHoi = await fetch(`${TIEN_TO}${duongDan}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: tinHieu,
    });
  } catch (loi) {
    if (loi?.name === 'AbortError') throw loi;
    throw new LoiApi('Không kết nối được tới hệ thống.', { code: 'MAT_KET_NOI' });
  }

  const duLieu = await phanHoi.json().catch(() => null);

  if (!phanHoi.ok) {
    // 401: phiên hết hạn — xóa phiên và phát sự kiện để App quay về màn hình
    // đăng nhập. Backend hiện chưa trả 401, nhưng chừa sẵn đường khi có JWT.
    if (phanHoi.status === 401) {
      xoaPhien();
      window.dispatchEvent(new Event('cdtn1:het-phien'));
    }
    throw new LoiApi(
      duLieu?.error?.message || `Máy chủ trả lỗi ${phanHoi.status}.`,
      {
        code: duLieu?.error?.code || `HTTP_${phanHoi.status}`,
        status: phanHoi.status,
        fields: duLieu?.error?.fields || null,
      },
    );
  }

  return duLieu;
}
