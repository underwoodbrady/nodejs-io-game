var socket = io();

const partcanvas = document.getElementById("homectx"); //canvas on sign in
const ctx2 = partcanvas.getContext("2d");

let mouseX;
let mouseY;
let mouseIsPressed;
let interval = 100; // used to set different intervals that the ones used in setInterval (currently used for updateLeaderboard();)


const canvas = document.getElementById("gamectx"); //canvas for the main game (character, bullets, map, score ect.)
let WIDTH = 500; //Default width of screen adjusts to browser upon start of game
let HEIGHT = 500; //Default height of screen adjusts to browser upon start of game

const chatDiv = document.getElementById('chat-div');
const chatText = document.getElementById('chat-text');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');
const closeBtn = document.getElementById('closebtn');
const openBtn = document.getElementById('openbtn');
const signInBackround = document.getElementById('signInBackround');
const ctx = canvas.getContext("2d");

const marker = document.getElementById("marker"); //minimap marker


closeBtn.onclick = function () { //when you close chat shrinks down
    chatDiv.style.transition = "width 0.6s, height 0.4s"
    chatDiv.style.width = "55px";
    chatDiv.style.height = "40px";
    chatText.style.display = "none";
    chatForm.style.display = "none";
    closeBtn.style.display = "none";
    openBtn.style.display = "inline-block";
}

openBtn.onclick = function () {
    chatDiv.style.transition = "0s"
    chatDiv.style.width = "400px";
    chatDiv.style.height = "150px";
    chatText.style.width = "calc(100% - 30px)";
    chatText.style.display = "inline-block";
    chatForm.style.display = "inline-block";
    closeBtn.style.display = "inline-block";
    openBtn.style.display = "none";
}

ctx.font = '30px Arial';


//Modifying the size of canvas to fit clients browser
let resizeCanvas = function () {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    partcanvas.width = WIDTH;
    partcanvas.height = HEIGHT;
    ctx.font = '30px Arial';
}

resizeCanvas();

//If size of window is adjusted
window.addEventListener('resize', function () {
    resizeCanvas();
    createParticles();
});

function Particle(x, y) {
    this.x = x;
    this.y = y;
    this.xs = Math.random() - 0.5;
    this.ys = (Math.random() + 0.5) * 1.5;
    this.color = [155 + (Math.random() * 100), 155 + (Math.random() * 100), 155 + (Math.random() * 100)];
    this.size = 1 + (this.ys * 20);
}

Particle.prototype.update = function () {
    this.x += this.xs;
    this.y += this.ys;
    if (this.y > HEIGHT + this.size)
        this.y = -this.size;
    if (this.x > WIDTH + this.size)
        this.x = 0 - this.size;
    if (this.x < 0 - this.size)
        this.x = WIDTH + this.size;
}

Particle.prototype.draw = function () {
    ctx2.beginPath();
    ctx2.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx2.closePath();
    ctx2.fillStyle = 'rgba(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ', 0.8)';
    ctx2.fill();
    ctx2.beginPath();
    ctx2.arc(this.x, this.y, this.size * 2, 0, 2 * Math.PI);
    ctx2.closePath();
    ctx2.fillStyle = 'rgba(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ', 0.1)';
    ctx2.fill();
}



let createParticles = function () {
    particles = [];
    for (let i = 0; i < Math.max(WIDTH / 2, HEIGHT / 2); i++) {
        let newParticle = new Particle(Math.random() * WIDTH, Math.random() * HEIGHT);
        particles.push(newParticle);
    }
}

let drawParticles = function () {
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
}

createParticles();


//Making the chat div auto scroll when new text is added
const observer = new MutationObserver(scrollToBottom);
let config = {
    childList: true
};
observer.observe(chatText, config);

function animateScroll(duration) {
    let start = chatText.scrollTop;
    let end = chatText.scrollHeight;
    let change = end - start;
    let increment = 20;

    function easeInOut(currentTime, start, change, duration) {
        currentTime /= duration / 2;
        if (currentTime < 1) {
            return change / 2 * currentTime * currentTime + start;
        }
        currentTime -= 1;
        return -change / 2 * (currentTime * (currentTime - 2) - 1) + start;
    }

    function animate(elapsedTime) {
        elapsedTime += increment;
        let position = easeInOut(elapsedTime, start, change, duration);
        chatText.scrollTop = position;
        if (elapsedTime < duration) {
            setTimeout(function () {
                animate(elapsedTime);
            }, increment)
        }
    }
    animate(0);
}

function scrollToBottom() {
    const duration = 300 // how many milliseconds for scroll to last
    animateScroll(duration);
}

