const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const controlsText = document.getElementById('controls');

canvas.width = 320;
canvas.height = 480;

const state = {
    bird: {
        x: 80,
        y: 200,
        velocity: 0,
        width: 35,
        height: 35,
        color: '#FFD700'
    },
    gravity: 0.2,         // 降低重力
    jumpForce: -5,        // 减小跳跃力度
    pipes: [],
    score: 0,
    gameOver: false,
    gameStarted: false,
    pipeGap: 200,         // 增加管道间隙
    pipeWidth: 60,
    pipeSpacing: 280,     // 增加管道之间的距离
    pipeSpeed: 1.5        // 降低管道移动速度
};

function createPipe() {
    const minHeight = 80;
    const maxHeight = canvas.height - state.pipeGap - minHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
    
    return {
        x: canvas.width,
        top: height,
        passed: false
    };
}

function update() {
    if (!state.gameStarted || state.gameOver) return;

    // 更新小鸟
    state.bird.velocity += state.gravity;
    state.bird.y += state.bird.velocity;

    // 生成管道
    if (state.pipes.length === 0 || 
        canvas.width - state.pipes[state.pipes.length - 1].x >= state.pipeSpacing) {
        state.pipes.push(createPipe());
    }

    // 更新管道
    for (let i = state.pipes.length - 1; i >= 0; i--) {
        state.pipes[i].x -= state.pipeSpeed;

        // 计分
        if (!state.pipes[i].passed && state.pipes[i].x + state.pipeWidth < state.bird.x) {
            state.score++;
            scoreElement.textContent = state.score;
            state.pipes[i].passed = true;
        }

        // 移除屏幕外的管道
        if (state.pipes[i].x + state.pipeWidth < 0) {
            state.pipes.splice(i, 1);
        }
    }

    // 碰撞检测
    if (state.bird.y < 0 || state.bird.y + state.bird.height > canvas.height) {
        gameOver();
    }

    state.pipes.forEach(pipe => {
        if (checkCollision(state.bird, pipe)) {
            gameOver();
        }
    });
}

function checkCollision(bird, pipe) {
    if (bird.x + bird.width > pipe.x && bird.x < pipe.x + state.pipeWidth) {
        if (bird.y < pipe.top || bird.y + bird.height > pipe.top + state.pipeGap) {
            return true;
        }
    }
    return false;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景云朵
    drawClouds();

    // 绘制小鸟（圆形）
    ctx.beginPath();
    ctx.arc(
        state.bird.x + state.bird.width/2,
        state.bird.y + state.bird.height/2,
        state.bird.width/2,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = state.bird.color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制眼睛
    ctx.beginPath();
    ctx.arc(
        state.bird.x + state.bird.width * 0.7,
        state.bird.y + state.bird.height * 0.4,
        4,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = '#000';
    ctx.fill();

    // 绘制管道
    state.pipes.forEach(pipe => {
        // 上管道
        drawPipe(pipe.x, 0, state.pipeWidth, pipe.top, true);
        // 下管道
        drawPipe(pipe.x, pipe.top + state.pipeGap, state.pipeWidth, 
            canvas.height - (pipe.top + state.pipeGap), false);
    });

    // 游戏结束显示
    if (state.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '24px Arial';
        ctx.fillText(`得分: ${state.score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.font = '20px Arial';
        ctx.fillText('点击重新开始', canvas.width / 2, canvas.height / 2 + 50);
    }
}

function drawPipe(x, y, width, height, isTop) {
    // 管道主体
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x, y, width, height);
    
    // 管道边框
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // 管道口
    const lipHeight = 10;
    const lipWidth = 10;
    ctx.fillStyle = '#27ae60';
    if (isTop) {
        ctx.fillRect(x - lipWidth/2, height + y - lipHeight, width + lipWidth, lipHeight);
    } else {
        ctx.fillRect(x - lipWidth/2, y, width + lipWidth, lipHeight);
    }
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const time = Date.now() * 0.001;
    for (let i = 0; i < 3; i++) {
        const x = ((time * 20 + i * 200) % (canvas.width + 100)) - 50;
        const y = 50 + i * 40;
        drawCloud(x, y);
    }
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
    ctx.arc(x + 15, y + 10, 15, 0, Math.PI * 2);
    ctx.arc(x + 30, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function jump() {
    if (state.gameOver) {
        resetGame();
        return;
    }
    if (!state.gameStarted) return;
    state.bird.velocity = state.jumpForce;
}

function gameOver() {
    state.gameOver = true;
    controlsText.style.display = 'none';
}

function resetGame() {
    state.bird.y = 200;
    state.bird.velocity = 0;
    state.pipes = [];
    state.gameOver = false;
    state.score = 0;
    scoreElement.textContent = '0';
    startScreen.style.display = 'flex';
    state.gameStarted = false;
    controlsText.style.display = 'block';
}

function startGame() {
    state.gameStarted = true;
    startScreen.style.display = 'none';
}

// 事件监听
canvas.addEventListener('click', (e) => {
    e.preventDefault();
    if (!state.gameStarted && !state.gameOver) {
        startGame();
    }
    jump();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!state.gameStarted && !state.gameOver) {
        startGame();
    }
    jump();
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!state.gameStarted && !state.gameOver) {
            startGame();
        }
        jump();
    }
});

// 开始游戏循环
resetGame();
gameLoop();
