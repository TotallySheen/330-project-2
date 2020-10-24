/*
	main.js is primarily responsible for hooking up the UI to the rest of the application 
	and setting up the main event loop
*/

// We will write the functions in this file in the traditional ES5 way
// In this instance, we feel the code is more readable if written this way
// If you want to re-write these as ES6 arrow functions, to be consistent with the other files, go ahead!

import * as dat from './dat.gui.module.js';
import * as utils from './utils.js';
import * as audio from './audio.js';
import * as canvas from './canvas.js';

// 1 - here we are faking an enumeration
const DEFAULTS = Object.freeze({
	sound1  :  "media/New Adventure Theme.mp3"
});

const params = {
    showBars        : true,
    showImage       : true,
    showWaves       : true,
    song            : "media/New Adventure Theme.mp3",
    image           : "media/cd.png",
    showNoise       : false,
    showInvert      : false,
    showEmboss      : false,
    playing         : false,
    loopAudio       : false,
    'play/pause'    : play,
    fullscreen      : goFullscreen,
    volume          : 50
}

let selectedTrack = undefined,selectedImg = undefined;

function init(){
    audio.setupWebaudio(DEFAULTS.sound1);
    console.log("init called");
	console.log(`Testing utils.getRandomColor() import: ${utils.getRandomColor()}`);
	let canvasElement = document.querySelector("canvas"); // hookup <canvas> element
    setupUI(canvasElement);
    canvas.useImage(params.image);
    canvas.setupCanvas(canvasElement,audio.analyserNode);
    loop();
}

function setupUI(canvasElement){
    
    let gui = new dat.GUI();
    let controls = gui.addFolder("Controls");
    controls.add(params, 'play/pause');
    controls.add(params, 'fullscreen');
    // set the stored gain
    try{
        audio.setVolume(localStorage.volume/50);
        params.volume = Math.round(localStorage.volume);
        }
    catch(err){}
    let volumeController = controls.add(params, 'volume',0,100);
    let loopController = controls.add(params, 'loopAudio');
    controls.open();
    let mainParams = gui.addFolder("Main Features");
    mainParams.add(params, 'showBars');
    mainParams.add(params, 'showImage');
    mainParams.add(params, 'showWaves');
    let files = gui.addFolder("Files");
    let songController = files.add(params, 'song', {
        'New Adventure Theme': "media/New Adventure Theme.mp3",
        'Peanuts Theme': "media/Peanuts Theme.mp3",
        'The Picard Song': "media/The Picard Song.mp3",
        'Custom Song': "custom"});
    let imgController = files.add(params, 'image', {
        'CD':"media/cd.png",
        'Peanuts':"media/peanuts.png",
        'Picard':"media/picard.png",
        'Custom Image':"custom"});
    let bitmaps = gui.addFolder("Bitmap Effects");
    bitmaps.add(params, 'showNoise');
    bitmaps.add(params, 'showInvert');
    bitmaps.add(params, 'showEmboss');
    
    loopController.onChange(function(value){
        audio.setLoop(value);
    });

    volumeController.onChange(function(value){
        localStorage.volume = value;
        
        audio.setVolume(localStorage.volume/50);
        params.volume = Math.round(localStorage.volume);
    });


    let trackCustom = document.querySelector("#trackCustom");
    // add .onchange event

    trackCustom.onchange = e => {
        selectedTrack = URL.createObjectURL(e.target.files[0]);
        if (selectedTrack != undefined){
            audio.loadSoundFile(selectedTrack);
        }
        // pause
        if (params.playing = true){
            play();
            canvas.resetSpin();
        }
    }

    songController.onChange(function(value) {
        console.log(value);
        if (value == "custom"){
            trackCustom.click();
        }
        else{
            audio.loadSoundFile(value);
        }
        // pause
        if (params.playing = true){
            play();
            canvas.resetSpin();
        }
    });


    let imgCustom = document.querySelector("#imgCustom");

    imgCustom.onchange = e => {
        selectedImg = URL.createObjectURL(e.target.files[0]);
        if (selectedImg != undefined){
            canvas.useImage(selectedImg);
        }
    }

    imgController.onChange(function(value) {
        if (value == "custom"){
            imgCustom.click();
        }
        else{
            canvas.useImage(value);
        }
    });
} // end setupUI

function loop(){
    requestAnimationFrame(loop);
    canvas.draw(params);
}

function play(){
    // check if context is in suspended state (autoplay policy)
    if (audio.audioCtx.state == "suspended"){
        audio.audioCtx.resume();
    }
    if (params.playing == false){
        // if track is paused, play it
        audio.playCurrentSound();
        canvas.toggleSpin(true);
        params.playing = true;

    }
    else{
        // if track is playing, pause it
        audio.pauseCurrentSound();
        canvas.toggleSpin(false);
        params.playing = false;
    }
}

function goFullscreen(){
    utils.goFullscreen(document.querySelector("canvas"));
}

export {init};