updateLeaderboard = function () {
    let elements = []
    let container = document.querySelector('#leaderboard')
    // Add each row to the array
    container.querySelectorAll('.row').forEach(el => elements.push(el))
    // Clear the container + Add header
    container.innerHTML = '<h3 style="margin-top:0px;margin-bottom:10px;color:white;text-align:center;">Leaderboard </h1>'
    // Sort the array from highest to lowest
    elements.sort((a, b) => b.querySelector('.score').textContent - a.querySelector('.score').textContent)
    // Put the elements back into the container
    elements.forEach(e => container.appendChild(e))

}

//start
const signDiv = document.getElementById('signDiv');
const signDivUsername = document.getElementById('signDiv-username');
const signDivSignUp = document.getElementById('signDiv-start');

signDivSignUp.onclick = function () {
    socket.emit('signIn', {
        username: signDivUsername.value
    });
}

socket.on('signInResponse', function (data) {
    if (data.success) {
        signDiv.style.display = 'none';
        signInBackround.style.display = 'none';
        gameDiv.style.display = 'inline-block';
    } else
        alert("Sign in unsuccessful. Make sure your username does not contain any bad words");
});


//recieves chat messages and adds to div called 'chat-text' above
socket.on('addToChat', function (data) {
    chatText.innerHTML += '<div id="chat-message">' + data + '</div>';
    scrollToBottom();
});

socket.on('evalAnswer', function (data) {
    console.log(data);
});

chatForm.onsubmit = function (e) {
    e.preventDefault();
    if (chatInput.value[0] === '/')
        socket.emit('evalServer', chatInput.value.slice(1));
    else if (chatInput.value === '')
        return
    else
        socket.emit('sendMsgToServer', chatInput.value);
    chatInput.value = '';
}

//game  
const Img = {};
Img.redPlayer = new Image();
Img.redPlayer.src = '/client/img/red-player.png';
Img.bluePlayer = new Image();
Img.bluePlayer.src = '/client/img/blue-player.png';
Img.yellowPlayer = new Image();
Img.yellowPlayer.src = '/client/img/yellow-player.png';
Img.redBullet = new Image();
Img.redBullet.src = '/client/img/red-bullet.png';
Img.blueBullet = new Image();
Img.blueBullet.src = '/client/img/blue-bullet.png';
Img.yellowBullet = new Image();
Img.yellowBullet.src = '/client/img/yellow-bullet.png';
Img.barrier = new Image();
Img.barrier.src = '/client/img/barrier.png';
Img.coin = new Image();
Img.coin.src = '/client/img/coin.png';
Img.triangle = new Image();
Img.triangle.src = '/client/img/grey-triangle.png';
Img.RedTriangle = new Image();
Img.RedTriangle.src = '/client/img/red-triangle.png';
Img.BlueTriangle = new Image();
Img.BlueTriangle.src = '/client/img/blue-triangle.png';
Img.YellowTriangle = new Image();
Img.YellowTriangle.src = '/client/img/yellow-triangle.png';


let Player = function (initPack) {
    let self = {};
    self.id = initPack.id;
    self.number = initPack.number;
    self.x = initPack.x;
    self.y = initPack.y;
    self.hp = initPack.hp;
    self.hpMax = initPack.hpMax;
    self.score = initPack.score;
    self.secondaryCool = initPack.secondaryCool; //fortestingmightremovelater
    self.team = initPack.team;
    self.coins = initPack.coins;


    if (self.team == 1) //1 red 2 blue 3 yellow
        self.image = Img.redPlayer;
    else if (self.team == 2)
        self.image = Img.bluePlayer;
    else
        self.image = Img.yellowPlayer; //default 


    //what is drawn for player
    self.draw = function () {
        let x = self.x - Player.list[selfId].x + WIDTH / 2;
        let y = self.y - Player.list[selfId].y + HEIGHT / 2;

        if (self.hp !== self.hpMax) {
            let hpWidth = 40 * self.hp / self.hpMax;
            ctx.fillStyle = 'rgb(50,50,50)'; //*self.hp/self.hpMax
            ctx.fillRect(x - 20 - 1, y + 30 - 1, 40 + 2, 4 + 2);
            ctx.fillStyle = 'rgb(115,240,124)'; //*self.hp/self.hpMax
            ctx.fillRect(x - 20, y + 30, hpWidth, 4);
        }
        ctx.font = '15px Ubuntu';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'black';
        ctx.fillText(self.number, x, y - 30);
        let width = self.image.width / 2;
        let height = self.image.height / 2;

        ctx.drawImage(self.image,
            0, 0, self.image.width, self.image.height,
            x - width / 2, y - height / 2, width, height);

        ctx.fillStyle = "#000000";
    }

    Player.list[self.id] = self;
    return self;
}

