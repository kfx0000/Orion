function Keyboard() {
    const key_table = {
        36: [ 0, 0x01 ], //  \\  -> HOME
        35: [ 0, 0x02 ], // CTP  -> END
       304: [ 0, 0x04 ], // AP2  -> ALT-0
       305: [ 0, 0x08 ], //  Ф1 -> F1, 256 + 49
       306: [ 0, 0x10 ], //  Ф2 -> F2, 256 + 50
       307: [ 0, 0x20 ], //  Ф3 -> F3, 256 + 51
       308: [ 0, 0x40 ], //  Ф4 -> F4, 256 + 52

         9: [ 1, 0x01 ], // TAB
       269: [ 1, 0x02 ], //  ПС -> ALT-ENTER, 256 + 13
        13: [ 1, 0x04 ], //  BK -> ENTER
         8: [ 1, 0x08 ], //  ЗБ -> BS, 8
        37: [ 1, 0x10 ], //  <-
        38: [ 1, 0x20 ], //  UP
        39: [ 1, 0x40 ], //  ->
        40: [ 1, 0x80 ], //  DOWN

        48: [ 2, 0x01 ], //   0
        49: [ 2, 0x02 ], //   1
        50: [ 2, 0x04 ], //   2
        51: [ 2, 0x08 ], //   3
        52: [ 2, 0x10 ], //   4
        53: [ 2, 0x20 ], //   5
        54: [ 2, 0x40 ], //   6
        55: [ 2, 0x80 ], //   7

        56: [ 3, 0x01 ], //   8
        57: [ 3, 0x02 ], //   9
       312: [ 3, 0x04 ], //   : -> ALT-*, 256 + 56
       186: [ 3, 0x08 ], //   ;
       188: [ 3, 0x10 ], //   ,
       189: [ 3, 0x20 ], //   -
       190: [ 3, 0x40 ], //   .
       191: [ 3, 0x80 ], //   /

       447: [ 4, 0x01 ], //   @ -> ALT-/, 256 + 192 
        65: [ 4, 0x02 ], //   A
        66: [ 4, 0x04 ], //   B
        67: [ 4, 0x08 ], //   C
        68: [ 4, 0x10 ], //   D
        69: [ 4, 0x20 ], //   E
        70: [ 4, 0x40 ], //   F
        71: [ 4, 0x80 ], //   G

        72: [ 5, 0x01 ], //   H
        73: [ 5, 0x02 ], //   I
        74: [ 5, 0x04 ], //   J
        75: [ 5, 0x08 ], //   K
        76: [ 5, 0x10 ], //   L
        77: [ 5, 0x20 ], //   M
        78: [ 5, 0x40 ], //   N
        79: [ 5, 0x80 ], //   O

        80: [ 6, 0x01 ], //   P
        81: [ 6, 0x02 ], //   Q
        82: [ 6, 0x04 ], //   R
        83: [ 6, 0x08 ], //   S
        84: [ 6, 0x10 ], //   T
        85: [ 6, 0x20 ], //   U
        86: [ 6, 0x40 ], //   V
        87: [ 6, 0x80 ], //   W

        88: [ 7, 0x01 ], //   X
        89: [ 7, 0x02 ], //   Y
        90: [ 7, 0x04 ], //   Z
       219: [ 7, 0x08 ], //   [
       226: [ 7, 0x10 ], //   \ (back slash)
       221: [ 7, 0x20 ], //   ] 
       192: [ 7, 0x40 ], //   ^ -> `
        32: [ 7, 0x80 ], // SPC
    };

    const SS = 0x20;
    const US = 0x40;
    const RL = 0x80;

    let state = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
    let modif = 0xff;

    document.onkeydown = function(evt) {
        evt.preventDefault();
        let code = evt.keyCode + (evt.altKey ? 256 : 0);
        keydown(code);
    }
    
    document.onkeyup = function(evt) {
        evt.preventDefault();
        let code = evt.keyCode + (evt.altKey ? 256 : 0);
        keyup(code);
    }
    
    let keydown = function(code) {
        if (code == 16) modif &= ~SS; // SHIFT
        if (code == 17) modif &= ~US; // CTRL
        if (code == 27) modif &= ~RL; // ESC
        let key = key_table[code];
        if (key) state[key[0]] &= ~key[1];
    }
    
    let keyup = function(code) {
        if (code == 16) modif |= SS; // SHIFT
        if (code == 17) modif |= US; // CTRL
        if (code == 27) modif |= RL; // ESC
        let key = key_table[code];
        if (key) state[key[0]] |= key[1];
    }

    let getState = function() {
        return {state, modif};
    }

    return {
        getState
    }
    
}