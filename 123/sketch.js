// 用來儲存所有飄浮圓形物件的陣列
let bubbles = []; 
// 用來儲存爆破後產生的小粒子 (星星碎片)
let particles = []; 

// *** 遊戲狀態變數 ***
let score = 0; // 得分分數
const FIXED_TEXT = "414730043"; // 左上角固定文字
const TEXT_COLOR = '#eb6424'; // 文字顏色 (32px)

// *** 音效變數與狀態追蹤 ***
let popSound;
let audioStarted = false; // 追蹤音效是否已啟動

// 氣球主體使用的藍色色碼，已加入 #ffc2d1 作為得分目標
const BUBBLE_COLORS = [
    '#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8', 
    '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8',
    '#ffc2d1' // <-- 已更新：這是加分氣球的顏色 (淺粉色/淺紅色)
];

// 星星碎片的青綠色/水藍色系色碼
const PARTICLE_COLORS = [
    '#07beb8', '#3dccc7', '#68d8d6', '#9ceaef', '#c4fff9' 
];

// 設定背景顏色
const BACKGROUND_COLOR = '#ade8f4';

// *** P5.js 專用的資源預載函數：載入音效 ***
function preload() {
    // 使用安全載入音效，避免因檔名含空格或伺服器問題導致錯誤中斷
    // ----------------------------------------------------
    // *** 確認：音效路徑已設為 'assets/crispetascayendo-34733 (1).mp3' ***
    // ----------------------------------------------------
    const path = 'assets/crispetascayendo-34733 (1).mp3';
    popSound = null;
    loadSound(
        path,
        (s) => { popSound = s; console.log('popSound loaded'); },
        (err) => { console.warn('popSound load failed:', err); popSound = null; }
    );
}

function setup() {
    // 建立全螢幕畫布
    createCanvas(windowWidth, windowHeight);
    
    // 啟用 RGBA 顏色模式：R, G, B (0-255), Alpha (0-255)
    colorMode(RGB, 255, 255, 255, 255); 
    noStroke();
    
    // 初始化多個圓形
    for (let i = 0; i < 30; i++) {
        bubbles.push(new Bubble(random(width), height + random(500))); 
    }
}

function draw() {
    // 固定背景顏色
    background(BACKGROUND_COLOR); 
    
    // 1. 繪製並移動所有圓形 (Bubble)
    for (let i = bubbles.length - 1; i >= 0; i--) {
        let b = bubbles[i];
        
        b.move();
        
        // 氣球不再隨機爆破
        if (b.isOffScreen()) {
            bubbles.splice(i, 1);
            bubbles.push(new Bubble(random(width), height + random(50)));
        }
        
        b.display();
    }
    
    // 2. 繪製並更新所有粒子 (Particle)
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        p.display(); 
        
        // 如果粒子消失，則從陣列中移除
        if (p.isFinished()) {
            particles.splice(i, 1);
        }
    }
    
    // 3. *** 繪製遊戲資訊 (HUD) ***
    textSize(32);
    fill(TEXT_COLOR);
    noStroke();
    
    // 左上角固定文字
    textAlign(LEFT, CENTER);
    text(FIXED_TEXT, 20, 40);
    
    // 右上角得分
    textAlign(RIGHT, CENTER);
    text('得分: ' + score, width - 20, 40);
    
    // *** 顯示聲音開關提示文字 ***
    if (!audioStarted) {
        // 當音效未啟動時，顯示提示
        textAlign(CENTER, CENTER);
        text('點擊畫面開啟音效 (Click to Enable Sound)', width / 2, height / 2);
    }
}

// *** 處理使用者點擊事件：用於啟動音效和爆破氣球 ***
function mousePressed() {
    // 1. 啟動音效
    if (!audioStarted) {
        userStartAudio(); 
        audioStarted = true; 
        // 即使音效已啟動，也繼續檢查是否有氣球被點擊
    }
    
    // 2. 檢查氣球點擊
    for (let i = bubbles.length - 1; i >= 0; i--) {
        let b = bubbles[i];
        
        if (b.isClicked(mouseX, mouseY)) {
            
            // A. 更新分數邏輯
            // ----------------------------------------------------
            // *** 修正點：比對顏色已從 #ffca3a 改為 #ffc2d1 ***
            // ----------------------------------------------------
            if (b.hexColor === '#ffc2d1') { 
                score += 1; // 加分氣球
            } else {
                score -= 1; // 扣分氣球
            }

            // B. 爆破效果 (音效和粒子)
            b.pop(particles);

            // C. 移除舊氣球並新增一個新的氣球
            bubbles.splice(i, 1);
            bubbles.push(new Bubble(random(width), height + random(50))); 
            
            // 每次點擊只處理一個氣球
            return; 
        }
    }
}

