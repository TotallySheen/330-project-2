/*
	The purpose of this file is to take in the analyser node and a <canvas> element: 
	  - the module will create a drawing context that points at the <canvas> 
	  - it will store the reference to the analyser node
	  - in draw(), it will loop through the data in the analyser node
	  - and then draw something representative on the canvas
	  - maybe a better name for this file/module would be *visualizer.js* ?
*/

import * as utils from './utils.js';

let ctx,canvasWidth,canvasHeight,gradient,analyserNode,audioData;
const speedMult = 1 / 1000;
let image = new Image();
let doSpin = false;
let spin = Math.PI

function setupCanvas(canvasElement,analyserNodeRef){
	// create drawing context
	ctx = canvasElement.getContext("2d");
	canvasWidth = canvasElement.width;
	canvasHeight = canvasElement.height;
	// create a gradient that runs top to bottom
	gradient = utils.getLinearGradient(ctx,0,0,0,canvasHeight,[{percent:0,color:"lime"},{percent:.15,color:"green"},{percent:.3,color:"red"},{percent:1,color:"pink"}]);
	// keep a reference to the analyser node
	analyserNode = analyserNodeRef;
	// this is the array where the analyser data will be stored
	audioData = new Uint8Array(analyserNode.fftSize/2);
}

function draw(params={}){
    // 1 - populate the audioData array with the frequency data from the analyserNode
	// notice these arrays are passed "by reference" 
	analyserNode.getByteFrequencyData(audioData);
	// OR
	//analyserNode.getByteTimeDomainData(audioData); // waveform data
	
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
	
	// 4 - draw bars
    if(params.showBars){
        let barSpacing = 4, margin = 5;
        let screenWidthForBars = canvasWidth - (audioData.length * barSpacing) - margin * 2;
        let barWidth = screenWidthForBars / audioData.length;
        let barHeight = 75, topSpacing = 100, radius = 100;

        radius = avg + 20; 

        ctx.save();
        ctx.fillStyle = 'rgb(46,26,71)';
        ctx.strokeStyle = 'rgb(46,26,71)';
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
    
	// 5 - draw circles
	if(params.showCircles){
        let maxRadius = canvasHeight / 4;
        ctx.save();
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < audioData.length; i++){
            // redish
            let percent = audioData[i] / 255;

            let circleRadius = percent * maxRadius;

            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = utils.makeColor(255, 111, 111, 0.34 - percent/3.0);
            ctx.arc(canvasWidth/2, canvasHeight/2, circleRadius, 0, 2*Math.PI, false);
            ctx.fill();
            ctx.closePath();
            ctx.restore();

            // blueish
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = utils.makeColor(0, 0, 255, 0.1 - percent/10.0);
            ctx.arc(canvasWidth / 2, canvasHeight / 2, circleRadius * 1.5, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
            ctx.restore();

            // yellowish
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = utils.makeColor(200, 200, 0, 0.5 - percent/5.0);
            ctx.arc(canvasWidth / 2, canvasHeight / 2, circleRadius * 0.5, 0, 2*Math.PI, false);
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        }
        ctx.restore();
    }

    if(params.showImage){
        let radius = avg + 50;
        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.rotate(spin + Math.PI);
        ctx.beginPath();
        ctx.arc(0,0,radius,0,2*Math.PI,false);
        ctx.clip();
        ctx.drawImage(image,-radius,-radius,radius * 2,radius * 2);
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
        if (params.showNoise && Math.random() < 0.05){
			// data[i] is the red channel
			// data[i+1] is the green channel
			// data[i+2] is the blue channel
			// data[i+3] is the alpha channel
			data[i] = data[i+1] = data[i+2] = 0; // zero out the red and green and blue channels
            data[i+2] = 255; // make the red channel 100% red
        } // end if
        if (params.showInvert){
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