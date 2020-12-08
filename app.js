var express = require('express');
var app = express();
var serv = require('http').Server(app);
var path = require('path');

//Initialization
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

app.use(express.static(path.join(__dirname, 'public')));


let port = process.env.PORT;
if (port == null || port == "") {
  port = 2020;
}
serv.listen(port); 

console.log("Server started");
//Creating list of players
var SOCKET_LIST = {};

/*
REMEMBER TO FIX BULLET GLITCH IN BULLET INIT
*/
//Shared info about entity's
var Entity = function (param) {
    var self = {
        x: 250,
        y: 250,
        spdX: 0,
        spdY: 0,
        id: "",
    }
    //if params are called set the values to that of the params
    if (param) {
        if (param.x)
            self.x = param.x;
        if (param.y)
            self.y = param.y;
        if (param.id)
            self.id = param.id;
    }
    self.update = function () {
        //Calls the function below
        self.updatePosition();
    }
    self.updatePosition = function () {
        //Updates position
        self.x += self.spdX;
        self.y += self.spdY;
    }
    self.getDistance = function (pt) {
        return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
    }
    //Calling this function will return information in list 'self'
    return self;

}




//Information about the player
var Player = function (param) {
    var self = Entity(param);
    self.number = param.number; //"" + Math.floor(10 * Math.random())
    self.team = Math.round(Math.random() * 3); //1 red 2 blue 3 yellow
    if (self.team == 0) self.team = 3;
    self.class = 0; //tbd
    self.powerup = "teleport";
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingShoot = false;
    self.pressingRightMouse = false;
    self.mouseAngle = 0;
    self.mouseX = 0;
    self.mouseY = 0;
    self.maxSpd = 2;
    self.hp = 100;
    self.hpMax = 100;
    self.hpCooldown = 0;
    self.score = 0; //kills
    self.coins = 0;
    //cooldown for powerup
    self.secondaryCooldown = 120;

    self.respawn = function () {
        if (self.team == 1) {
            self.y = 2750;
            self.x = (Math.random() - 0.5) * 3000;
        } else if (self.team == 2) {
            self.y = (Math.random() - 0.5) * 3000;
            self.x = (self.y + 2500) / -2;
        } else {
            self.y = (Math.random() - 0.5) * 3000;
            self.x = (self.y + 2500) / 2;
        }
    }

    self.respawn(); //spawn at start of game

    //Calls for update of positions
    var super_update = self.update;
    self.update = function () {
        self.updateSpd();
        self.canShootSecond();
        super_update();
        //gets collisions with other players
        for (let i in Player.list) {
            let p = Player.list[i];
            if (self.getDistance(p) < 45 && self.id !== p.id) {
                let distancex = self.x - p.x;
                let distancey = self.y - p.y;
                let length = Math.sqrt(distancex * distancex + distancey * distancey) || 1;
                let unitx = distancex / length;
                let unity = distancey / length;
                self.x = p.x + 45 * unitx;
                self.y = p.y + 45 * unity;
            }
        }
        for (let i in Barrier.list) {
            let p = Barrier.list[i];
            if (self.getDistance(p) < 72 && self.id !== p.id) {
                let distancex = self.x - p.x;
                let distancey = self.y - p.y;
                let length = Math.sqrt(distancex * distancex + distancey * distancey) || 1;
                let unitx = distancex / length;
                let unity = distancey / length;
                self.x = p.x + 72 * unitx;
                self.y = p.y + 72 * unity;
            }
        }
        /*collisions with the walls*/
        if (!(self.y > (2 * Math.abs(self.x) - 2950))) {
            if (self.x > 0) {
                self.x -= self.maxSpd;
                if (self.y < 2975)
                    self.y += self.maxSpd;

            } else {
                self.x += self.maxSpd;
                if (self.y < 2975)
                    self.y += self.maxSpd;
            }
        }
        if (self.y > 2975) {
            self.y -= self.maxSpd;
        }

        //Shoots bullets from player to mouseAngle
        if (self.pressingShoot) {
            self.shootBullet(self.mouseAngle + (Math.random() * 15) - 7.5);
        }
        if (self.pressingRightMouse) {

            var canShoot = self.canShootSecond();
            if (canShoot) {
                if (self.powerup === "circle") {

                    var angle = 0;
                    while (angle < 360) {
                        self.shootBullet(angle);
                        angle += 19;
                    }
                    self.secondaryCooldown = 0;

                }
                if (self.powerup === "teleport") {

                    self.x += self.mouseX;
                    self.y += self.mouseY;

                    self.secondaryCooldown = 0;

                }

            }
            //shoots three bullets:for(var i = -1; i<2;i++)
            //self.shootBullet(i*10 + self.mouseAngle);
        }

        if (self.hpCooldown > 0) {
            self.hpCooldown--;
        } else if (self.hpCooldown == 0 && self.hp < self.hpMax) {
            self.hp++;
        }
    }
    self.shootBullet = function (angle) {
        Bullet({
            parent: self.id,
            team: self.team,
            angle: angle,
            x: self.x,
            y: self.y,
        });
    }
    //Moves the player based on information recieved below
    self.updateSpd = function () {
        if (self.pressingRight)
            self.spdX = self.maxSpd;
        else if (self.pressingLeft)
            self.spdX = -self.maxSpd
        else
            self.spdX = 0;

        if (self.pressingUp)
            self.spdY = -self.maxSpd;
        else if (self.pressingDown)
            self.spdY = self.maxSpd
        else
            self.spdY = 0;
    }

    self.dropCoins = function () {
        let i = 0;
        while (i < self.coins) { //makes it so half coins spawn in map and half around dead player
            if (i % 2 == 0) {
                let distance = Math.random() * 50;
                let angle = Math.random() * 360;

                let x = Math.cos(angle / 180 * Math.PI) * distance;
                let y = Math.sin(angle / 180 * Math.PI) * distance;
                Coin({
                    x: self.x + x,
                    y: self.y + y,
                });
                i++; //probably a dumb idea
            } else {
                let distance = Math.random() * 1400;
                let angle = Math.random() * 360;

                let x = Math.cos(angle / 180 * Math.PI) * distance;
                let y = (Math.sin(angle / 180 * Math.PI) * distance) + 1100;

                const barrierWidth = 100;

                let insideBarrier = false;

                for (var e in Barrier.list) {
                    if (x > Barrier.list[e].x - barrierWidth / 2 && x < Barrier.list[e].x + barrierWidth / 2 && y > Barrier.list[e].y - barrierWidth / 2 && y < Barrier.list[e].y + barrierWidth / 2) {
                        insideBarrier = true;
                    }
                }

                if (!insideBarrier) {
                    Coin({
                        x: x,
                        y: y,
                    });
                    i++;
                }

            }
        }

        self.coins = 0;
    }

    self.canShootSecond = function () {
        if (self.secondaryCooldown > 120) { //cooldown time between powerups
            return true;
        } else {
            self.secondaryCooldown++;
            return false;
        }
    }
    //what we send to client at beginning of game
    self.getInitPack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            number: self.number,
            hp: self.hp,
            hpMax: self.hpMax,
            score: self.score,
            team: self.team,
            coins: self.coins
        };
    }
    //what we send to client every loop
    self.getUpdatePack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            number: self.number, //remove eventually, this is stupid
            hp: self.hp,
            score: self.score,
            coins: self.coins
        }
    }

    Player.list[param.id] = self;
    initPack.player.push(self.getInitPack());
    return self;
}
Player.list = {};
Player.onConnect = function (socket) {
    var player = Player({
        id: socket.id,
        number: socket.number
    });
    //Recieves input from client and changes variable state
    socket.on('keyPress', function (data) {
        if (data.inputId === 'left')
            player.pressingLeft = data.state;
        if (data.inputId === 'right')
            player.pressingRight = data.state;
        if (data.inputId === 'up')
            player.pressingUp = data.state;
        if (data.inputId === 'down')
            player.pressingDown = data.state;
        if (data.inputId === 'shoot1')
            player.pressingShoot = data.state;
        if (data.inputId === 'shoot2')
            player.pressingRightMouse = data.state;
        if (data.inputId === 'mouseAngle') {
            player.mouseAngle = data.state;
            player.mouseX = data.x;
            player.mouseY = data.y;
        }
    });

    socket.emit('init', {
        selfId: socket.id,
        player: Player.getAllInitPack(),
        bullet: Bullet.getAllInitPack(),
        barrier: Barrier.getAllInitPack(),
        coin: Coin.getAllInitPack(),
    })
}
Player.getAllInitPack = function () {
    var players = [];
    for (var i in Player.list)
        players.push(Player.list[i].getInitPack());
    return players;
}


