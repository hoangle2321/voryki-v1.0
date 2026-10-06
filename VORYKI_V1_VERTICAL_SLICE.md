# Voryki V1.0 — Vertical Slice

## 1. Mục tiêu bản thử nghiệm

V1.0 là một lát cắt chơi được từ đầu đến cuối, đủ để người mới tự hiểu cách chơi và đội phát triển kiểm tra nhịp độ, cảm giác khám phá và khả năng tích hợp asset.

Phạm vi V1.0 ưu tiên gameplay hoạt động ổn định. Đồ họa, animation và nội dung mở rộng có thể tiếp tục nâng cấp sau khi lấy phản hồi người chơi.

## 1.1. Baseline chung

- **Source chuẩn:** repository `voryki-v1.0`, branch `main`.
- **Theme/vibe:** phiêu lưu kỳ bí, ấm áp ở khu khởi đầu, luôn có cảm giác còn điều chưa được giải đáp.
- **Định hướng gameplay:** khám phá, thu thập sinh vật, nông trại sinh tồn, nhiệm vụ và xây dựng quan hệ.
- **Chuẩn trình bày:** gameplay 2D top-down pixel art; trang chủ và cinematic có thể dùng minh họa riêng nhưng phải giữ cùng nhận diện Voryki.
- **Mục tiêu bản test:** kiểm tra một vòng chơi hoàn chỉnh trước khi đầu tư mở rộng nội dung và đánh bóng hình ảnh.

## 2. Gameplay loop

1. Người chơi chọn **Bắt đầu** ở trang chủ.
2. Năm khung dẫn chuyện giới thiệu việc nhân vật rời Trái Đất, gặp thực thể đen và tỉnh dậy ở Voryki.
3. Người chơi điều khiển nhân vật trong Greenwake Vale.
4. Khám phá nông trại, nhặt tài nguyên, nói chuyện với NPC và nhận mục tiêu đầu tiên.
5. Làm nhiệm vụ kết bạn với V01.
6. Trồng, tưới và thu hoạch một loại cây ngắn ngày.
7. Mở túi đồ, dùng vật phẩm và bán một phần nông sản ở cửa hàng.
8. Đi qua khu Brackenwood, gặp sinh vật hoang dã và giải một thử thách môi trường nhỏ.
9. Trở về nông trại, lưu game và tải lại để kiểm tra trạng thái được giữ nguyên.

## 3. Hai map thử nghiệm

### Map 1 — Greenwake Vale

Map khởi đầu và căn cứ của người chơi.

- Nông trại, luống đất, nhà kho và điểm lưu.
- Làng nhỏ với cửa hàng, NPC hướng dẫn và bảng nhiệm vụ.
- Suối, cầu gỗ, bìa rừng và đường dẫn sang Brackenwood.
- Sinh vật cấp thấp, tài nguyên cơ bản và khu vực an toàn.
- Tông màu xanh lục, vàng nhạt, cam mùa thu; góc nhìn top-down pixel art.

### Map 2 — Brackenwood

Khu rừng thử nghiệm dùng để kiểm tra khám phá và tương tác môi trường.

- Rừng dày, giếng cổ, lối đá, suối bậc và cầu nhỏ.
- Một túp lều khảo sát và dấu tích kiến trúc cổ.
- Sinh vật hoang dã cấp thấp đến trung bình.
- Thử thách mở đường bằng cách kích hoạt hai mạch nước hoặc công tắc tự nhiên.
- Có manh mối đầu tiên về bảy viên đá nguyên thủy, nhưng chưa giải thích nguồn gốc.

Hai map phải nối với nhau bằng lối đi rõ ràng và dùng cùng chuẩn camera, tile, kích thước nhân vật và độ tương phản.

Mỗi map được kiểm thử trong khoảng **3 session**. Một session có thể dài 20–45 phút; người chơi phải có mục tiêu rõ ràng, biết mình đang ở đâu và có lý do để quay lại map hoặc nông trại.

## 4. Luồng nhiệm vụ V01

**Tên nhiệm vụ:** Một người bạn bên dòng suối

1. V01 xuất hiện ở bìa suối nhưng bỏ chạy khi người chơi đến gần.
2. Người chơi nói chuyện với NPC địa phương để biết V01 đang bị mắc kẹt và cảnh giác với con người.
3. Người chơi điều tra dấu chân, nhặt 6 gỗ và 3 đá.
4. Người chơi sửa đoạn bờ/kênh bị hỏng để nước chảy lại.
5. Người chơi dọn khu đất, gieo hạt, tưới nước và thu hoạch quả đầu tiên.
6. Sau khi nghỉ qua đêm, V01 quay lại gần nông trại.
7. Người chơi đưa quả cho V01 và chọn tương tác thân thiện.
8. V01 gia nhập đội, mở bảng thông tin sinh vật và đi theo người chơi trong Greenwake.

V01 vẫn giữ đúng thiết kế gốc: sinh vật teal nhỏ, thân mảnh, lông xù, vòng lá quanh cổ và lá ở đuôi; không thêm lá trên đầu.

## 5. Danh sách asset cần thiết

### Gameplay và nhân vật

- Sprite nhân vật chính: đứng, đi 4 hướng, tương tác.
- Sprite V01: đứng, đi 4 hướng, vui mừng, sợ hãi, theo sau.
- NPC làng: tối thiểu 3 nhân vật với chân dung hoặc biểu cảm đơn giản.
- Sinh vật hoang dã Brackenwood: tối thiểu 3 loài.

