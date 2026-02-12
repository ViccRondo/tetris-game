# 俄罗斯方块 🎮

一款复古风格的俄罗斯方块游戏，采用 GP 掌机风格 UI 设计。

## 特性

- 🎮 GP 掌机风格外壳设计
- 📺 像素风游戏画面
- 🕹️ 支持键盘和物理按钮控制
- ✨ 复古 CRT 扫描线效果
- 📱 响应式布局适配

## 游戏操作

### 键盘控制
- `←` `→` - 左右移动
- `↑` - 旋转
- `↓` - 加速下落
- `空格` - 硬落下
- `P` - 暂停
- `R` - 重新开始

### 物理按钮（掌机模式）
- 十字键 - 移动 / 旋转
- A 键 - 硬落下
- B 键 - 旋转

## 技术栈

- **Phaser 3** - 游戏引擎
- **HTML5/CSS3** - 界面渲染
- **Cloudflare Tunnel** - 内网穿透

## 运行方式

```bash
# 安装依赖
npm install

# 本地运行
npx serve -l 8080

# 内网穿透（需要 cloudflared）
npx cloudflared tunnel --url http://localhost:8080
```

## 截图

![游戏界面](https://github.com/ViccRondo/tetris-game/raw/main/src/screenshot.png)

## License

MIT
