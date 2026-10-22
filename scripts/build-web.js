const path = require('node:path');
const esbuild = require('esbuild');

/**
 * Build giao diện React từ `web/src` sang `public/`.
 *
 * Vì sao commit sẵn tệp build: yêu cầu của bài là clone về chạy được ngay bằng
 * `npm install && npm run setup && npm start`. Nếu bắt giảng viên chạy thêm
 * Vite/Webpack, chỉ một bước sai phiên bản Node là mất điểm "chạy được". Tệp
 * nguồn vẫn nằm trong `web/src` để đọc và sửa; chạy `npm run build:web` sau khi
 * sửa là đủ.
 *
 * Chạy: `npm run build:web`.
 */

const THU_MUC_GOC = path.join(__dirname, '..');

async function main() {
  await esbuild.build({
    // Một entry duy nhất; CSS được import trong main.jsx nên esbuild tự sinh
    // thêm `public/app.css` cạnh `public/app.js`.
    entryPoints: [{ in: path.join(THU_MUC_GOC, 'web', 'src', 'main.jsx'), out: 'app' }],
    outdir: path.join(THU_MUC_GOC, 'public'),
    bundle: true,
    minify: true,
    sourcemap: false,
    jsx: 'automatic',
    target: ['es2020'],
    define: {
      // React dùng biến này để bỏ các cảnh báo chỉ dành cho môi trường dev,
      // giúp bundle nhỏ hơn và không in cảnh báo thừa khi chấm bài.
      'process.env.NODE_ENV': '"production"',
    },
    logLevel: 'info',
  });

  console.log('Da build giao dien: public/app.js + public/app.css');
}

main().catch((loi) => {
  console.error(loi);
  process.exitCode = 1;
});