Player.onDisconnect = function (socket) {
    if (Player.list[socket.id] !== undefined)
        Player.list[socket.id].dropCoins();
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}
Player.update = function () {
    var pack = [];
    for (var i in Player.list) {
        var player = Player.list[i];
        player.update();
        pack.push(player.getUpdatePack());
    }
    return pack;
}


//Controls the bullet
var Bullet = function (param) {
    var self = Entity(param);
    self.id = Math.random();
    self.angle = param.angle;
    self.spdX = Math.cos(param.angle / 180 * Math.PI) * 6; //6 default
    self.spdY = Math.sin(param.angle / 180 * Math.PI) * 6; //6
    self.parent = param.parent; //parent player
    self.team = param.team;
    self.timer = 0; //time to remove
    self.toRemove = false;
    var super_update = self.update;
    self.update = function () {
        if (self.timer++ > 100)
            self.toRemove = true;
        super_update();
        for (var i in Player.list) {
            let shooter = Player.list[self.parent];
            let p = Player.list[i];
            if (shooter != undefined) {
                if (self.getDistance(p) < 30 && shooter.team !== p.team) {

                    p.hp -= 4; //hitting enemy
                    p.hpCooldown = 600;

                    //killing enemy
                    if (p.hp <= 0) {
                        if (shooter)
                            shooter.score += 1;
                        //respawns in a different location with full health
                        p.hp = p.hpMax;
                        p.dropCoins();
                        p.respawn();
                        p.score = 0;
                        if (shooter.hp < 50) {
                            shooter.hp += 50;
                        } else {
                            shooter.hp += shooter.hpMax - shooter.hp;
                        }

                    }
                    self.toRemove = true;
                }
            }
        }
        //hitting a barrier
        for (var i in Barrier.list) {
            var p = Barrier.list[i];
            if (self.getDistance(p) < 50 && self.id !== p.id) {
                self.toRemove = true;
            }
        }
        //hitting another bullet
        /*
        for (var i in Bullet.list) {
            let shooter = Bullet.list[self.id];
            let p = Bullet.list[i];
            if (shooter != undefined) {
                if (self.getDistance(p) < 10 && shooter.team !== p.team) {
                    self.toRemove = true;
                    p.toRemove = true;
                }
            }
            
        }
        */
    }

    self.getInitPack = function () {
        return {
            id: self.id,
            team:self.team,
            x: self.x,
            y: self.y,
        };
    }
    self.getUpdatePack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
        };
    }
    Bullet.list[self.id] = self;
    initPack.bullet.push(self.getInitPack());
    return self;
}

