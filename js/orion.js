"use strict";

let debug = false;
let memPages = 16;
let scrW = 512;

let FRAME = 80000;
let REFRESH = 10;
let INT = 20;
let SEC = 1000;

var orion;

function Orion(memoryIO, CPU, keybrd, scr) {
    let run = function() {
        let scrMode = memoryIO.getPort(0xf800);
        let scrWW = memoryIO.getPort(0xfa00)&0x80 ? /*512*/480 : scrMode&0x80 ? 480 : 384;
        if (scrWW != scrW) {
            scrW = scrWW;
            scr.resizeCanvas(scrW);
        }
        let scrBase = 0xc000 - 0x4000*memoryIO.getPort(0xfa00);
        scr.redrawScreen(memoryIO, scrMode, scrBase);
        if(debug) {
            let kbdState = keybrd.getState();
            memoryIO.setPort(0xf401, kbdState.state[Math.trunc(Math.log2(255-Math.abs(memoryIO.getPort(0xf400))))]);
            memoryIO.setPort(0xf402, kbdState.modif);
            let ticks = CPU.run_instruction();
            let stateCpu = CPU.getState();
            drawDebug(ticks, stateCpu);
        } else {
            let ticks = 0;
            while (ticks < FRAME) {
                let kbdState = keybrd.getState();
                memoryIO.setPort(0xf401, kbdState.state[Math.trunc(Math.log2(255-Math.abs(memoryIO.getPort(0xf400))))]);
                memoryIO.setPort(0xf402, kbdState.modif);
                ticks += CPU.run_instruction();
            }
            let self = this;
            window.setTimeout(function() {self.run(); }, REFRESH);
        }
    }

    let loadROM = function(filename) {
        let cBack = function(img) {
            let file = {};
            file.image = img.Content;
            file.start = 0x0000;
            file.end = file.start + file.image.length - 1;
            memoryIO.load_mem(file);
        }
        GetBinaryFile(filename, cBack, true);
    }
    
    let loadROMD = function(filename) {
        let cBack = function(img) {
            let file = {};
            file.image = img.Content;
            file.start = 0x0000;
            file.end = file.start + file.image.length - 1;
            memoryIO.load_romd(file);
        }
        GetBinaryFile(filename, cBack, true);
    }

    let reset = function() {
        memoryIO.init(memPages);
        CPU.reset(0xf800);
        drawDebug(0, CPU.getState());
    }

    let debugging = function() {
        debug = !debug; 
        if (debug) {
            document.getElementById("deb").innerHTML = "Paused";
            document.getElementById("step").style.display = "inline";
            document.getElementById("info").style.display = "inline-block";
        }
        else {
            document.getElementById("deb").innerHTML = "Running...";
            document.getElementById("step").style.display = "none";
            document.getElementById("info").style.display = "none";
            let self = this;
            window.setTimeout(function() {self.run(); }, REFRESH);
        }    
    }

    let interrpt = function() {
        if (memoryIO.getIntrpt()) CPU.interrupt(false, 0xff);
        let self = this;
        window.setTimeout(function() {self.interrpt(); }, INT);
    }

    let clock = function() {
        let dt = new Date();
        memoryIO.setDateTimeVI512(dt.getSeconds(), dt.getMinutes(), dt.getHours(), dt.getDay()+1, dt.getDate(), dt.getMonth()+1, dt.getFullYear().toString().slice(-2));
        let self = this;
        window.setTimeout(function() {self.clock(); }, SEC);
    }

    let drawDebug = function(ticks, state) {
        let inner = ticks + " ";
        inner += ("000"+state.pc.toString(16).toUpperCase()).slice(-4) + " ";
        for (let i = 0; i < 4; i++) {
            inner += ("0"+memoryIO.mem_read(state.pc+i, memoryIO.getPort(0xf900)).toString(16).toUpperCase()).slice(-2) + " ";
        }
        for (let i = 0x0000; i < 0x0200; i++) {
            inner += i%16 ? "" : "<br>"+i.toString(16).toUpperCase()+": ";
            inner += ("0"+memoryIO.memRead(i, 1).toString(16).toUpperCase()).slice(-2) + " ";
        }
        document.getElementById("info").innerHTML = inner;
    }

    return {
        run,
        interrpt,
        loadROM,
        loadROMD,
        reset,
        debugging,
        clock
    }
}

function startup() {
    let memIO = new Memory(memPages);
    let cpu = new Z80(memIO);
    let keyb = new Keyboard();
    let screen = new Screen(scrW);
    orion = new Orion(memIO, cpu, keyb, screen);

    
//    orion.loadROM("bin/TEST256.BIN");
    orion.loadROM("bin/Orion128_M37.rom");
    orion.loadROMD("bin/romdisk8.bin");
    cpu.reset(0xf800);
    window.setTimeout(function() {orion.run(); }, 500);
    window.setTimeout(function() {orion.interrpt(); }, INT);
    window.setTimeout(function() {orion.clock(); }, SEC);

}