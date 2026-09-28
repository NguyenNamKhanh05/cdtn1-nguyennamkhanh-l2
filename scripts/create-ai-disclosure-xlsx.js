const XLSX = require('xlsx');

const rows = [
  ['Công cụ đã sử dụng', 'Phần sản phẩm có sử dụng AI hỗ trợ'],
  [
    'GitHub Copilot/Copilot Chat: đọc và tóm tắt case study, gợi ý phạm vi L2, tạo mã khung Node.js/Express, viết smoke test và hỗ trợ kiểm tra tài liệu.',
    'Phiếu phạm vi buổi 2 và danh sách User Story cho luồng L2; mã khung endpoint GET /health; smoke test trong tests/smoke-test.js.'
  ],
  [
    'ChatGPT: hỗ trợ diễn đạt User Story, hướng dẫn cấu trúc repo, .gitignore, .env.example, README và cách sử dụng dữ liệu mẫu.',
    'Cấu trúc thư mục repo, file cấu hình ban đầu, README, hướng dẫn dữ liệu L2, tài liệu cấu hình môi trường và mẫu dữ liệu nhỏ trong data/sample/.'
  ]
];

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(rows);
worksheet['!cols'] = [{ wch: 75 }, { wch: 85 }];
XLSX.utils.book_append_sheet(workbook, worksheet, 'Khai bao AI');
XLSX.writeFile(workbook, 'docs/ai-disclosure.xlsx');
console.log('Created docs/ai-disclosure.xlsx');
