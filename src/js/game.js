// 复古俄罗斯方块 - Phaser 3
// 🎮 像素风怀旧经典 - GP掌机风格版

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24; // 标准方块大小

const COLORS = [
    0x000000,
    0x00ffff, // I - 青色
    0x0000ff, // J - 蓝色
    0xffa500, // L - 橙色
    0xffff00, // O - 黄色
    0x00ff00, // S - 绿色
    0xff00ff, // T - 紫色
    0xff0000, // Z - 红色
];

const SHAPES = [
    [],
    [[1, 1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 1, 0], [0, 1, 1]],
];

const PIECE_TYPES = [1, 2, 3, 4, 5, 6, 7];

class TetrisGame extends Phaser.Scene {
    constructor() {
        super({ key: 'TetrisGame' });
        this.grid = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.dropTimer = 0;
        this.dropInterval = 1000;
        this.lastInputTime = 0;
        this.inputDelay = 120;
        this.blockGraphics = [];
        this.currentBlockGraphics = [];
        this.isMobile = false;
    }

    create() {
        this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

        // 检测是否为移动设备（排除掌机模式）
        const isTouchDevice = 'ontouchstart' in window;
        this.isMobile = window.innerWidth < 400 && isTouchDevice;

        // 掌机模式下使用标准大小
        this.blockSize = BLOCK_SIZE;

        // 设置画布大小（掌机风格）
        const canvasWidth = COLS * BLOCK_SIZE + 80;
        const canvasHeight = ROWS * BLOCK_SIZE + 40;

        if (this.isMobile) {
            this.scale.resize(window.innerWidth, window.innerHeight);
        } else {
            this.scale.resize(canvasWidth, canvasHeight);
        }

        // 掌机风格背景
        this.createConsoleBackground();

        // 创建游戏区域
        this.createGameArea();

        // 创建信息区域（右侧）
        this.createInfoArea();

        // 注册游戏动作（供HTML按钮调用）
        window.gameActions = {
            left: () => this.moveLeft(),
            right: () => this.moveRight(),
            up: () => this.rotate(),
            down: () => this.softDrop(),
            rotate: () => this.rotate(),
            drop: () => this.hardDrop()
        };

        // 生成方块
        this.spawnPiece();
        this.spawnNextPiece();

        // 键盘控制
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    }

    createConsoleBackground() {
        const bg = this.add.graphics();

        // 深色背景
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRect(0, 0, 400, 550);
    }

    createGameArea() {
        // 游戏区在左侧
        const gameX = 15;
        const gameY = 15;
        const gameWidth = COLS * BLOCK_SIZE;
        const gameHeight = ROWS * BLOCK_SIZE;

        // 游戏区域背景（深蓝灰色）
        const bg = this.add.graphics();
        bg.fillStyle(0x16213e, 1);
        bg.fillRect(gameX, gameY, gameWidth, gameHeight);

        // 网格线
        bg.lineStyle(1, 0x1a1a2e, 0.4);
        for (let x = 0; x <= COLS; x++) {
            bg.moveTo(gameX + x * BLOCK_SIZE, gameY);
            bg.lineTo(gameX + x * BLOCK_SIZE, gameY + gameHeight);
        }
        for (let y = 0; y <= ROWS; y++) {
            bg.moveTo(gameX, gameY + y * BLOCK_SIZE);
            bg.lineTo(gameX + gameWidth, gameY + y * BLOCK_SIZE);
        }

        // 边框
        bg.lineStyle(3, 0xe94560, 1);
        bg.strokeRect(gameX - 2, gameY - 2, gameWidth + 4, gameHeight + 4);

        this.gameX = gameX;
        this.gameY = gameY;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
    }

    createInfoArea() {
        // 信息区域在右侧
        const infoX = this.gameX + this.gameWidth + 20;
        const infoY = 15;

        // 标题
        this.add.text(infoX, infoY, 'NEXT', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#e94560',
        });

        // NEXT预览背景
        const previewBg = this.add.graphics();
        previewBg.fillStyle(0x0f3460, 1);
        previewBg.fillRect(infoX - 5, infoY + 15, 80, 70);
        previewBg.lineStyle(2, 0xe94560, 0.8);
        previewBg.strokeRect(infoX - 5, infoY + 15, 80, 70);

        this.nextPreview = this.add.graphics();
        this.nextPreview.x = infoX + 25;
        this.nextPreview.y = infoY + 30;

