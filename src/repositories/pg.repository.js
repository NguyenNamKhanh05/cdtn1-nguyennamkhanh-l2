/**
 * Repository PostgreSQL của luồng L2.
 *
 * Trách nhiệm: chỉ đọc/ghi dữ liệu. Mọi quy tắc nghiệp vụ (QT-xx) nằm ở lớp
 * Service — nếu đặt vào đây thì khi đổi sang CSDL khác sẽ phải viết lại quy tắc.
 *
 * Các thao tác ghi nhiều bảng (tạo phiếu + ghi log, chuyển trạng thái + ghi log)
 * đều nằm trong một transaction để bảo đảm NFR3: không bao giờ có phiếu mà
 * thiếu lịch sử.
 */
class PhieuRepository {
  /**
   * @param {import('pg').Pool} pool Pool kết nối PostgreSQL dùng chung.
   */
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Đóng pool khi tắt server, tránh treo tiến trình Node.
   * @returns {Promise<void>}
   */
  async dong() {
    await this.pool.end();
  }

  // ============================================================== KHÁCH HÀNG
  // Mọi truy vấn đều lọc is_active = true để tôn trọng QT-13 (xóa mềm):
  // hồ sơ đã ngừng sử dụng không được xuất hiện như khách còn giao dịch.

  /**
   * Tìm khách hàng đang hoạt động theo mã.
   *
   * @param {number} customerId Mã khách hàng.
   * @returns {Promise<object|null>} Bản ghi hoặc null nếu không có.
   */
  async timKhachHangTheoId(customerId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM customer WHERE customer_id = $1 AND is_active = true',
      [customerId],
    );
    return rows[0] || null;
  }

  /**
   * Tìm khách hàng theo số điện thoại — phục vụ QT-01.
   *
   * @param {string} phone Số đã chuẩn hóa 10 chữ số.
   * @returns {Promise<object|null>} Bản ghi hoặc null.
   */
  async timKhachHangTheoSoDienThoai(phone) {
    // Dùng index idx_customer_phone (xem migrations/001_create_core.sql).
    const { rows } = await this.pool.query(
      'SELECT * FROM customer WHERE phone = $1 AND is_active = true',
      [phone],
    );
    return rows[0] || null;
  }

  /**
   * Liệt kê khách hàng đang hoạt động.
   *
   * CẢNH BÁO: không phân trang vì endpoint này chỉ dùng cho demo/danh mục nhỏ.
   * Với 65.000 khách (NFR1) phải thêm LIMIT/OFFSET trước khi dùng ở giao diện.
   *
   * @returns {Promise<object[]>}
   */
  async lietKeKhachHang() {
    const { rows } = await this.pool.query(
      'SELECT * FROM customer WHERE is_active = true ORDER BY customer_id',
    );
    return rows;
  }

  /**
   * Thêm khách hàng mới.
   *
   * @param {{full_name: string, phone: string, email?: string|null, address?: string|null}} duLieu
   * @returns {Promise<object>} Bản ghi vừa tạo (nhờ RETURNING *).
   */
  async taoKhachHang(duLieu) {
    const { rows } = await this.pool.query(
      `INSERT INTO customer (full_name, phone, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [duLieu.full_name, duLieu.phone, duLieu.email || null, duLieu.address || null],
    );
    return rows[0];
  }

  /**
   * Cập nhật hồ sơ khách hàng theo kiểu "chỉ đổi trường được gửi".
   *
   * Dùng COALESCE để trường không gửi (null) giữ nguyên giá trị cũ, nhờ vậy
   * client không phải gửi lại toàn bộ hồ sơ.
   *
   * @param {number} customerId Mã khách hàng.
   * @param {object} duLieu Các trường có thể đổi.
   * @returns {Promise<object|null>} Bản ghi sau cập nhật, null nếu không tồn tại.
   */
  async capNhatKhachHang(customerId, duLieu) {
    const { rows } = await this.pool.query(
      `UPDATE customer
          SET full_name = COALESCE($2, full_name),
              phone     = COALESCE($3, phone),
              email     = COALESCE($4, email),
              address   = COALESCE($5, address)
        WHERE customer_id = $1 AND is_active = true
        RETURNING *`,
      [
        customerId,
        duLieu.full_name ?? null,
        duLieu.phone ?? null,
        duLieu.email ?? null,
        duLieu.address ?? null,
      ],
    );
    return rows[0] || null;
  }

  /**
   * Ngừng sử dụng hồ sơ khách hàng — QT-13 (xóa mềm).
   *
   * @param {number} customerId Mã khách hàng.
   * @returns {Promise<boolean>} true nếu có bản ghi được cập nhật.
   */
  async xoaKhachHang(customerId) {
    const { rowCount } = await this.pool.query(
      'UPDATE customer SET is_active = false WHERE customer_id = $1 AND is_active = true',
      [customerId],
    );
    return rowCount > 0;
  }

  // ================================================================= THIẾT BỊ
  // QT-03: thiết bị xác định duy nhất bằng serial/IMEI (ràng buộc UNIQUE ở DDL).

  /**
   * Tìm thiết bị theo mã nội bộ.
   *
   * @param {number} deviceId Mã thiết bị.
   * @returns {Promise<object|null>}
   */
  async timThietBiTheoId(deviceId) {
    const { rows } = await this.pool.query('SELECT * FROM device WHERE device_id = $1', [deviceId]);
    return rows[0] || null;
  }

  /**
   * Tìm thiết bị theo serial/IMEI — QT-03.
   *
   * @param {string} serialNo Serial hoặc IMEI.
   * @returns {Promise<object|null>}
   */
  async timThietBiTheoSerial(serialNo) {
    const { rows } = await this.pool.query('SELECT * FROM device WHERE serial_no = $1', [serialNo]);
    return rows[0] || null;
  }

  /**
   * Ghi nhận thiết bị mới cho khách hàng (UC3).
   *
   * @param {{customer_id: number, serial_no: string, purchase_date?: string|null, warranty_months?: number}} duLieu
   * @returns {Promise<object>} Bản ghi vừa tạo.
   */
  async taoThietBi(duLieu) {
    const { rows } = await this.pool.query(
      `INSERT INTO device (customer_id, serial_no, purchase_date, warranty_months)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        duLieu.customer_id,
        duLieu.serial_no,
        duLieu.purchase_date || null,
        // Mặc định 12 tháng theo DDL khi client không gửi.
        duLieu.warranty_months || 12,
      ],
    );
    return rows[0];
  }

  // =================================================================== DANH MỤC
  // NFR4: nhóm sự cố và loại yêu cầu là dữ liệu cấu hình, không hard-code
  // trong mã xử lý; thêm giá trị mới chỉ cần thêm một dòng trong bảng.

  /**
   * Tìm nhóm sự cố đang hoạt động.
   *
   * @param {number} categoryId Mã nhóm sự cố.
   * @returns {Promise<object|null>} null nếu không tồn tại hoặc đã ngừng dùng.
   */
  async timNhomSuCo(categoryId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM issue_category WHERE category_id = $1 AND is_active = true',
      [categoryId],
    );
    return rows[0] || null;
  }

  /**
   * Liệt kê nhóm sự cố đang hoạt động.
   *
   * @returns {Promise<object[]>}
   */
  async lietKeNhomSuCo() {
    const { rows } = await this.pool.query(
      'SELECT * FROM issue_category WHERE is_active = true ORDER BY category_id',
    );
    return rows;
  }

  /**
   * Tìm trung tâm bảo hành.
   *
   * @param {number} centerId Mã trung tâm.
   * @returns {Promise<object|null>}
   */
  async timTrungTam(centerId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM service_center WHERE center_id = $1',
      [centerId],
    );
    return rows[0] || null;
  }

  /**
   * Liệt kê trung tâm bảo hành.
   *
   * @returns {Promise<object[]>}
   */
  async lietKeTrungTam() {
    const { rows } = await this.pool.query('SELECT * FROM service_center ORDER BY center_id');
    return rows;
  }

  /**
   * Liệt kê kỹ thuật viên đang hoạt động kèm tên trung tâm.
   *
   * Dùng JOIN thay vì hai truy vấn để tránh N+1 khi danh sách chỉ vài chục dòng.
   *
   * @returns {Promise<object[]>}
   */
  async lietKeKyThuatVien() {
    const { rows } = await this.pool.query(
      `SELECT t.*, c.center_name
         FROM technician t
         JOIN service_center c ON c.center_id = t.center_id
        WHERE t.is_active = true
        ORDER BY t.technician_id`,
    );
    return rows;
  }

  // ===================================================================== PHIẾU

  /**
   * Tìm phiếu theo mã.
   *
   * @param {number} ticketId Mã phiếu.
   * @returns {Promise<object|null>}
   */
  async timPhieuTheoId(ticketId) {
    const { rows } = await this.pool.query('SELECT * FROM ticket WHERE ticket_id = $1', [ticketId]);
    return rows[0] || null;
  }

  /**
   * Tìm phiếu theo request_id — phục vụ chống tạo trùng (NFR4).
   *
   * @param {string} requestId Khóa do client sinh.
   * @returns {Promise<object|null>}
   */
  async timPhieuTheoRequestId(requestId) {
    const { rows } = await this.pool.query('SELECT * FROM ticket WHERE request_id = $1', [requestId]);
    return rows[0] || null;
  }

  /**
   * Tìm phiếu đang mở của một thiết bị — quy định bổ sung QD-01.
   *
   * Vì sao cần: QT-06 cho phép một thiết bị quay lại trung tâm nhiều lần, nên
   * không thể UNIQUE trên device_id. Nhưng nếu đang có phiếu chưa đóng mà mở
   * thêm phiếu mới thì hai kỹ thuật viên có thể sửa cùng một máy.
   *
   * @param {string} serialNo Serial/IMEI của thiết bị.
   * @returns {Promise<object|null>} Phiếu đang mở, hoặc null nếu không có.
   */
  async timPhieuDangMoTheoSerial(serialNo) {
    const { rows } = await this.pool.query(
      `SELECT t.*
         FROM ticket t
         JOIN device d ON d.device_id = t.device_id
        WHERE d.serial_no = $1
          AND t.is_active = true
          AND t.status NOT IN ('HOAN_TAT', 'DA_DONG', 'DA_HUY')
        LIMIT 1`,
      [serialNo],
    );
    return rows[0] || null;
  }

  /**
   * Danh sách phiếu có lọc và phân trang (UC5, US6).
   *
   * Vì sao lọc/phân trang ở SQL: NFR1 yêu cầu phản hồi dưới 2 giây với 10.000
   * phiếu. Tải hết về Node rồi lọc sẽ chậm và tốn bộ nhớ. Index
   * idx_ticket_status_due_date hỗ trợ đúng thứ tự sắp xếp dùng ở đây.
   *
   * CẢNH BÁO: câu WHERE được ghép động nhưng CHỈ ghép số thứ tự tham số ($1,
   * $2...), giá trị luôn truyền qua mảng tham số nên không có nguy cơ SQL
   * injection.
   *
   * @param {object} [boLoc]
   * @param {string} [boLoc.status] Trạng thái cần lọc.
   * @param {string} [boLoc.dueBefore] Ngày `YYYY-MM-DD`, lấy phiếu hạn trước ngày đó.
   * @param {number} [boLoc.centerId] Lọc theo trung tâm (QT-14).
   * @param {number} [boLoc.page=1] Trang hiện tại.
   * @param {number} [boLoc.pageSize=20] Số dòng mỗi trang.
   * @returns {Promise<{rows: object[], total: number}>} `total` là tổng số dòng
   *   khớp điều kiện, không phải số dòng của trang hiện tại.
   */
  async lietKePhieu({ status, dueBefore, centerId, page = 1, pageSize = 20 } = {}) {
    const dieuKien = ['t.is_active = true'];
    const thamSo = [];

    if (status) {
      thamSo.push(status);
      dieuKien.push(`t.status = $${thamSo.length}`);
    }
    if (dueBefore) {
      thamSo.push(dueBefore);
      // So sánh với cuối ngày để "due_before=2026-10-01" bao gồm cả phiếu hạn
      // đúng ngày 01/10, tránh hiểu nhầm do giờ 00:00.
      dieuKien.push(`t.due_date < ($${thamSo.length}::date + interval '1 day')`);
    }
    if (centerId) {
      thamSo.push(centerId);
      dieuKien.push(`t.center_id = $${thamSo.length}`);
    }

    const where = `WHERE ${dieuKien.join(' AND ')}`;

    // Đếm riêng để giao diện biết tổng số trang; đây là truy vấn rẻ nhờ index.
    const dem = await this.pool.query(`SELECT count(*)::int AS total FROM ticket t ${where}`, thamSo);

    const boSung = [...thamSo, pageSize, (page - 1) * pageSize];
    const { rows } = await this.pool.query(
      `SELECT t.ticket_id, t.ticket_code, t.customer_id, t.device_id, t.center_id,
              t.request_type, t.issue_desc, t.category_id, t.priority, t.status,
              t.received_at, t.due_date, t.closed_at, t.is_warranty
         FROM ticket t
         ${where}
        ORDER BY t.due_date ASC, t.ticket_id ASC
        LIMIT $${thamSo.length + 1} OFFSET $${thamSo.length + 2}`,
      boSung,
    );

    return { rows, total: dem.rows[0].total };
  }

  /**
   * Tạo phiếu, sinh mã phiếu và ghi log trạng thái đầu tiên — NFR3.
   *
   * Vì sao phải là một transaction: nếu INSERT ticket thành công mà INSERT log
   * thất bại, hệ thống sẽ có phiếu "mồ côi" không có lịch sử, vi phạm QT-06.
   *
   * Vì sao lấy nextval thủ công thay vì để BIGSERIAL tự sinh: mã phiếu dạng
   * `BH-000123/2026` cần biết ticket_id TRƯỚC khi INSERT để ghi luôn trong một
   * câu lệnh. Đánh đổi: nếu transaction rollback thì số thứ tự bị hụt — chấp
   * nhận được vì mã phiếu chỉ cần duy nhất, không cần liên tục.
   *
   * @param {object} duLieu Dữ liệu phiếu đã qua Service kiểm tra.
   * @returns {Promise<object>} Bản ghi phiếu vừa tạo.
   */
  async taoPhieu(duLieu) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // pg_get_serial_sequence để không phụ thuộc tên sequence do PostgreSQL
      // tự đặt (ticket_ticket_id_seq), giúp migration đổi tên bảng vẫn chạy.
      const { rows: daySo } = await client.query(
        "SELECT nextval(pg_get_serial_sequence('ticket', 'ticket_id')) AS id",
      );
      const ticketId = Number(daySo[0].id);
      const nam = new Date(duLieu.received_at).getFullYear();
      const ticketCode = `BH-${String(ticketId).padStart(6, '0')}/${nam}`;

      const { rows } = await client.query(
        `INSERT INTO ticket (
           ticket_id, ticket_code, customer_id, device_id, center_id, request_type,
           issue_desc, category_id, priority, status, received_at, due_date,
           is_warranty, request_id
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'MOI', $10, $11, $12, $13)
         RETURNING *`,
        [
          ticketId,
          ticketCode,
          duLieu.customer_id,
          duLieu.device_id,
          duLieu.center_id,
          duLieu.request_type || 'BAO_HANH',
          duLieu.issue_desc,
          duLieu.category_id,
          duLieu.priority,
          duLieu.received_at,
          duLieu.due_date,
          duLieu.is_warranty,
          duLieu.request_id || null,
        ],
      );

      // QT-06: phiếu mới luôn có log đầu tiên với from_status = null.
      await client.query(
        `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_at, changed_by, note)
         VALUES ($1, NULL, 'MOI', $2, $3, $4)`,
        [ticketId, duLieu.received_at, duLieu.changed_by || 1, 'Tiếp nhận phiếu mới'],
      );

      await client.query('COMMIT');
      return rows[0];
    } catch (loi) {
      // Rollback rồi ném lại để Service/route quyết định mã HTTP.
      await client.query('ROLLBACK');
      throw loi;
    } finally {
      // Luôn trả kết nối về pool, kể cả khi lỗi — nếu quên sẽ cạn pool.
      client.release();
    }
  }

  /**
   * Cập nhật nội dung phiếu (không đổi trạng thái).
   *
   * @param {number} ticketId Mã phiếu.
   * @param {object} duLieu Các trường cần đổi.
   * @returns {Promise<object|null>}
   */
  async capNhatPhieu(ticketId, duLieu) {
    const { rows } = await this.pool.query(
      `UPDATE ticket
          SET issue_desc  = COALESCE($2, issue_desc),
              category_id = COALESCE($3, category_id),
              priority    = COALESCE($4, priority),
              due_date    = COALESCE($5, due_date),
              center_id   = COALESCE($6, center_id)
        WHERE ticket_id = $1 AND is_active = true
        RETURNING *`,
      [
        ticketId,
        duLieu.issue_desc ?? null,
        duLieu.category_id ?? null,
        duLieu.priority ?? null,
        duLieu.due_date ?? null,
        duLieu.center_id ?? null,
      ],
    );
    return rows[0] || null;
  }

  /**
   * Chuyển trạng thái phiếu và ghi lịch sử — QT-06.
   *
   * Vì sao dùng `SELECT ... FOR UPDATE`: hai nhân viên cùng bấm chuyển trạng
   * thái sẽ đọc cùng một trạng thái cũ và ghi đè nhau. Khóa dòng buộc request
   * thứ hai chờ, sau đó đọc trạng thái mới và bị Service từ chối nếu không hợp lệ.
   *
   * @param {number} ticketId Mã phiếu.
   * @param {object} duLieu
   * @param {string} duLieu.toStatus Trạng thái đích (Service đã kiểm tra hợp lệ).
   * @param {string|null} [duLieu.note] Ghi chú.
   * @param {number} [duLieu.changedBy] Người thực hiện.
   * @param {string|null} [duLieu.expectedStatus] Trạng thái client đang thấy.
   * @returns {Promise<{phieu?: object, tuTrangThai?: string, loi?: string}>}
   *   Trả `loi` thay vì ném để Service dịch thành AppError phù hợp.
   */
  async chuyenTrangThai(ticketId, { toStatus, note, changedBy, expectedStatus }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: hienTai } = await client.query(
        'SELECT * FROM ticket WHERE ticket_id = $1 AND is_active = true FOR UPDATE',
        [ticketId],
      );
      const phieu = hienTai[0];
      if (!phieu) {
        await client.query('ROLLBACK');
        return { loi: 'KHONG_TIM_THAY' };
      }

      // Chống ghi đè: client gửi expected_status để báo "tôi đang thấy MOI".
      // Nếu người khác đã đổi trước đó, trả lỗi thay vì ghi đè âm thầm.
      if (expectedStatus && phieu.status !== expectedStatus) {
        await client.query('ROLLBACK');
        return { loi: 'TRANG_THAI_DA_THAY_DOI', phieu };
      }

      const { rows } = await client.query(
        // Ép kiểu $2::varchar vì PostgreSQL không suy ra được kiểu khi cùng
        // tham số dùng ở hai vị trí khác ngữ cảnh (SET và CASE).
        `UPDATE ticket
            SET status = $2::varchar,
                closed_at = CASE WHEN $2::varchar = 'DA_DONG' THEN $3::timestamp ELSE NULL END
          WHERE ticket_id = $1
          RETURNING *`,
        [ticketId, toStatus, new Date()],
      );

      // QT-06: mọi lần chuyển đều ghi log, kể cả khi quay lại DANG_XU_LY từ
      // CHO_LINH_KIEN — đó là bước hợp lệ chứ không phải "quay lại trạng thái trước".
      await client.query(
        `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_at, changed_by, note)
         VALUES ($1, $2, $3, now(), $4, $5)`,
        [ticketId, phieu.status, toStatus, changedBy || 1, note || null],
      );

      await client.query('COMMIT');
      return { phieu: rows[0], tuTrangThai: phieu.status };
    } catch (loi) {
      await client.query('ROLLBACK');
      throw loi;
    } finally {
      client.release();
    }
  }

  /**
   * Lịch sử trạng thái của một phiếu, cũ nhất trước.
   *
   * Sắp theo cả changed_at và log_id vì hai lần chuyển trong cùng một giây vẫn
   * phải giữ đúng thứ tự ghi.
   *
   * @param {number} ticketId Mã phiếu.
   * @returns {Promise<object[]>}
   */
  async lietKeLichSuTrangThai(ticketId) {
    const { rows } = await this.pool.query(
      `SELECT log_id, ticket_id, from_status, to_status, changed_at, changed_by, note
         FROM ticket_status_log
        WHERE ticket_id = $1
        ORDER BY changed_at ASC, log_id ASC`,
      [ticketId],
    );
    return rows;
  }

  /**
   * Kiểm tra nhanh kết nối CSDL cho endpoint /health.
   *
   * @returns {Promise<boolean>} true nếu truy vấn đơn giản chạy được.
   */
  async kiemTraKetNoi() {
    const { rows } = await this.pool.query('SELECT 1 AS ok');
    return rows[0].ok === 1;
  }
}

module.exports = { PhieuRepository };
