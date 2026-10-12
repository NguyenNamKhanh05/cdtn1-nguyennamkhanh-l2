// Loi nghiep vu co ma de routes dich sang HTTP.
class AppError extends Error {
  constructor(maLoi, thongBao, chiTiet = undefined) {
    super(thongBao);
    this.name = 'AppError';
    this.code = maLoi;
    if (chiTiet !== undefined) this.chiTiet = chiTiet;
  }
}

module.exports = { AppError };
