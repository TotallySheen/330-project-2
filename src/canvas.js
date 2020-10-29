/*
	The purpose of this file is to take in the analyser node and a <canvas> element: 
	  - the module will create a drawing context that points at the <canvas> 
	  - it will store the reference to the analyser node
	  - in draw(), it will loop through the data in the analyser node
	  - and then draw something representative on the canvas
	  - maybe a better name for this file/module would be *visualizer.js* ?
*/

import * as utils from './utils.js';

let ctx,canvasWidth,canvasHeight,gradient,analyserNode,audioData,waveData;
const speedMult = 1 / 1000;
let image = new Image();
let doSpin = false;
let spin = Math.PI;
let progress = 0;

function setupCanvas(canvasElement,analyserNodeRef){
	// create drawing context
	ctx = canvasElement.getContext("2d");
	canvasWidth = canvasElement.width;
	canvasHeight = canvasElement.height;
	// keep a reference to the analyser node
	analyserNode = analyserNodeRef;
	// this is the array where the analyser data will be stored
    audioData = new Uint8Array(analyserNode.fftSize/2);
    waveData = new Uint8Array(analyserNode.fftSize/2);
}

function draw(params={},progress=0){
    // 1 - populate the audioData array with the frequency data from the analyserNode
	// notice these arrays are passed "by reference" 
	analyserNode.getByteFrequencyData(audioData);
	// OR
	analyserNode.getByteTimeDomainData(waveData); // waveform data
	
	// 2 - draw background
    ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha = 1;
    ctx.fillRect(0,0,canvasWidth,canvasHeight);
    ctx.restore();


    let avg = 0;
    for (let i = 0; i < audioData.length; i++)
    {
        avg += audioData[i];
    }
    avg /= audioData.length;
    
    // draw progress
    if (params.showProgress)
    {
        ctx.save();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(canvasWidth / 2, canvasHeight / 2,(avg + 35) * 2,-0.5 * Math.PI,-0.5 * Math.PI + (progress * 2 * Math.PI));
        ctx.stroke();
        ctx.restore();
    }

    if(params.showWaves){
        let radius = (avg + 30) * 2;
        ctx.save();
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = utils.getLinearGradient(ctx,0,0,0,canvasHeight,[{percent:0,color:"red"},{percent:.3,color:"orange"},{percent:.5,color:"yellow"},{percent:1,color:"lime"}]);
        ctx.beginPath();
        ctx.arc(canvasWidth / 2, canvasHeight / 2,radius,0,2 * Math.PI)
        ctx.clip();
        let sliceWidth = (2 * radius) / waveData.length;
        let x = (canvasWidth / 2) - radius;
        for (let i = 0; i < waveData.length; i+= 2)
        {
            let v = waveData[i] / 128.0;
            let y = v * radius;
            ctx.save();
            ctx.beginPath();
            ctx.rect(x,(canvasHeight / 2), sliceWidth, -Math.abs(-radius + y));
            ctx.rect(x,(canvasHeight / 2), sliceWidth,Math.abs(-radius + y));
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            x+= sliceWidth * 2;
        }
        ctx.restore();
    }

    if (params.showBezier && params.playing)
    {
        // drawing some interesting curves based on frequency and waveform
        let radius = (avg + 30) * 2;
        let sliceWidth = 2 * radius / audioData.length;
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 3;
        let start = {x: canvasWidth / 2, y: canvasHeight / 2 - radius};
        ctx.beginPath();
        ctx.moveTo(start.x, start.y)
        for (let i = 0; i < audioData.length; i+= 4)
        {
            
            let cp1 = {x: canvasWidth / 2 + 4 * audioData[i],y: canvasHeight / 2 - radius + (sliceWidth * (i + 1))};
            let cp2 = {x: canvasWidth / 2 - 4 * waveData[i],y: canvasHeight / 2 - radius + (sliceWidth * (i + 2))};
            let end = {x: canvasWidth / 2,y: canvasHeight / 2 - radius + (sliceWidth * (i + 3))};
            ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x,cp2.y,end.x,end.y);
        }
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }

	// 4 - draw bars
    if(params.showBars){
        let barSpacing = 4, margin = 5;
        let screenWidthForBars = canvasWidth - (audioData.length * barSpacing) - margin * 2;
        let barWidth = screenWidthForBars / audioData.length;
        let barHeight = 50, topSpacing = 100, radius = 100;

        radius = avg + 20; 

        ctx.save();
        ctx.fillStyle = 'darkslateblue';
        ctx.strokeStyle = 'darkslateblue';
        ctx.translate(canvasWidth / 2,canvasHeight / 2);
        for (let i = 0; i < audioData.length; i++)
        {
            ctx.save();
            ctx.rotate(spin);
            ctx.rotate((i / audioData.length) * 2 * Math.PI);
            ctx.translate(0,radius);
            ctx.fillRect(0,0,barWidth,barHeight + audioData[i] / 4);
            ctx.strokeRect(0,0,barWidth,barHeight + audioData[i] / 4);
            ctx.restore();
        }
        ctx.restore();
    }

    if(params.showImage){
        let radius = avg + 50;
        let imgDimension = Math.min(image.width, image.height);
        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.rotate(spin + Math.PI);
        ctx.beginPath();
        ctx.arc(0,0,radius,0,2*Math.PI,false);
        ctx.clip();
        ctx.drawImage(image,(image.width / 2) - (imgDimension / 2),(image.height / 2) - (imgDimension / 2),imgDimension,imgDimension, -radius,-radius,radius * 2,radius * 2);
        ctx.restore();
    }

    // 6 - bitmap manipulation
	// TODO: right now. we are looping though every pixel of the canvas (320,000 of them!), 
	// regardless of whether or not we are applying a pixel effect
	// At some point, refactor this code so that we are looping though the image data only if
	// it is necessary

	// A) grab all of the pixels on the canvas and put them in the `data` array
	// `imageData.data` is a `Uint8ClampedArray()` typed array that has 1.28 million elements!
	// the variable `data` below is a reference to that array 
    let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    let data = imageData.data;
    let length = data.length;
    let width = imageData.width;

	// B) Iterate through each pixel, stepping 4 elements at a time (which is the RGBA for 1 pixel)
    for (let i = 0; i < length; i += 4){
		// C) randomly change every 20th pixel to red
        if (params.showNoise && Math.random() < params.noiseAmount){
			// data[i] is the red channel
			// data[i+1] is the green channel
			// data[i+2] is the blue channel
			// data[i+3] is the alpha channel
			data[i] = data[i+1] = data[i+2] = 0; // zero out the red and green and blue channels
            data[i+2] = 255; // make the red channel 100% red
        } // end if
        if (params.colorFilter == "invert"){
            let red = data[i], green = data[i+1], blue = data[i+2];
            data[i] = 255-red;
            data[i+1] = 255-green;
            data[i+2] = 255-blue;
        }
    } // end for
    
    if (params.showEmboss){
        for (let i = 0; i < length; i++){
            if (i%4 == 3) continue; // skip alpha
            data[i] = 127 + 2*data[i] - data[i+4] - data [i+width*4];
        }
    }

    if (params.colorFilter == "sepia"){
        let density = 50;
        let rIntensity = (172 * density + 255 * (100 - density)) / 25500;
        let gIntensity = (122 * density + 255 * (100 - density)) / 25500;
        let bIntensity = (51 * density + 255 * (100 - density)) / 25500;
        for (let i = 0; i < data.length; i += 4) {
            let luma = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
             
            data[i] = Math.round(rIntensity * luma);
            data[i+1] = Math.round(gIntensity * luma);
            data[i+2] = Math.round(bIntensity * luma);
        }
    }
	
    // D) copy image data back to canvas
    ctx.putImageData(imageData, 0, 0);

    if (doSpin){
        spin += 2 * Math.PI * speedMult;
    }
}

function useImage(newImage){
    image = new Image();
    image.src = newImage;
}

function toggleSpin(value){
    doSpin = value;
}

function resetSpin(){
    spin = Math.PI;
}

export {setupCanvas,draw,useImage,toggleSpin,resetSpin};