        // 分数
        this.add.text(infoX, infoY + 100, 'SCORE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#e94560',
        });

        this.scoreText = this.add.text(infoX, infoY + 120, '0', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#ffffff',
        });

        // 等级
        this.add.text(infoX, infoY + 150, 'LEVEL', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#e94560',
        });

        this.levelText = this.add.text(infoX, infoY + 170, '1', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#ffffff',
        });

        // 行数
        this.add.text(infoX, infoY + 200, 'LINES', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#e94560',
        });

        this.linesText = this.add.text(infoX, infoY + 220, '0', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#ffffff',
        });

        // 操作提示
        const hints = [
            '←→:移动',
            '↑:旋转',
            '↓:加速',
            '空格:落下',
            'P:暂停',
        ];

        hints.forEach((hint, i) => {
            this.add.text(infoX, infoY + 260 + i * 16, hint, {
                fontFamily: '"Press Start 2P"',
                fontSize: '8px',
                color: '#666666',
            });
        });

        // 重新开始
        this.add.text(infoX, infoY + 360, 'R:重开', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#e94560',
        });
    }

    moveLeft() {
        if (this.isValidPosition(this.currentPiece.x - 1, this.currentPiece.y, this.currentPiece.shape)) {
            this.currentPiece.x--;
            this.showCurrentPiece();
        }
    }

    moveRight() {
        if (this.isValidPosition(this.currentPiece.x + 1, this.currentPiece.y, this.currentPiece.shape)) {
            this.currentPiece.x++;
            this.showCurrentPiece();
        }
    }

    rotate() {
        const shape = this.currentPiece.shape;
        const rotated = shape[0].map((_, i) => shape.map(row => row[i]).reverse());

        if (this.isValidPosition(this.currentPiece.x, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
            this.showCurrentPiece();
        } else {
            const kicks = [-1, 1, -2, 2];
            for (const kick of kicks) {
                if (this.isValidPosition(this.currentPiece.x + kick, this.currentPiece.y, rotated)) {
                    this.currentPiece.x += kick;
                    this.currentPiece.shape = rotated;
                    this.showCurrentPiece();
                    break;
                }
            }
        }
    }

    softDrop() {
        if (this.movePieceDown()) {
            this.score += 1;
            this.updateScore();
        }
    }

    spawnPiece() {
        if (!this.nextPiece) {
            this.nextPiece = this.createRandomPiece();
        }

        this.currentPiece = {
            type: this.nextPiece.type,
            shape: SHAPES[this.nextPiece.type],
            x: Math.floor(COLS / 2) - Math.floor(SHAPES[this.nextPiece.type][0].length / 2),
            y: 0,
        };

        this.spawnNextPiece();

        if (!this.isValidPosition(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.gameOver = true;
            this.showGameOver();
        }
    }

    spawnNextPiece() {
        const type = Phaser.Math.RND.pick(PIECE_TYPES);
        this.nextPiece = { type, shape: SHAPES[type] };
        this.drawNextPreview();
    }

    createRandomPiece() {
        const type = Phaser.Math.RND.pick(PIECE_TYPES);
        return { type, shape: SHAPES[type] };
    }

    drawNextPreview() {
        this.nextPreview?.clear();

        const shape = this.nextPiece.shape;
        const blockSize = 18;
        const offsetX = (4 - shape[0].length) * blockSize / 2 + 5;
        const offsetY = (4 - shape.length) * blockSize / 2 + 5;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    this.drawBlock(this.nextPreview, x * blockSize + offsetX, y * blockSize + offsetY, blockSize, COLORS[this.nextPiece.type]);
                }
            }
        }
    }

    showCurrentPiece() {
        this.clearCurrentPiece();

        const shape = this.currentPiece.shape;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const worldX = this.gameX + (this.currentPiece.x + x) * BLOCK_SIZE;
                    const worldY = this.gameY + (this.currentPiece.y + y) * BLOCK_SIZE;

                    const g = this.add.graphics();
                    this.drawBlock(g, worldX, worldY, BLOCK_SIZE, COLORS[this.currentPiece.type]);
                    this.currentBlockGraphics.push(g);
                }
            }
        }
    }

    clearCurrentPiece() {
        if (this.currentBlockGraphics) {
            this.currentBlockGraphics.forEach(g => g.destroy());
        }
        this.currentBlockGraphics = [];
    }

    drawBlock(graphics, x, y, size, color) {
        graphics.fillStyle(color, 1);
        graphics.fillRect(x, y, size - 1, size - 1);

        // 高光
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillRect(x, y, size - 4, 2);
        graphics.fillRect(x, y, 2, size - 4);

        // 阴影
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(x + size - 3, y, 2, size - 1);
        graphics.fillRect(x, y + size - 3, size - 1, 2);
    }

    clearAllBlocks() {
        this.blockGraphics.forEach(g => g.destroy());
        this.blockGraphics = [];
        this.currentBlockGraphics.forEach(g => g.destroy());
        this.currentBlockGraphics = [];
    }

    update(time, delta) {
        if (this.gameOver || this.isPaused) {
            if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
                this.scene.restart();
            }
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.pKey)) {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                this.showPaused();
            } else {
                this.pausedText?.destroy();
            }
        }

        if (this.isPaused) return;

        this.handleInput();

        this.dropTimer += delta;
        if (this.dropTimer >= this.dropInterval) {
            this.dropTimer = 0;
            this.movePieceDown();
        }
    }

    handleInput() {
        const cursors = this.cursors;
        const now = this.time.now;

        if (now - this.lastInputTime < this.inputDelay) return;

        if (cursors.left.isDown) {
            this.moveLeft();
            this.lastInputTime = now;
        } else if (cursors.right.isDown) {
            this.moveRight();
            this.lastInputTime = now;
        }

        if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
            this.rotate();
        }

        if (cursors.down.isDown) {
            this.softDrop();
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.hardDrop();
        }
    }

    movePieceDown() {
        if (this.isValidPosition(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
            this.currentPiece.y++;
            this.showCurrentPiece();
            return true;
        } else {
            this.lockPiece();
            return false;
        }
    }

    hardDrop() {
        let dropDistance = 0;
        while (this.isValidPosition(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        this.score += dropDistance * 2;
        this.updateScore();
        this.lockPiece();
        this.showCurrentPiece();
    }

    isValidPosition(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;

                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return false;
                    }

                    if (newY >= 0 && this.grid[newY][newX] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    lockPiece() {
        const shape = this.currentPiece.shape;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const gridY = this.currentPiece.y + y;
                    const gridX = this.currentPiece.x + x;

                    if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
                        this.grid[gridY][gridX] = this.currentPiece.type;
                    }
                }
            }
        }

        // 清除并重绘
        this.clearAllBlocks();
        this.drawGridBlocks();

        this.checkLines();
        this.updateScore();

        // 消除后重绘
        this.clearAllBlocks();
        this.drawGridBlocks();

        this.spawnPiece();
    }

    checkLines() {
        let linesCleared = 0;
        let rowsToRemove = [];

        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                rowsToRemove.push(y);
            }
        }

        if (rowsToRemove.length > 0) {
            for (let y = ROWS - 1; y >= 0; y--) {
                if (rowsToRemove.includes(y)) {
                    this.grid.splice(y, 1);
                    this.grid.unshift(Array(COLS).fill(0));
                }
            }

            linesCleared = rowsToRemove.length;
            this.lines += linesCleared;

            const lineScores = [0, 100, 300, 500, 800];
            this.score += lineScores[linesCleared] * this.level;

            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            }

            this.showLineClearEffect(linesCleared);
        }
    }

    showLineClearEffect(linesCleared) {
        const flashColor = linesCleared >= 4 ? 0xffff00 : 0xffffff;

        const effect = this.add.graphics();
        effect.fillStyle(flashColor, 0.8);

        for (let y = 0; y < ROWS; y++) {
            if (this.grid[y].every(cell => cell !== 0)) {
                effect.fillRect(this.gameX, this.gameY + y * BLOCK_SIZE, COLS * BLOCK_SIZE, BLOCK_SIZE);
            }
        }

        this.tweens.add({
            targets: effect,
            alpha: 0,
            duration: 300,
            onComplete: () => effect.destroy()
        });
    }

    updateScore() {
        this.scoreText.setText(this.score.toString());
        this.levelText.setText(this.level.toString());
        this.linesText.setText(this.lines.toString());
    }

    showPaused() {
        this.pausedText = this.add.text(
            200, 250, 'PAUSED',
            {
                fontFamily: '"Press Start 2P"',
                fontSize: '28px',
                color: '#e94560',
                stroke: '#000000',
                strokeThickness: 4,
            }
        ).setOrigin(0.5);
    }

    showGameOver() {
        this.clearAllBlocks();
        this.drawGridBlocks();

        const gameOverText = this.add.text(
            200, 230, 'GAME OVER',
            {
                fontFamily: '"Press Start 2P"',
                fontSize: '22px',
                color: '#e94560',
                stroke: '#000000',
                strokeThickness: 4,
            }
        ).setOrigin(0.5);

        const finalScore = this.add.text(
            200, 270, `SCORE: ${this.score}`,
            {
                fontFamily: '"Press Start 2P"',
                fontSize: '12px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
            }
        ).setOrigin(0.5);

        const restartText = this.add.text(
            200, 310, 'Press R to Restart',
            {
                fontFamily: '"Press Start 2P"',
                fontSize: '10px',
                color: '#888888',
            }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: restartText,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1,
        });
    }

    drawGridBlocks() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.grid[y][x] !== 0) {
                    const worldX = this.gameX + x * BLOCK_SIZE;
                    const worldY = this.gameY + y * BLOCK_SIZE;

                    const g = this.add.graphics();
                    this.drawBlock(g, worldX, worldY, BLOCK_SIZE, COLORS[this.grid[y][x]]);
                    this.blockGraphics.push(g);
                }
            }
        }
    }
}

// 检测是否为掌机模式（宽屏且非触屏）
const isHandheldMode = !('ontouchstart' in window) && window.innerWidth >= 400;

const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 550,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: TetrisGame,
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};

const game = new Phaser.Game(config);
