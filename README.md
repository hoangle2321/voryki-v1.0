# Voryki · Bản chơi đầu tiên

**Trang chủ → 5 khung dẫn chuyện / 6 lời dẫn → nông trại Greenwake → kết bạn với V01.** Đây là prototype chạy trong trình duyệt trên máy, dùng tài nguyên hình ảnh đã duyệt. Bản này chưa phải bộ cài game PC.

## Mở game

1. Nhấp đúp **launch.bat** trong thư mục này. Cửa sổ sẽ mở game tại **http://127.0.0.1:8771/**.
2. Chọn **PLAY** để bắt đầu, hoặc **Tiếp tục** để trở lại hành trình đã lưu.
3. Có thể dùng toàn màn hình trong Cài đặt hoặc phím F11 của trình duyệt.

Launcher ưu tiên Python đi kèm Codex, rồi tìm Python đã cài trên máy. Nếu chưa có Python, nó sẽ báo rõ và giữ cửa sổ để đọc. Không cần cài thư viện game hay truy cập mạng để chơi. Giữ nguyên toàn bộ thư mục, đặc biệt thư mục `assets`.

Nếu máy đang chạy bản này ở cổng 8771, launcher sử dụng lại. Nếu cổng đang chạy một ứng dụng khác, launcher sẽ báo để tránh ghi đè hoặc dừng ứng dụng đó. Cửa sổ máy chủ được chạy ẩn; đóng trang game không dừng máy chủ, và máy chủ chỉ nghe trên máy này.

## Điều khiển

| Thao tác | Điều khiển |
| --- | --- |
| Qua lời dẫn | Enter, Space hoặc nút Tiếp tục |
| Đi lại | WASD hoặc phím mũi tên |
| Chạy | Giữ Shift khi di chuyển |
| Đi đến một chỗ | Nhấp mặt đất; nhấp vật thể để đến gần và tương tác |
| Tương tác | E khi lời nhắc xuất hiện |
| Chọn công cụ / hạt | 1–8 hoặc nhấp thanh công cụ |
| Túi đồ | B |
| Nhật ký nhiệm vụ | J |
| Bản đồ | M |
| Đội linh thú | V |
| Tạm dừng / đóng bảng | Esc |

Chọn cuốc đất, hạt giống hoặc bình tưới rồi nhấn E trước luống để thao tác nhanh. Công cụ có ngăn riêng, không chiếm ô vật phẩm.

## Nội dung đang chơi được

- Trang chủ với nút Play, tiếp tục và cài đặt; 5 hình dẫn chuyện, khung thứ 2 có 2 lời dẫn.
- Map nông trại ven sông, đi bộ / chạy, va chạm, đường đi bằng chuột và chuyển động 4 hướng của nhân vật cùng V01.
- Người trông vườn, dấu chân, máng nước, rương, cửa hàng, nhà nghỉ và các điểm thu thập gỗ, đá, quả.
- Túi 30 ô: kéo thả, gộp chồng, tách đôi, khóa đồ, sắp xếp và ăn thức ăn để hồi năng lượng. Rương có 30 ô riêng.
- Khởi đầu **300 vàng**, **100 năng lượng**, **4 hạt củ cải**, **2 hạt lúa mì** và 4 công cụ. Cửa hàng mở **06:00–20:00** theo giờ trong game.
- 12 luống nông trại cùng luống quả mọng ven sông: xới → gieo → tưới → lớn → thu hoạch. Gỗ, đá và quả có thể thu thập lại vào ngày mới.
- Sáng tối, nghỉ đến 06:00 ngày hôm sau để hồi năng lượng; tu sửa nhà bằng 120 vàng + 12 gỗ + 6 đá. Mức tu sửa được ghi nhận, hình nhà nâng cấp sẽ được bổ sung sau.
- Tự lưu, lưu thủ công, xuất / nhập bản lưu. Bản đồ các quốc gia đã có để xem; khu vực chơi hiện tại là một khu nhỏ của Greenwake.

Các con số kinh tế và thời gian dưới đây là cân bằng thử nghiệm:

| Cây | Thời gian lớn khi được tưới | Sản phẩm / lần thu |
| --- | --- | --- |
| Củ cải | 4 giờ trong game | 3 |
| Lúa mì | 6 giờ trong game | 3 |
| Quả mọng | 3 giờ trong game | 4 |

Khi tự do chơi, 1 giây thực khoảng 3 phút trong game. Hội thoại, bảng tương tác và tạm dừng dừng đồng hồ. Cây non cần được tưới mỗi ngày; ngủ có thể giúp cây đã được tưới lớn đến sáng. Game không tính tăng trưởng khi bạn đóng game.

## Hành trình kết bạn với V01

Ban đầu bạn đi một mình. V01 đã có ở bờ sông nhưng chưa đi theo bạn.

1. Đến gần V01 rồi hỏi người trông vườn. Bạn nhận hạt quả mọng.
2. Xem dấu chân và kiểm tra máng nước bên sông.
3. Gom **6 gỗ + 3 đá**, sửa máng nước và dọn vật cản ở bờ sông.
4. Xới luống ven sông, gieo quả mọng và tưới.
5. Về nhà nghỉ qua đêm. Khi cây đã lớn, quay lại gặp V01.
6. Nhẹ nhàng đưa tay hoặc đặt quả mọng. V01 trở thành bạn đồng hành, đi theo bạn; phần thưởng đầu tiên là 80 vàng.

Nhật ký J và dấu chấm than trên map chỉ bước tiếp theo. Bạn có thể tiếp tục trồng trọt, mua bán và tích lũy sau khi hoàn thành nhiệm vụ.

## Giữ tiến độ

Game lưu tự động sau hành động và định kỳ khi đang chơi. **Esc → Lưu ngay** để chủ động lưu; **Xuất bản lưu** tải một tệp JSON dự phòng. **Nhập bản lưu** kiểm tra tệp trước khi hỏi có thay hành trình hiện tại hay không.

Lưu tự động nằm trong dữ liệu của **trình duyệt đang dùng tại http://127.0.0.1:8771/**. Dùng trình duyệt khác, đổi địa chỉ / cổng, chế độ riêng tư hoặc xóa dữ liệu trang có thể khiến bản lưu không xuất hiện. Tệp đã xuất có thể nhập lại. Khi bấm Play có tiến độ cũ, game hỏi trước khi bắt đầu lại.

Vị trí, ngày giờ, vàng, năng lượng, đồ, cây, nhiệm vụ, mức nhà và V01 đều được lưu. Đây là lưu trên máy; chưa có tài khoản hoặc đồng bộ đám mây.

## Phần phát triển tiếp

Chiến đấu, boss, đội nhiều linh thú, tiến hóa B / A / S / Tối thượng, vũ khí và các quốc gia tiếp theo chưa được triển khai. Tàn tích và lối phía bắc hiện là điểm dẫn chuyện. Mục tiêu của bản này là kiểm tra luồng mở đầu, cảm giác đi lại, tương tác, nông trại, túi đồ và kết bạn với V01 trước khi mở rộng.

## Kiểm tra dành cho người phát triển

Chạy `npm test` khi có Node.js để kiểm tra logic nhiệm vụ, kinh tế, túi / rương, cây, bản lưu và đường đi trên map. Trang `?test=1` dùng dữ liệu lưu riêng cùng nút hỗ trợ kiểm thử; trang bình thường không có các nút này.
