# ProjectEvoteBlockchain — E‑Vote DAO + Multisig dApp

Ứng dụng web (React + Vite) mô phỏng một **dApp blockchain “giống web thật”**: kết nối ví MetaMask, yêu cầu đúng network, hiển thị trạng thái giao dịch (pending/success/fail), và cung cấp các chức năng on-chain chính:

- **DAO Voting**: tạo proposal, vote YES/NO, finalize proposal.
- **Multisig Payout**: xem danh sách giao dịch multisig, confirm & pay, execute.
- **User Profile (Firebase RTDB)**: lưu name/age/avatar theo địa chỉ ví để cá nhân hoá UI.

## Demo chức năng (MVP)

- **Connect wallet** + hiển thị **address / balance / chainId**.
- **Route guard**:
  - Không có MetaMask → báo “MetaMask required”
  - Chưa connect → CTA “Connect wallet”
  - Sai chain → CTA “Switch Ganache”
- **Transaction UX chuẩn dApp**: toast thông báo `pending → confirmed / failed`, tự disable nút khi đang gửi tx.
- **UX states**: loading skeleton, empty state, error state kèm nút retry.
- **Vote safety**: trang Vote có badge **VOTED** và khóa vote nếu address đã vote (đọc `hasVoted` từ contract).

## Tech stack

- **Frontend**: React 19, Vite 7, React Router 7
- **Styling**: TailwindCSS (custom UI kit: `card`, `btn-*`, `input`, `badge`…)
- **Web3**: ethers v6
- **Charts**: Chart.js + react-chartjs-2 (Dashboard)
- **Icons**: lucide-react
- **Profile storage**: Firebase Realtime Database

## Network / RPC (mặc định dự án đang dùng)

Dự án hiện được cấu hình cho **Ganache**:

- **RPC**: `http://127.0.0.1:7545`
- **chainId**: `1337`
- **Currency**: ETH

Nếu bạn reset Ganache hoặc deploy lại contract, địa chỉ contract sẽ thay đổi và bạn cần cập nhật ở mục bên dưới.

## Cấu hình contract addresses

Địa chỉ contract được dùng ở:

- `src/contracts/addresses.js`

Ví dụ:

```js
export const EVOTE_ADDRESS = "0x..."
export const MULTISIG_ADDRESS = "0x..."
```

Quan trọng:
- Nếu chainId đúng nhưng gửi giao dịch bị lỗi, đa số là do **address không khớp với lần deploy hiện tại**.
- App có check “contract đã deploy chưa” bằng `getCode()` để báo lỗi rõ ràng khi address sai.

## Cấu trúc thư mục (rút gọn)

- `src/web3/`: Web3 context/hook + helper gửi transaction
  - `src/web3/Web3Provider.jsx`: quản lý `provider/signer/account/chainId/balance`, lắng nghe `accountsChanged/chainChanged`, switch network (Ganache)
  - `src/web3/tx.js`: helper `sendTx()` để toast pending/success/fail
- `src/contracts/`: wrapper tạo contract từ signer + addresses
  - `src/contracts/evote.js`, `src/contracts/multisig.js`, `src/contracts/addresses.js`
- `src/routes/RequireWallet.jsx`: guard cho các trang on-chain
- `src/components/`: UI components (Layout, Toaster, Skeleton, BackgroundVideo…)
- `src/pages/`: Dashboard, Vote, CreateTx, Multisig, History, Profile
- `src/abi/`: ABI JSON dùng để tương tác smart contract

## Cài đặt & chạy dự án

### 1) Cài dependencies

```bash
npm install
```

### 2) Chạy Ganache

Mở Ganache GUI/CLI và đảm bảo:
- RPC chạy tại `http://127.0.0.1:7545`
- chainId là `1337`

Sau đó trong MetaMask:
- Add network/hoặc dùng nút **Switch Ganache** trên UI
- Import 1 account Ganache (private key) để có ETH test

### 3) Cập nhật địa chỉ contract

Deploy smart contract của bạn lên Ganache (bên repo khác hoặc tool riêng), lấy địa chỉ mới và cập nhật:
- `src/contracts/addresses.js`

Lưu ý: repo này hiện **chứa ABI + dApp frontend**, không thấy kèm source/deploy scripts của Solidity trong workspace.

### 4) Chạy frontend

```bash
npm run dev
```

Mở trình duyệt ở URL Vite in ra (thường `http://localhost:5173`).

### 5) Build production

```bash
npm run build
```

## Video nền (tuỳ chọn)

Dự án hỗ trợ video nền chạy loop nhẹ ở Layout.

Thêm file:
- `public/bg.mp4`
- (tuỳ chọn) `public/bg-poster.jpg`

Nếu không có video, app tự fallback sang background gradient.

## Troubleshooting

### 1) `Transaction failed: could not coalesce error`

Nguyên nhân thường gặp:
- **Sai chain** (MetaMask đang ở chain khác Ganache)
- **Ganache chưa chạy** hoặc RPC không đúng port
- **Contract address sai / chưa deploy** (Ganache reset → address đổi)

Cách xử lý:
- Đảm bảo MetaMask đang ở **chainId 1337**
- Đảm bảo Ganache chạy ở **`127.0.0.1:7545`**
- Cập nhật lại `src/contracts/addresses.js` theo địa chỉ deploy mới

### 2) UI báo “Wrong network”

Nhấn **Switch Ganache** trên thanh wallet hoặc ở màn hình guard. Nếu MetaMask báo không switch được, hãy add network Ganache thủ công:

- RPC URL: `http://127.0.0.1:7545`
- chainId: `1337`
- Symbol: `ETH`

### 3) Không thấy proposal / tx

- Kiểm tra đúng contract address
- Kiểm tra contract thật sự có data (proposalCount/transactionsLength)

## Security notes (dev)

- Firebase config trong `src/firebase.js` là dạng public config (phục vụ client). Tuy nhiên, bạn vẫn cần thiết lập rules RTDB phù hợp để tránh ghi/đọc trái phép.
- Không commit private key / seed phrase. MetaMask chỉ dùng account test từ Ganache.

## License

MIT (hoặc cập nhật theo nhu cầu của bạn).
