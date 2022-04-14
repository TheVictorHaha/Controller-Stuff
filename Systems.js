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
}

class Button {

    constructor(port, val, hold) {
        this.port = port;
        this.val = val;
        this.trigger = false;
        this.hold = hold;
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
}

class Sequence {
    static seqs = [];
    static check(combo) {
        Sequence.seqs.forEach(s => {
            s.check(combo);
        })
    }
    constructor(seq, key) {
        this.sequence = seq;
        this.key = key;
        this.on = false;
        Sequence.seqs.push(this);
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

exports.Input = Input;
exports.Sequence = Sequence;
exports.Button = Button;
exports.Combo = Combo;