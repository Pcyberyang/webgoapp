# 广钢新城骑行路线三维沙盘

这是广钢新城骑行路线的完整静态网站包。根页面 `index.html` 和直达页 `ride-ganggong.html` 都显示广钢骑行路线；不包含大夫山首页。

## 本地运行

需要 Python 3，无需安装 npm 依赖或执行构建步骤：

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

浏览器打开 <http://127.0.0.1:4173/>。如果端口被占用，可将 `4173` 换成其他端口。

## 网站文件

- `index.html`、`ride-ganggong.html`：广钢骑行路线页面
- `app.js`、`styles.css`：Three.js 场景、交互和样式
- `assets/ganggong-data.js`、`assets/ganggong-city.js`：广钢地形与城市数据
- `assets/ride-ganggong.js`：骑行路线和传感器数据
- `vendor/`：页面所需的 Three.js r180 模块和插件

页面使用在线 OpenStreetMap 瓦片作为可选底图；无法联网时仍显示本地地形、城市和路线。

## 数据与发布

`assets/ride-ganggong.js` 含精确骑行 GPS 坐标，页面也注明路线范围。该数据仅为本地网站运行而打包。公开上传到 GitHub 或部署到公开网站前，请确认这条真实轨迹可以公开；必要时先移除或模糊位置数据。

地图署名显示在页面底部：© OpenStreetMap contributors。地形为视觉示意，不是测绘成果。

## 项目时间线

可核实的来源文件时间和整理记录见 [HISTORY.md](HISTORY.md)。