Bullet.list = {};
//Information about bullet
Bullet.update = function () {
    var pack = [];
    for (var i in Bullet.list) {
        var bullet = Bullet.list[i];
        bullet.update();
        if (bullet.toRemove === true) {
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id);
        }
        pack.push(bullet.getUpdatePack());
    }
    return pack;
}

Bullet.getAllInitPack = function () {
    var bullets = [];
    for (var i in Bullet.list)
        bullets.push(Bullet.list[i].getInitPack());
    return bullets;

}

var Barrier = function (param) {
    var self = {};
    self.x = param.x;
    self.y = param.y;
    self.id = Math.random();

    self.getInitPack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
        };
    }
    Barrier.list[self.id] = self;
    initPack.barrier.push(self.getInitPack());
    return self;
}

Barrier.list = {};

Barrier.getAllInitPack = function () {
    var barriers = [];
    for (var i in Barrier.list)
        barriers.push(Barrier.list[i].getInitPack());
    return barriers;
}

var Coin = function (param) {
    var self = Entity(param);
    self.id = Math.random();
    self.toRemove = false;

    self.update = function () {
        for (let i in Player.list) {
            let p = Player.list[i];
            if (self.getDistance(p) < 60) {
                let angle = Math.atan2((self.y - p.y), (self.x - p.x));
                let x = Math.cos(angle)*3; 
                let y = Math.sin(angle)*3; 
                self.x-=x;
                self.y-=y;
                if (self.getDistance(p) < 30) {
                    self.toRemove = true;
                    p.coins++;
                }
            }
        }
    }

    self.getInitPack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y
        }
    }

    self.getUpdatePack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y
        }
    }

    Coin.list[self.id] = self;
    initPack.coin.push(self.getInitPack());
    return self;
}

