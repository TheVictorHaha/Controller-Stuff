var HID = require('node-hid');
var robot = require("robotjs");
//const { Input, Sequence, Button, Combo } = require("./Systems.js");

class Input {
    constructor(val, timeMade) {
        this.val = val;
        this.timeMade = timeMade;
    }

    setDelay(timeMade) {
        this.timeMade = timeMade;
    }
}

class Combo {
    constructor(holdTime) {
        this.holdTime = holdTime;
        this.combo = [];
    }

    add(val) {
        this.combo.push(new Input(val, new Date().getTime() / 1000));
    }

    check() {
        for (let i = 0; i < this.combo.length; i++) {
            if (new Date().getTime() / 1000 - this.combo[i].timeMade > this.holdTime) {
                this.combo.splice(i, 1);
                i--;
            }
        }
    }

    get order() {
        var res = "";
        for (let i = 0; i < this.combo.length; i++) {
            res += this.combo[i].val + " ";
        }
        return res;
    }

    contains(check) {
        return this.order.indexOf(check) != -1;
    }

    appearsLast(check1, check2) {
        if (!this.contains(check1) && !this.contains(check2)) return null;
        var ord = this.order();
        if (ord.indexOf(check1) > ord.indexOf(check2)) return check1;
        return check2;
    }

    remove(seq) {
        var res = "";
        var ind = this.order.indexOf(seq);
        seq += " ";
        seq = seq.split(" ");
        var start;
        for (let i = 0; i < this.combo.length; i++) {
            res += this.combo[i] + " ";
            if (res.length == ind) {
                start = i;
                break;
            }
        }
        for (let i = start + seq.length - 1; i >= start; i--) {
            this.combo.splice(i, 1);
        }
    }
}

class Button {

    constructor(port, val, hold, system) {
        this.port = port;
        this.val = val;
        this.trigger = false;
        this.hold = hold;
        system.addButton(this);
    }

    down(data) {
        if (this.hold) return getButton(this.port, data);
        if (getButton(this.port, data)) {
            if (!this.trigger) {
                this.trigger = true;
                return true;
            }
        } else {
            this.trigger = false;
        }
        return false;
    }

    held(data) {
        return getButton(this.port, data);
    }
}

class Sequence {
    constructor(seq, key, system) {
        this.sequence = seq;
        this.key = key;
        this.on = false;
        system.addSequence(this);
    }

    check(combo) {
        if (combo.contains(this.sequence)) {
            if (!this.on) {
                console.log(this.sequence);
                this.on = true;
                robot.keyToggle(this.key, "down");
            }
        } else {
            if (this.on) {
                this.on = false;
                robot.keyToggle(this.key, "up");
            }
        }
    }
}

class HoldSequence extends Sequence {
    constructor(seq, key, holdTime, system) {
        super(seq, key, system);
        this.holdTime = holdTime;
    }

    check(combo) {
        if (combo.contains(this.sequence)) {
            if (!this.on) {
                console.log(this.sequence);
                this.on = true;
                this.startTime = new Date.getTime() / 1000;
                robot.keyToggle(this.key, "down");
            }
            if ((new Date.getTime() / 1000) - this.startTime >= this.holdTime) {
                combo.remove(this.sequence);
            }
        } else {
            if (this.on) {
                this.on = false;
                robot.keyToggle(this.key, "up");
            }
        }
    }
}

class PressSequence extends Sequence {
    constructor(seq, key, holdTime, system) {
        super(seq, key, system);
        this.holdTime = holdTime;
    }

    check(combo) {
        if (combo.contains(this.sequence)) {
            robot.keyTap(this.key);
            combo.remove(this.sequence);
        }
    }
}

class System extends Combo {
    constructor(holdtime) {
        super(holdtime);
        this.sequences = [];
        this.buttons = [];
    }

    check(data) {
        super.check();
        this.buttons.forEach(button => {
            if (button.down(data)) this.add(button.val);
        })
        this.sequences.forEach(sequence => {
            sequence.check(this);
        })
        console.log(this.order);
    }

    addButton(button) {
        this.buttons.push(button);
    }

    addSequence(sequence) {
        this.sequences.push(sequence);
    }
}


var devices = HID.devices();
var test;
var found = false;

//change to work with any device :)
devices.forEach(s => {
    if (s.product == "MAYFLASH GameCube Controller Adapter" && !found) {
        test = s;
        found = true;
    }
})

const player = new System(0.25);
/*const p1 = new System(2);
const p2 = new System(2);*/

const UL = new Button(0, "UL", false, player);
const DL = new Button(1, "DL", false, player);
const UR = new Button(3, "UR", false, player);
const DR = new Button(2, "DR", false, player);

/*const w = new Sequence("UL UL", "w", p1);
//const s = new Sequence("DL DL", "s", p1);
const d = new Sequence("DL DL UL", "d", p1);
const a = new Sequence("DL DL DL", "a", p1);*/

const up = new Sequence("UL UR", "c", player);
const down = new Sequence("DL DR", "down", player);
const right = new Sequence("UR DR", "right", player);
const left = new Sequence("UL DL", "left", player);
const clock = new Sequence("UR DL", "x", player)
const cclock = new Sequence("UL DR", "z", player)

if (found) {
    var device = new HID.HID(test.path);
    var comb = new Combo(0.25);

    device.on("data", function (data) {
        var array = new Uint32Array(data);
        var num = array[1].toString(2);
        for (var i = num.length; i < 4; i++) {
            num = "0" + num;
        }
        player.check(num);
    });
}

function getButton(button, data) {
    if (data.charAt(button) == "1") {
        return true;
    }
    return false;
}