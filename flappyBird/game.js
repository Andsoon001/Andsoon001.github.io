const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const controlsText = document.getElementById('controls');
const finalScoreElement = document.getElementById('final-score');
const highScoreElement = document.getElementById('high-score');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

let highScore = localStorage.getItem('highScore') || 0;
highScoreElement.textContent = highScore;

// 设置画布尺寸
function setupCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

setupCanvas();
window.addEventListener('resize', setupCanvas);

const state = {
    bird: {
        x: 80,
        y: 200,
        velocity: 0,
        width: 35,
        height: 35,
        color: '#FFD700'
    },
    gravity: 0.25,
    jumpForce: -5.5,
    pipes: [],
    score: 0,
    gameOver: false,
    gameStarted: false,
    pipeGap: 200,
    pipeWidth: 60,
    pipeSpacing: 280,
    pipeSpeed: 2,
    lastTime: 0,
    deltaTime: 0
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

function update(deltaTime) {
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

    drawClouds();
    
    // 绘制小鸟
    const birdRotation = state.bird.velocity * 0.1;
    ctx.save();
    ctx.translate(state.bird.x + state.bird.width/2, state.bird.y + state.bird.height/2);
    ctx.rotate(birdRotation);
    
    // 小鸟身体
    ctx.beginPath();
    ctx.arc(0, 0, state.bird.width/2, 0, Math.PI * 2);
    ctx.fillStyle = state.bird.color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 小鸟眼睛
    ctx.beginPath();
    ctx.arc(state.bird.width * 0.2, -state.bird.height * 0.1, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    ctx.restore();

    // 绘制管道
    state.pipes.forEach(pipe => {
        drawPipe(pipe.x, 0, state.pipeWidth, pipe.top, true);
        drawPipe(pipe.x, pipe.top + state.pipeGap, state.pipeWidth, 
            canvas.height - (pipe.top + state.pipeGap), false);
    });
}

function drawPipe(x, y, width, height, isTop) {
    // 管道主体
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, '#2ecc71');
    gradient.addColorStop(1, '#27ae60');
    
    ctx.fillStyle = gradient;
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

function gameLoop(timestamp) {
    state.deltaTime = timestamp - state.lastTime;
    state.lastTime = timestamp;

    update(state.deltaTime);
    draw();
    requestAnimationFrame(gameLoop);
}

function jump() {
    if (state.gameOver) return;
    if (!state.gameStarted) return;
    state.bird.velocity = state.jumpForce;
}

function gameOver() {
    state.gameOver = true;
    controlsText.style.display = 'none';
    gameOverScreen.style.display = 'flex';
    finalScoreElement.textContent = state.score;
    
    if (state.score > highScore) {
        highScore = state.score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
}

function resetGame() {
    state.bird.y = 200;
    state.bird.velocity = 0;
    state.pipes = [];
    state.gameOver = false;
    state.score = 0;
    scoreElement.textContent = '0';
    startScreen.style.display = 'flex';
    gameOverScreen.style.display = 'none';
    state.gameStarted = false;
    controlsText.style.display = 'block';
}

function startGame() {
    state.gameStarted = true;
    startScreen.style.display = 'none';
}

// 事件监听
function handleInteraction(e) {
    e.preventDefault();
    if (!state.gameStarted && !state.gameOver) {
        startGame();
    } else if (state.gameOver) {
        resetGame();
    } else {
        jump();
    }
}

canvas.addEventListener('click', handleInteraction);
canvas.addEventListener('touchstart', handleInteraction, { passive: false });
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handleInteraction(e);
    }
});

startButton.addEventListener('click', () => {
    startGame();
    jump();
});

restartButton.addEventListener('click', resetGame);

// 启动游戏
resetGame();
gameLoop(0);