Player.list = {};

let Bullet = function (initPack) {
    let self = {};
    self.id = initPack.id;
    self.x = initPack.x;
    self.y = initPack.y;
    self.team = initPack.team;

    if (self.team == 1) //1 red 2 blue 3 yellow
        self.image = Img.redBullet;
    else if (self.team == 2)
        self.image = Img.blueBullet;
    else
        self.image = Img.yellowBullet;

    //what is draw for bullets
    self.draw = function () {
        let width = self.image.width / 1.5;
        let height = self.image.height / 1.5;

        let x = self.x - Player.list[selfId].x + WIDTH / 2;
        let y = self.y - Player.list[selfId].y + HEIGHT / 2;

        if (x + width > 0 && x - width < WIDTH && y + height > 0 && y - height < HEIGHT) {
            ctx.drawImage(self.image,
                0, 0, self.image.width, self.image.height,
                x - width / 2, y - height / 2, width, height);
        }
    }

    Bullet.list[self.id] = self;
    return self;
}
Bullet.list = {};

let Barrier = function (initPack) {
    let self = {};
    self.id = initPack.id;
    self.x = initPack.x;
    self.y = initPack.y;

    self.draw = function () {
        let width = Img.barrier.width / 2;
        let height = Img.barrier.height / 2;

        let x = self.x - Player.list[selfId].x + WIDTH / 2;
        let y = self.y - Player.list[selfId].y + HEIGHT / 2;

        if (x + width > 0 && x - width < WIDTH && y + height > 0 && y - height < HEIGHT) {
            ctx.drawImage(Img.barrier,
                0, 0, Img.barrier.width, Img.barrier.height,
                x - width / 2, y - height / 2, width, height);
        }

    }
    Barrier.list[self.id] = self;
    return self;
}
Barrier.list = {};

let Coin = function (initPack) {
    let self = {}
    self.id = initPack.id;
    self.x = initPack.x;
    self.y = initPack.y;

    self.draw = function () {
        let width = Img.coin.width / 4;
        let height = Img.coin.height / 4;

        let x = self.x - Player.list[selfId].x + WIDTH / 2;
        let y = self.y - Player.list[selfId].y + HEIGHT / 2;

        if (x + width > 0 && x - width < WIDTH && y + height > 0 && y - height < HEIGHT) {
            ctx.drawImage(Img.coin,
                0, 0, Img.coin.width, Img.coin.height,
                x - width / 2, y - height / 2, width, height);
        }


    }
    Coin.list[self.id] = self;
    return self;
}

Coin.list = {};


var selfId = null;

socket.on('init', function (data) {
    if (data.selfId)
        selfId = data.selfId;
    for (var i = 0; i < data.player.length; i++) {
        new Player(data.player[i]);
    }
    for (var i = 0; i < data.bullet.length; i++) {
        new Bullet(data.bullet[i]);
    }
    for (var i = 0; i < data.barrier.length; i++) {
        new Barrier(data.barrier[i]);
    }
    for (var i = 0; i < data.coin.length; i++) {
        new Coin(data.coin[i]);
    }
});

socket.on('update', function (data) {

    interval += 1;

    let container = document.querySelector('#leaderboard');

    if (interval > 100)
        container.innerHTML = '<h3 style="margin-top:0px;margin-bottom:10px;color:white;text-align:center;">Leaderboard </h1>';


    for (var i = 0; i < data.player.length; i++) {
        let pack = data.player[i];
        let p = Player.list[pack.id];

        if (interval > 100) {

            container.innerHTML += '<div class="row"> <div class="username">' + pack.number + '</div><div class="score">' + pack.score + '</div> </div>';

            updateLeaderboard();
        }

        if (p) {
            if (pack.x !== undefined)
                p.x = pack.x;
            if (pack.y !== undefined)
                p.y = pack.y;
            if (pack.secondaryCool !== undefined)
                p.secondaryCool = pack.secondaryCool; //fortestingmightremovelater
            if (pack.team !== undefined)
                p.team = pack.team;
            if (pack.hp !== undefined)
                p.hp = pack.hp;
            if (pack.score !== undefined)
                p.score = pack.score;
            if (pack.coins !== undefined)
                p.coins = pack.coins;
        }
    }

    if (interval > 100)
        interval = 0;


    for (var i = 0; i < data.bullet.length; i++) {
        let pack = data.bullet[i];
        let b = Bullet.list[data.bullet[i].id];
        if (b) {
            if (pack.x !== undefined)
                b.x = pack.x;
            if (pack.y !== undefined)
                b.y = pack.y;
        }
    }
    for (var i = 0; i < data.coin.length; i++) {
        let pack = data.coin[i];
        let c = Coin.list[data.coin[i].id];
        if (c) {
            if (pack.x !== undefined)
                c.x = pack.x;
            if (pack.y !== undefined)
                c.y = pack.y;
        }
    }
});

