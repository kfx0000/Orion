function Screen(screenWidth) {

    let screenHeight = 256;
    let canvas = document.getElementById("orion");
    let mainFrame = document.getElementById("mainframe");
    let ctx = canvas.getContext("2d");
    let canvasData = ctx.getImageData(0, 0, screenWidth, screenHeight);
    let scrSize = 0;


    let resizeCanvas = function(width) {
        canvas.width = width;
        canvas.height = screenHeight;
    
        mainFrame.width = width + 4;
        mainFrame.height = screenHeight + 4;

        if (width == 480) scrSize = 0x3c00; 
        else if (width == 512) scrSize = 0x4000;
        else scrSize = 0x3000;
    }

    let drawPixel = function(x, y, r, g, b, a) {
        let idx = (x + y * screenWidth) * 4;
    
        canvasData.data[idx + 0] = r;
        canvasData.data[idx + 1] = g;
        canvasData.data[idx + 2] = b;
        canvasData.data[idx + 3] = a;
    }
    
    let updateCanvas = function() {
        ctx.putImageData(canvasData, 0, 0);
    }

    let redrawScreen = function(memio, screenMode, screenBase) {
        screenMode &= 0x07;
        if(screenMode < 4) {
            let red = 0x00;
            let grn = 0x00;
            let blu = 0x00;
            let dot = 0x00;
            for (let i = 0; i < scrSize; i++) {
                let scrb = memio.memRead(screenBase + i, 0x00);
                for (let j = 0; j < 8; j++) {
                    let x = (Math.trunc(i/256))*8+j;
                    let y = i&0x00ff;
                    if (screenMode < 2) {
                        dot = scrb&(2**(7-j))?0xff:0x00;
                        red = screenMode == 1? dot : 0x00;
                        grn = screenMode == 1? 0xff : dot;
                        blu = screenMode == 1? dot? 0x00:0xff : 0x00;
                    }
                    drawPixel(x, y, red, grn, blu, 0xff);
                }
            }
        } else if(screenMode == 4 || screenMode == 5) {
            for (let i = 0; i < scrSize; i++) {
                let scrb0 = memio.memRead(screenBase + i, 0x00);
                let scrb1 = memio.memRead(screenBase + i, 0x01);
                for (let j = 0; j < 8; j++) {
                    let x = (Math.trunc(i/256))*8+j;
                    let y = i&0x00ff;
                    let dot0 = scrb0&(2**(7-j))? 1 : 0;
                    let dot1 = scrb1&(2**(7-j))? 1 : 0;
                    let red = 0x00; let grn = 0x00; let blu = 0x00;
                    if(screenMode == 4) {
                        red = !dot0&&dot1 ? 0xff : 0x00;
                        grn = dot0&&!dot1 ? 0xff : 0x00;
                        blu = dot0&&dot1 ? 0xff : 0x00;
                    } else {
                        if(!dot0&&dot1) {red = 0xff; grn = 0xff; blu = 0xff;} else
                        if(dot0&&!dot1) {red = 0xff; grn = 0xff; blu = 0x00;} else
                        if (dot0&&dot1) {red = 0xff; grn = 0x00; blu = 0xff;} else 
                                        {red = 0x00; grn = 0xff; blu = 0xff;}
                    }
                    drawPixel(x, y, red, grn, blu, 0xff);
                }
            }
        } else if(screenMode == 6 || screenMode == 7) {
                for (let i = 0; i < scrSize; i++) {
                let scrb0 = memio.memRead(screenBase + i, 0x00);
                let scrb1 = memio.memRead(screenBase + i, 0x01);
                for (let j = 0; j < 8; j++) {
                    let x = (Math.trunc(i/256))*8+j;
                    let y = i&0x00ff;
                    let dot = scrb0&(2**(7-j))? 1 : 0;
                    let red = dot? scrb1&0x04 ? 0xff:0x00 : scrb1&0x40 ? 0xff:0x00;
                    let grn = dot? scrb1&0x02 ? 0xff:0x00 : scrb1&0x20 ? 0xff:0x00;
                    let blu = dot? scrb1&0x01 ? 0xff:0x00 : scrb1&0x10 ? 0xff:0x00;
                    let alp = dot? scrb1&0x08 ? 0xff:0x7f : scrb1&0x80 ? 0xff:0x7f;
                    drawPixel(x, y, red, grn, blu, alp);
                }
            }       
        }
        updateCanvas();
    }

    resizeCanvas(screenWidth);


    return {
        resizeCanvas,
        redrawScreen
    }
}