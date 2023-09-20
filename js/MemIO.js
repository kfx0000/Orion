function Memory(pages) {
    let mem = new Array(pages);
    let rom = new Array(0x800);
    let romd = new Array(0x100000);
    let iPorts = new Array(0x10000);
    let oPorts = new Array(0x10000);

    let dispatcher = new Array(8);
    // MZ   : dispatcher D7 = 0 -> on, 1 -> off
    // INT  : int D6 = 0 -> disabled, 1 -> enabled
    // XMEM : full RAM D5 = 1 -> full RAM, 0 -> upper ROM
    // RZRV : always 0
    // BS1  : RAM bank No (most bit)
    // BS0  : RAM bank No (least bit)
    // SS1  : RAM frame No (most bit)
    // SS0  : RAM frame No (least bit)

    let vi512 = {
        data : new Array(0x40),
        addr : 0x00
    // 0x00 : Secs
    // 0x01 : Secs Alarm
    // 0x02 : Mins
    // 0x03 : Mins Alarm
    // 0x04 : Hours
    // 0x05 : Hours Alarm
    // 0x06 : Day of week
    // 0x07 : Day
    // 0x08 : Month
    // 0x09 : Year
    // 0x0a .. 0x0d : Regs A-D
    // 0x0e .. 0x3f : Common RAM
    }
    

    let init = function(pg) {
        for (let j = 0; j < 0x10000; j++) {
            iPorts[j] = 0x00;
            oPorts[j] = 0x00;
        }
        for (let i = 0; i < pg; i++) {
            let curPage = new Array(0x10000);
            for (let j = 0; j < 0x10000; j++) curPage[j] = 0;
            mem[i] = curPage;
        }
        for (let i = 0; i <= 7; i++) dispatcher[i] = false;
    }

    let dispatch = function(flags) {
        let mask = 0x80;
        for (let i = 7; i >= 0; i--) {
            dispatcher[i] = ((flags & mask) != 0);
            mask = mask >>> 1;
        }
    }
    let memRead = function(addr, page) {
        addr &= 0xffff;
        if (dispatcher[7] || (addr >= 0x4000) || (page > 3)) {
            return mem[page&(pages-1)][addr] & 0xff;
        }
        else {
            let bank = 2*(dispatcher[3] ? 1 : 0) + (dispatcher[2] ? 1 : 0);
            let ssm = (dispatcher[1] ? 0x8000 : 0x0000)|(dispatcher[0] ? 0x4000 : 0x0000);
            return mem[bank][addr|ssm] & 0xff;
        }
    }
    let memWrite = function(addr, page, val) {
        addr &= 0xffff;
        if (dispatcher[7] || (addr >= 0x4000) || (page > 3)) mem[page&(pages-1)][addr] = val & 0xff;
        else {
            let bank = 2*(dispatcher[3] ? 1 : 0) + (dispatcher[2] ? 1 : 0);
            let ssm = (dispatcher[1] ? 0x8000 : 0x0000)|(dispatcher[0] ? 0x4000 : 0x0000);
            mem[bank][addr|ssm] = val & 0xff;
        }
    }
    let ioRead = function(port) {
        port &= 0xffff;
        return iPorts[port] & 0xff;
    }
    let ioWrite = function(port, val) {
        oPorts[port & 0xffff] = val & 0xff;
    }

    let mem_read = function(addr) {
        if (dispatcher[5]) return memRead(addr, oPorts[0xf900]);
        else {
            if ((addr & 0xff03) == 0xf500) return romdRead();
            else if ((addr & 0xffff) < 0xf000) return memRead(addr, oPorts[0xf900]);
            else if ((addr & 0xffff) < 0xf400) return memRead(addr, 0x00);
            else if ((addr & 0xffff) >= 0xf800) return rom[(addr & 0x07ff)];
            else if ((addr & 0xfffe) == 0xf760)  {
                if (addr & 0x0001) return vi512.data[vi512.addr];
                else return vi512.addr;
            }
            else return ioRead(addr & 0xff03);
        }
    }
    let mem_write = function(addr, val) {
        if (dispatcher[5]) memWrite(addr, oPorts[0xf900], val);
        else {
            if ((addr & 0xffff) >= 0xf400) {
                ioWrite((addr & 0xffff) >= 0xf800 ? addr&0xff00 : addr&0xff03, val);
                if ((addr & 0xffff) < 0xf800) setPort(addr&0xff03, val);
                if ((addr & 0xfffe) == 0xf760) {
                    if (addr & 0x0001) vi512.data[vi512.addr] = val & 0xff;
                    else vi512.addr = val & 0x3f;
                }
                if ((addr & 0xff00) == 0xfb00) {
                    setPort(0xfb00, val);
                    dispatch(val);
                }
            }
            else if((addr & 0xffff) < 0xf000) memWrite(addr, oPorts[0xf900], val);
            else memWrite(addr, 0x00, val);
        }
    }
    let io_read = function(port) {
        console.log(port.toString(16));
        //if(port == 0x0b) return 0xff; else
        return ioRead(port);
    }
    let io_write = function(port, val) {
        port = (port&0xff) * 0x100;
        if ((port & 0xffff) >= 0xf400) {
            ioWrite((port & 0xffff) >= 0xf800 ? port&0xff00 : port&0xff03, val);
            if((port & 0xff00) == 0xfb00) {
                setPort(0xfb00, val);
                dispatch(val);
            }
        } else ioWrite(port, val);
    }

    let load_mem = function(file) {
        for (let i = 0; i <= file.end; i++) {
            rom[i] = (file.image.charCodeAt(i - file.start))&0xff;
        }
    }
    let load_romd = function(file) {
        for (let i = file.start; i <= file.end; i++) {
          romd[i] = file.image.charCodeAt(i - file.start);
        }
    }

    let romdRead = function() {
        let addr = ((256*getPort(0xf502) + getPort(0xf501))&0xffff)+getPort(0xfe00)*0x10000;
        return romd[addr]&0xff;
    }

    let getPort = function(port) {
        return oPorts[port];
    }

    let setPort = function(port, val) {
        iPorts[port & 0xffff] = val & 0xff;
    }

    let getIntrpt = function() {
        return dispatcher[6];
    }

    let setDateTimeVI512 = function(secs, mins, hours, dow, day, month, year) {
        vi512.data[0] = secs;
        vi512.data[2] = mins;
        vi512.data[4] = hours;
        vi512.data[6] = dow;
        vi512.data[7] = day;
        vi512.data[8] = month;
        vi512.data[9] = year;
    }

    init(pages);
    return {
        mem_read,
        mem_write,
        io_read,
        io_write,
        load_mem,
        load_romd,
        memRead,
        getPort,
        setPort,
        getIntrpt,
        setDateTimeVI512,
        init
    }
}