### Môi trường

- Bộ tile Greenwake: cỏ, đất, nước, bờ suối, cầu, hàng rào, đá, cây.
- Bộ tile Brackenwood: cây rừng, rễ cổ, giếng, lối đá, suối bậc, cầu.
- Nhà nông trại, cửa hàng, nhà NPC, kho và bảng nhiệm vụ.
- Vật thể tương tác: luống đất, rương, tài nguyên, công tắc, cổng.

### UI và nội dung

- Trang chủ và nút Bắt đầu.
- Năm khung dẫn chuyện mở đầu.
- Hộp thoại người dẫn truyện, NPC và V01.
- HUD: máu/năng lượng nếu dùng, giờ trong ngày, vàng, mục tiêu hiện tại.
- Túi đồ, cửa hàng, bảng sinh vật, bản đồ nhỏ và màn hình lưu.
- Icon hạt giống, nông sản, gỗ, đá, vàng và vật phẩm nhiệm vụ.

Mỗi asset phải có tên file ổn định, kích thước, hướng nhìn, trạng thái animation và ảnh preview.

## 6. Quy tắc đồ họa

- Gameplay dùng **2D top-down pixel art**, cùng góc nhìn với Greenwake map hiện tại.
- Không tự ý chuyển sang isometric, phối cảnh 3D hoặc góc nhìn ngang.
- Nhân vật và sinh vật phải có silhouette dễ nhận biết ở kích thước nhỏ.
- Giữ bảng màu, độ tương phản và độ pixel đồng nhất giữa các map.
- Sinh vật tiến hóa phải giữ nhận diện loài gốc; thay đổi theo từng bậc B, A, S, Tối thượng nhưng không biến thành loài khác.
- V01 giữ nguyên thiết kế gốc; chỉ bổ sung frame chuyển động cần thiết.
- Ảnh AI chỉ dùng làm concept/reference. Asset đưa vào game phải được kiểm tra lại theo lưới pixel và góc nhìn chuẩn.
- Ở V1.0 chưa bắt buộc sprite phải có đủ mọi frame chuyển động, hiệu ứng hay độ mịn của bản thương mại. Chỉ cần các frame cần thiết để người chơi đọc được hành động và chơi trọn loop.

## 7. Quy tắc bàn giao

- Mỗi người làm trên branch riêng, đặt tên `feature/<ten-nhiem-vu>`.
- Không sửa trực tiếp branch `main`.
- Mỗi task bàn giao gồm: file asset/code, mục đích sử dụng, kích thước, trạng thái hoàn thiện, cách tích hợp và ảnh preview.
- Commit nhỏ, có nội dung rõ ràng, ví dụ `Add Brackenwood bridge tiles`.
- Pull Request phải nêu phần đã làm, cách kiểm tra và vấn đề còn lại.
- Không đổi tên hoặc xóa asset đang được dùng nếu chưa báo trước.
- Người phụ trách tích hợp kiểm tra trên bản clone sạch trước khi merge.

## 8. Tiêu chí hoàn thành V1.0

V1.0 đạt khi:

- Người chơi mới có thể bắt đầu mà không cần người hướng dẫn bên ngoài.
- Hoàn thành được chuỗi mở đầu và vào Greenwake.
- Di chuyển, tương tác, hội thoại, nhặt đồ và chuyển map hoạt động.
- Hoàn thành đầy đủ nhiệm vụ kết bạn với V01.
- Trồng, tưới, thu hoạch và bán được nông sản.
- Túi đồ, vàng, cửa hàng và HUD hiển thị đúng trạng thái.
- Brackenwood có thể khám phá và hoàn thành thử thách nhỏ.
- Lưu rồi thoát game; mở lại vẫn giữ được vị trí, vật phẩm, vàng, tiến độ nhiệm vụ và V01.
- Không có lỗi chặn tiến trình trong một lượt chơi khoảng 2–3 session.
- Có README hướng dẫn chạy game và danh sách known issues.

## 8.1. Quy trình test và feedback

1. Đóng băng một bản test có mã phiên bản, ví dụ `v1.0.0-playtest`.
2. Cho người chơi mới thử toàn bộ luồng trong 2–3 session, không giải thích trực tiếp trong lúc họ chơi.
3. Ghi lại: người chơi có biết phải làm gì không, có bị lạc không, nhiệm vụ V01 có dễ hiểu không, nhịp nông trại có hợp lý không, lỗi chặn tiến trình và điểm gây khó chịu.
4. Ưu tiên sửa lỗi chặn game, lỗi mất save và lỗi khiến người chơi không biết mục tiêu trước khi sửa mỹ thuật.
5. Chỉ mở rộng thêm quốc gia, sinh vật, tiến hóa và dungeon sau khi vòng feedback xác nhận loop hiện tại hoạt động tốt.

Kết quả của vòng test phải gồm bản build, danh sách lỗi, phản hồi người chơi và quyết định rõ: **sửa trong V1.0**, **đưa sang V1.1** hoặc **loại khỏi phạm vi**.

## 9. Ngoài phạm vi V1.0

Các vùng quốc gia còn lại, tiến hóa đầy đủ của toàn bộ sinh vật, chiến đấu phức tạp, multiplayer, nguồn gốc bảy viên đá và bí mật hoàn chỉnh của The Unknown sẽ phát triển sau khi bản vertical slice được test và nhận phản hồi.
