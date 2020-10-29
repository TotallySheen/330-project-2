import * as dat from './dat.gui.module.js';
import * as utils from './utils.js';
import * as audio from './audio.js';
import * as canvas from './canvas.js';
const DEFAULTS = Object.freeze({
	sound1  :  "media/Into the Doldrums.mp3"
});

const params = {
    showBars        : true,
    showImage       : true,
    showWaves       : true,
    showProgress    : true,
    showBezier      : false,
    song            : "media/Into the Doldrums.mp3",
    image           : "media/cd.png",
    showNoise       : false,
    noiseAmount     : 0.05,
    showEmboss      : false,
    colorFilter     : 'none',
    playing         : false,
    loopAudio       : false,
    pinch           : false,
    peak            : false,
    'play/pause'    : play,
    fullscreen      : goFullscreen,
    volume          : 50
}

let selectedTrack = undefined,selectedImg = undefined;

function init(){
    audio.setupWebaudio(DEFAULTS.sound1);
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
    mainParams.add(params, 'showProgress');
    mainParams.add(params, 'showBezier');
    let files = gui.addFolder("Files");
    let songController = files.add(params, 'song', {
        'Into the Doldrums': "media/Into the Doldrums.mp3",
        'Intruder Alert': "media/Intruder Alert.mp3",
        'Delfino Plaza': "media/Delfino Plaza.mp3",
        'Custom Song': "custom"});
    let imgController = files.add(params, 'image', {
        'CD':"media/cd.png",
        'Risk of Rain 2':"media/ror2.jpg",
        'Team Fortress 2':"media/tf2.jpg",
        'Super Mario':"media/mario.jpg",
        'Custom Image':"custom"});
    let bitmaps = gui.addFolder("Bitmap Effects");
    bitmaps.add(params, 'showNoise');
    bitmaps.add(params, 'noiseAmount',0,0.1);
    bitmaps.add(params, 'showEmboss');
    bitmaps.add(params, 'colorFilter', {'none':'none','invert':'invert','sepia':'sepia'});
    loopController.onChange(function(value){
        audio.setLoop(value);
    });
    let audios = gui.addFolder("Audio Effects");
    let pinch = audios.add(params, 'pinch');
    let peak = audios.add(params, 'peak');

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

    pinch.onChange(function(value){
        params.pinch = value;
        if (params.pinch){
            audio.filter1.frequency.value = 1000;
            audio.filter1.gain.value = 25;
        }
        else{
            audio.filter1.frequency.value = 0;
            audio.filter1.gain.value = 0;
        }
    });

    peak.onChange(function(value){
        params.peak = value;
        if (params.peak){
            audio.filter2.frequency.value = 1000;
            audio.filter2.gain.value = 25;
        }
        else{
            audio.filter2.frequency.value = 0;
            audio.filter2.gain.value = 0;
        }
    });
} // end setupUI

function loop(){
    requestAnimationFrame(loop);
    canvas.draw(params,audio.getProgress());
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