// 處理視窗大小變動
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// ----------------------------------------
// 通用函數
// ----------------------------------------

/**
 * 繪製一個星星
 */
function drawStar(x, y, radius, points = 5) {
    let innerRadius = radius * 0.4; 
    let angle = TWO_PI / points;
    let halfAngle = angle / 2.0;
    
    push();
    translate(x, y);
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
        let sx = cos(a) * radius;
        let sy = sin(a) * radius;
        vertex(sx, sy);
        
        sx = cos(a + halfAngle) * innerRadius;
        sy = sin(a + halfAngle) * innerRadius;
        vertex(sx, sy);
    }
    endShape(CLOSE);
    pop();
}

/**
 * 隨機生成顏色陣列中的一個顏色，並帶有隨機透明度
 */
function getRandomColorAndAlpha(colorArray, minAlpha, maxAlpha) {
    let hexColor = random(colorArray); 
    // 將 hex 顏色字串儲存，用於之後的比對計分
    let c = color(hexColor); 
    let alpha = random(minAlpha, maxAlpha); 
    c.setAlpha(alpha); 
    return { hex: hexColor, p5Color: c };
}


// ----------------------------------------
// Bubble 圓形類別
// ----------------------------------------

class Bubble {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.d = random(50, 200); 
        this.r = this.d / 2;      
        
        // 使用新的顏色生成函數，同時儲存 hex 字串和 p5 顏色物件
        let colors = getRandomColorAndAlpha(BUBBLE_COLORS, 50, 200);
        this.hexColor = colors.hex; // <-- 用於計分比對
        this.color = colors.p5Color; // <-- 用於顯示
        
        this.starColor = getRandomColorAndAlpha(BUBBLE_COLORS, 150, 255).p5Color; 
        
        this.yoff = random(1000); 
        this.speed = random(0.5, 2); 

        // 移除隨機爆破的相關屬性 (maxLife, lifeCounter, popChance)
    }

    move() {
        this.y -= this.speed;
        let sway = map(noise(this.yoff), 0, 1, -1, 1);
        this.x += sway * 0.5; 
        this.yoff += 0.01;
    }

    // *** 氣球不再自動爆破，此函數恆為 false ***
    shouldPopAutomatically() {
        return false; 
    }
    
    /**
     * 檢查滑鼠點擊座標 (px, py) 是否在氣球範圍內
     */
    isClicked(px, py) {
        let distance = dist(px, py, this.x, this.y);
        return distance < this.r;
    }

    display() {
        fill(this.color);
        circle(this.x, this.y, this.d); 
        
        noStroke();
        fill(this.starColor);
        
        let starRadius = this.d / 10; 
        
        let offsetX = this.r * 0.5;
        let offsetY = -this.r * 0.5;
        
        drawStar(this.x + offsetX, this.y + offsetY, starRadius, 5); 
    }
    
    pop(particleArray) {
        // *** 播放音效 ***
        if (audioStarted && popSound && !popSound.isPlaying()) {
            // 每次播放前先停止，確保音效能立即播放
            popSound.stop(); 
            popSound.play();
        }
        
        let numParticles = floor(map(this.d, 50, 200, 20, 50)); 
        
        for (let i = 0; i < numParticles; i++) {
            let p = new Particle(this.x, this.y); 
            particleArray.push(p);
        }
    }

    isOffScreen() {
        return this.y < -this.r; 
    }
}

// ----------------------------------------
// Particle 粒子類別 (不變)
// ----------------------------------------

class Particle {
    constructor(x, y) { 
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D(); 
        this.vel.mult(random(2, 6));     
        this.acc = createVector(0, 0.08); 
        
        this.starRadius = random(4, 8); 
        this.life = 255;       
        
        // 顏色需要從 getRandomColorAndAlpha 的回傳物件中取出 p5Color
        this.color = getRandomColorAndAlpha(PARTICLE_COLORS, 255, 255).p5Color;
    }
    
    update() {
        this.vel.add(this.acc); 
        this.pos.add(this.vel); 
        this.life -= 8;         
        
        this.color.setAlpha(this.life);
    }
    
    display() {
        fill(this.color);
        drawStar(this.pos.x, this.pos.y, this.starRadius, 5); 
    }
    
    isFinished() {
        return this.life < 0;
    }
}