socket.on('remove', function (data) {
    for (let i = 0; i < data.player.length; i++) {
        delete Player.list[data.player[i]];
    }
    for (let i = 0; i < data.bullet.length; i++) {
        delete Bullet.list[data.bullet[i]];
    }
    for (let i = 0; i < data.coin.length; i++) {
        delete Coin.list[data.coin[i]];
    }
});
//recieves new position from server and places player called 25 times a second
//draws player
setInterval(function () {
    if (!selfId) {
        ctx2.clearRect(0, 0, WIDTH, HEIGHT);
        drawParticles();
        return;
    }
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "rgb(215,215,215)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawMap();
    for (let i in Coin.list)
        Coin.list[i].draw();
    for (let i in Bullet.list)
        Bullet.list[i].draw();
    for (let i in Player.list)
        Player.list[i].draw();
    for (let i in Barrier.list)
        Barrier.list[i].draw();
    drawCords();
    updateMinimap();
}, 1000 / 40);

//*** Everything to do with map***//

function Triangle(x, y, even, type) {
    this.x = x;
    this.y = y;
    this.width = triWidth;
    this.height = triHeight;
    this.even = even;

    if (type === 1) {
        this.type = Img.triangle;
    } else if (type === 2) {
        this.type = Img.RedTriangle;
    } else if (type === 3) {
        this.type = Img.BlueTriangle;
    } else if (type === 4) {
        this.type = Img.YellowTriangle;
    } else {
        this.type = Img.CornerTriangle;
    }
}

let triangles = [];

const sizey = 60;
const triWidth = 100;
const triHeight = 100;

let initializeTriangles = function () {

    for (var e = 1; e < sizey + 1; e++) {

        for (var i = 1; i < e * 2; i++) {
            //
            let x = (i * (triWidth / 2) - e * (triHeight / 2)) + (triWidth / 2); //position of triangle +width of screen divided by two- width of triangle over 2 - players position

            let y = (e * triHeight) + (triHeight / 2);

            if (i % 2 == 0) {


                if (e >= sizey - 4 && i < 12) {

                    triangles.push(new Triangle(x - 50, y - 3100, true, 3)); //corners left

                } else if (e >= sizey - 4 && i > e * 2 - 12) {

                    triangles.push(new Triangle(x - 50, y - 3100, true, 2)); //corners right

                } else if (i < 12 && i > e * 2 - 12) {

                    triangles.push(new Triangle(x - 50, y - 3100, true, 4)); //corners top

                } else if (e >= sizey - 4 && i >= 12 && i <= e * 2 - 12) {

                    triangles.push(new Triangle(x - 50, y - 3100, true, 2)); //red bottom

                } else if (i < 12 && e < sizey - 4 && i <= e * 2 - 12) {

                    triangles.push(new Triangle(x - 50, y - 3100, true, 3)); //blue left

                } else if (i > e * 2 - 12 && e < sizey - 4 && i >= 12) {

                    triangles.push(new Triangle(x - 50, y - 3100, true, 4)); //yellow right

                } else {

                    triangles.push(new Triangle(x - 50, y - 3100, true, 1)); //middle

                }

            } else {


                if (e >= sizey - 4 && i < 10) {

                    triangles.push(new Triangle(x - 50, y - 3100, false, 3)); //corners left

                } else if (e >= sizey - 4 && i > e * 2 - 10) {

                    triangles.push(new Triangle(x - 50, y - 3100, false, 2)); //corners right

                } else if (i < 10 && i > e * 2 - 10) {

                    triangles.push(new Triangle(x - 50, y - 3100, false, 4)); //corners top

                } else if (e >= sizey - 4 && i >= 10 && i <= e * 2 - 10) {

                    triangles.push(new Triangle(x - 50, y - 3100, false, 2)); //red bottom

                } else if (i < 10 && e < sizey - 4 && i <= e * 2 - 10) {

                    triangles.push(new Triangle(x - 50, y - 3100, false, 3)); //blue left

                } else if (i > e * 2 - 10 && e < sizey - 4 && i >= 10) {

                    triangles.push(new Triangle(x - 50, y - 3100, false, 4)); //yellow right

                } else {

                    triangles.push(new Triangle(x - 50, y - 3100, false, 1)); //middle

                }

            }
        }
    }
}

