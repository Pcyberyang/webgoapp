<img width="1461" height="863" alt="1" src="https://github.com/user-attachments/assets/1cfc675c-802d-4066-bc76-d2db03f03af8" /><img width="1421" height="673" alt="4" src="https://github.com/user-attachments/assets/d1f1ea28-d143-48b1-af85-184eeaafd71e" />
<img width="1401" height="869" alt="3" src="https://github.com/user-attachments/assets/78aec052-eea7-4229-80eb-1267c24f286c" />
<img width="1453" height="887" alt="2" src="https://github.com/user-attachments/assets/c2a9a7ed-84f5-49cf-b15d-b1d26d451a68" />



## 算法主链路（固定）

1. **采集**：气压 ~1 Hz、GPS 1 Hz；IMU 记录但不参与主结果
2. **合并**：多段按真实起始时间对齐，保留暂停间隔
3. **清洗**：剔除水平精度 >50 m 的定位点，标记 >5 s 的暂停
4. **高度**：`h = 44330[1 − (p/p₀)^0.1903]`，`p₀` 取前 30–60 秒
5. **漂移校正**：环线闭合优先（6 → 10 → 15 m 分级，≥8 / ≥8 / ≥5 组，间隔 >180 s），GPS 锚定兜底（≥20 分钟才启用）
6. **坡度**：20–30 秒滑动窗口差分（约 100–150 米）
7. **分段**：±1.5% 阈值 + 1% 滞回 + 最短 15 秒 / 50 米

## 打开报告

双击 `report/getslop-2026-10-18-10-47-33.html` 或 `report/getslop2-2026-10-20-merged.html`。

地图底图（OSM / 卫星）需要联网；不联网时其余部分照常显示。

## 文件结构

```
DATA/
  *.xlsx                        phyphox 原始导出 / 合并后的记录
tools/
  merge_phyphox.py              多段记录合并
  build_ride_report.py          清洗、高度、漂移校正、坡度、生成 HTML
report/
  *.html                        自包含报告
  data/*.csv                    完整原始数据
docs/
  00-可行性分析与风险.md
  10-算法方案-定稿.md           权威算法方案（v1）
_archive/
  terrain-2026-10-24/           已移除的地形 / DEM / 三维渲染（可恢复）
refer/                          参考图片
```

## 重新生成

```powershell
python tools\build_ride_report.py
python tools\build_ride_report.py "DATA\别的记录.xlsx" -o report
```

依赖：Python 3.11+、pandas、numpy、openpyxl、Pillow、scipy。

## 多段记录合并

一次骑行被拆成多段导出时，先按各段真实起始时间合并：

```powershell
python tools\merge_phyphox.py "DATA\a.xlsx" "DATA\b.xlsx" "DATA\c.xlsx" -o "DATA\merged.xlsx"
python tools\build_ride_report.py "DATA\merged.xlsx" -o report
```

合并与展示时的处理：

- 按各段 `Metadata Time` 的起始时间对齐，保留真实时间间隔
- 暂停期间不累计里程（跨暂停的位移未知）
- 曲线在暂停处断开，地图不画跨暂停的连线
- 高度在暂停后的第一拍用气压重新锚定
- 自动剔除水平精度 > 50 m 的无效定位点

## 3D 沙盘叠加（3Dland）

把骑行路线导出到 `E:\Codesin\3Dland` 的广钢公园沙盘：

```powershell
python tools\export_route_for_3dland.py "report\getslop2-2026-10-20-merged.html" `
  -o "E:\Codesin\3Dland\assets\ride-ganggong.js"
```

然后在 3Dland 目录启动本地服务，打开 `ride-ganggong.html`。

## 报告包含

- 地图（OSM / 卫星）+ 轨迹
- 相对高度混合：气压（已校正漂移）+ IMU 融合
- IMU 启用区间用红点/红色区间标注，并写明触发原因（仅在 IMU 实际有数据时标记）
- 气压漂移校正前后对比
- 速度、气压、加速度、角速度、GPS 精度
- IMU 倾角、高度对照、安装角自标定（辅助分析）
- 原始数据预览与 CSV 下载

## 已验证的结论

| 项目 | 结果 |
| --- | --- |
| 气压计噪声 | 0.009 hPa ≈ 0.08 m |
| 环线闭合漂移估计 | 8.4 m/h（665 组重访点） |
| GPS 独立估计 | 9.4 m/h（互证） |
| 同点气压差（校正前 → 后） | 2.54 m → 0.01 m |
| 跨两次骑行同点差 | 1.58 m → 0.01 m |
| 30 s 窗口坡度噪声 | 1.1% |

## 已知限制

- 相对高度不是绝对海拔，跨次不可直接比较
- 当前漂移模型为线性；2–3 小时以上可能需要分段模型
- 无重访点且不足 20 分钟时，不做漂移校正
- IMU 仅作辅助分析，不作为高度主来源

## 变更记录

- **2026-10-24**：移除地形重建、DEM 与三维渲染相关算法和文件，归档到 `_archive/terrain-2026-10-24/`；算法主链路固化为上述 7 步。