Coin.list = {};

Coin.getAllInitPack = function () {
    var coins = [];
    for (var i in Coin.list)
        coins.push(Coin.list[i].getInitPack());
    return coins;
}

Coin.update = function () {
    var pack = [];
    for (var i in Coin.list) {
        var coin = Coin.list[i];
        coin.update();
        if (coin.toRemove === true) {
            delete Coin.list[i];
            removePack.coin.push(coin.id);
        }
        pack.push(coin.getUpdatePack());
    }
    return pack;
}


var DEBUG = true;


var io = require('socket.io')(serv, {});
//What to do when a player connects
io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    socket.number = '';
    // not needed? socket.number = "" + Math.floor(10 * Math.random());
    SOCKET_LIST[socket.id] = socket;

    socket.on('signIn', function (data) {
        //possible profanity filter eventually using for function and x replacing 'fuck'
        if (data.username.indexOf('fuck') > -1) {
            socket.emit('signInResponse', {
                success: false
            });
        } else if (data.username === '') {
            socket.emit('signInResponse', {
                success: true
            });
            socket.emit('addToChat', "Welcome Guest!");
            socket.number = "Guest " + socket.id.toString().slice(2, 4);
            Player.onConnect(socket);
        } else if (data.username.length > 12) {
            socket.emit('signInResponse', {
                success: false
            });
        } else {
            socket.emit('signInResponse', {
                success: true
            });
            socket.emit('addToChat', "Welcome " + data.username + "!");
            socket.number = data.username;
            Player.onConnect(socket);
        }
    });

    //What to do if a player disconnects
    socket.on('disconnect', function () {
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });
    socket.on('sendMsgToServer', function (data) {
        let playerName = ("" + socket.number);
        for (var i in SOCKET_LIST) {
            if (data.length <= 120) {
                SOCKET_LIST[i].emit("addToChat", "<span id='playerName'>" + playerName + ":" + "</span>" + "<span id='playerMessage'>" + data + "</span>");
            } else {
                SOCKET_LIST[i].emit("addToChat", "<span id='playerName'>" + playerName + ":" + "</span>" + "<span id='playerMessage'>" + data.slice(0, 120) + "</span>");
            }
        }
    });
    socket.on('evalServer', function (data) {
        if (!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer', res);
    });
});

//Runs 25 times per second, at all times
//This will send information to the client 
var initPack = {
    player: [],
    bullet: [],
    barrier: [],
    coin: []
};
var removePack = {
    player: [],
    bullet: [],
    coin: []
};


setInterval(function () {
    var pack = {
        player: Player.update(),
        bullet: Bullet.update(),
        coin: Coin.update(),
    }
    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('init', initPack);
        socket.emit('update', pack);
        socket.emit('remove', removePack);
    }
    initPack.player = [];
    initPack.bullet = [];
    initPack.barrier = [];
    initPack.coin = [];
    removePack.player = [];
    removePack.bullet = [];
    removePack.coin = [];
}, 1000 / 60);

var spawnBarriers = function () {
    for (let i = 0; i < 500; i++) {

        let y = (Math.random() - 0.5) * 5000;
        let x = (Math.random() - 0.5) * 5000;

        if (y - 50 > (2 * Math.abs(x) - 2000 - 50)) {
            Barrier({
                x: x,
                y: y,
            });
        }


    }

}

var spawnCoins = function () {
    let i = 0;

    while (i < 300) {
        let distance = Math.random() * 1400;
        let angle = Math.random() * 360;

        let x = Math.cos(angle / 180 * Math.PI) * distance;
        let y = (Math.sin(angle / 180 * Math.PI) * distance) + 1100;

        const barrierWidth = 100;

        let insideBarrier = false;

        for (var e in Barrier.list) {
            if (x > Barrier.list[e].x - barrierWidth / 2 && x < Barrier.list[e].x + barrierWidth / 2 && y > Barrier.list[e].y - barrierWidth / 2 && y < Barrier.list[e].y + barrierWidth / 2) {
                insideBarrier = true;
            }
        }

        if (!insideBarrier) {
            Coin({
                x: x,
                y: y,
            });
            i++; //this is sketch as fuck, probably bad idea
        }
    }

}

spawnBarriers();
spawnCoins();

console.log("Map created")