initializeTriangles();

let drawMap = function () {

    let playX = Player.list[selfId].x;
    let playY = Player.list[selfId].y;

    let x = WIDTH / 2 - playX;
    let y = HEIGHT / 2 - playY;

    for (var i = 0; i < triangles.length; i++) {

        ctx.save();
        ctx.beginPath();
        if (triangles[i].x > -WIDTH / 2 + playX - 100 && triangles[i].x < WIDTH / 2 + playX + 100 && triangles[i].y > -WIDTH / 2 - 100 + playY && triangles[i].y < HEIGHT / 2 + playY + 100) {

            if (triangles[i].even === true) {

                ctx.translate(triangles[i].x, triangles[i].y);
                ctx.rotate(Math.PI);

                ctx.drawImage(triangles[i].type,
                    0, 0, Img.triangle.width, Img.triangle.height,
                    -triangles[i].width / 2 - WIDTH / 2 + playX, -triangles[i].height / 2 - HEIGHT / 2 + playY, triangles[i].width, triangles[i].height);

            } else {

                ctx.translate(triangles[i].x, triangles[i].y);

                ctx.drawImage(triangles[i].type,
                    0, 0, Img.triangle.width, Img.triangle.height,
                    -triangles[i].width / 2 + WIDTH / 2 - playX, -triangles[i].height / 2 + HEIGHT / 2 - playY, triangles[i].width, triangles[i].height);


            }

        }
        ctx.restore();

    }

}

let drawCords = function () {
    ctx.fillStyle = 'black';
    ctx.fillText("X: " + Math.round(Player.list[selfId].x), WIDTH - 50, HEIGHT - 200);
    ctx.fillText("Y: " + Math.round(Player.list[selfId].y), WIDTH - 50, HEIGHT - 180);
    ctx.fillText("Coins: " + Player.list[selfId].coins, WIDTH - 50, HEIGHT - 220);

}

let updateMinimap = function () {
    if (interval % 2 == 0) {
        marker.style.left = (Player.list[selfId].x + 2950) / 6000 * 150 - 2.5 + "px";
        marker.style.top = (Player.list[selfId].y - 3100) / 6000 * 150 + 147.5 + "px";
    }

}

//tests for keyboard input
document.onkeydown = function (event) {
    if (event.keyCode === 68) //d
        socket.emit('keyPress', {
            inputId: 'right',
            state: true
        });
    else if (event.keyCode === 83) //s
        socket.emit('keyPress', {
            inputId: 'down',
            state: true
        });
    else if (event.keyCode === 65) //a
        socket.emit('keyPress', {
            inputId: 'left',
            state: true
        });
    else if (event.keyCode === 87) //w
        socket.emit('keyPress', {
            inputId: 'up',
            state: true
        });
}
document.onkeyup = function (event) {
    if (event.keyCode === 68) //d
        socket.emit('keyPress', {
            inputId: 'right',
            state: false
        });
    else if (event.keyCode === 83) //s
        socket.emit('keyPress', {
            inputId: 'down',
            state: false
        });
    else if (event.keyCode === 65) //a
        socket.emit('keyPress', {
            inputId: 'left',
            state: false
        });
    else if (event.keyCode === 87) //w
        socket.emit('keyPress', {
            inputId: 'up',
            state: false
        });
}
//right or left click both work currently gets whether mouse is clicked and sends to server
document.onmousedown = function (event) {
    //shoot instead of attack
    mouseIsPressed = true;
    if (event.button === 2)
        socket.emit('keyPress', {
            inputId: 'shoot2',
            state: true
        });
    else
        socket.emit('keyPress', {
            inputId: 'shoot1',
            state: true
        });
}

document.onmouseup = function (event) {
    mouseIsPressed = false;
    socket.emit('keyPress', {
        inputId: 'shoot1',
        state: false
    });
    socket.emit('keyPress', {
        inputId: 'shoot2',
        state: false
    });

}
//gets position of mouse and sends it to server
document.onmousemove = function (event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
    var x = -WIDTH / 2 + mouseX;
    var y = -HEIGHT / 2 + mouseY;
    var angle = Math.atan2(y, x) / Math.PI * 180;
    socket.emit('keyPress', {
        inputId: 'mouseAngle',
        state: angle,
        x: x,
        y: y
    }); //send mouse and as well as mouse x and y to server
}

document.oncontextmenu = function (event) {
    event.preventDefault();
}
