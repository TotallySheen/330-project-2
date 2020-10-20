/*
	main.js is primarily responsible for hooking up the UI to the rest of the application 
	and setting up the main event loop
*/

// We will write the functions in this file in the traditional ES5 way
// In this instance, we feel the code is more readable if written this way
// If you want to re-write these as ES6 arrow functions, to be consistent with the other files, go ahead!

import * as utils from './utils.js';
import * as audio from './audio.js';
import * as canvas from './canvas.js';

// 1 - here we are faking an enumeration
const DEFAULTS = Object.freeze({
	sound1  :  "media/New Adventure Theme.mp3"
});

const drawParams = {
    showBars        : true,
    showImage       : true,
    showNoise       : false,
    showInvert      : false,
    showEmboss      : false
}

let selectedTrack = undefined,selectedImg = undefined;
const reader = new FileReader();

function init(){
    audio.setupWebaudio(DEFAULTS.sound1);
    console.log("init called");
	console.log(`Testing utils.getRandomColor() import: ${utils.getRandomColor()}`);
	let canvasElement = document.querySelector("canvas"); // hookup <canvas> element
    setupUI(canvasElement);
    canvas.useImage(document.querySelector("#imgSelect").value);
    canvas.setupCanvas(canvasElement,audio.analyserNode);
    // set the gain
    audio.setVolume(localStorage.volume);
    // update the label
    volumeLabel.innerHTML = Math.round(localStorage.volume/2 * 100);
    volumeSlider.value = localStorage.volume;
    loop();
}

function setupUI(canvasElement){
    // A - hookup fullscreen button
    const fsButton = document.querySelector("#fsButton");
        
    // add .onclick event to button
    fsButton.onclick = e => {
        console.log("init called");
        utils.goFullscreen(canvasElement);
    };

    let playButton = document.querySelector("#playButton");
    playButton.onclick = e => {
        console.log(`audioCtx.state before = ${audio.audioCtx.state}`);

        // check if context is in suspended state (autoplay policy)
        if (audio.audioCtx.state == "suspended"){
            audio.audioCtx.resume();
        }
        console.log(`audioCtx.state after = ${audio.audioCtx.state}`);
        if (e.target.dataset.playing == "no"){
            // if track is paused, play it
            audio.playCurrentSound();
            canvas.toggleSpin(true);
            e.target.dataset.playing = "yes";
        }
        else{
            // if track is playing, pause it
            audio.pauseCurrentSound();
            canvas.toggleSpin(false);
            e.target.dataset.playing = "no";
        }
    }

    let volumeSlider = document.querySelector("#volumeSlider");
    let volumeLabel = document.querySelector("#volumeLabel");

    // add .oninput event to slider
    volumeSlider.oninput = e => {
        localStorage.volume = e.target.value;
        
        // set the gain
        audio.setVolume(localStorage.volume);
        // update the label
        volumeLabel.innerHTML = Math.round(localStorage.volume/2 * 100);
    }


    let trackSelect = document.querySelector("#trackSelect");
    let trackCustom = document.querySelector("#trackCustom");
    // add .onchange event

    trackCustom.onchange = e => {
        selectedTrack = URL.createObjectURL(e.target.files[0]);
        trackSelect.selectedIndex = 3;
        trackSelect.dispatchEvent(new Event("change"));
    }

    trackSelect.onchange = e => {
        if (e.target.value == "custom"){
            if (selectedTrack != undefined){
                audio.loadSoundFile(selectedTrack);
            }
        }
        else{
            audio.loadSoundFile(e.target.value);
        }
        // pause
        if (playButton.dataset.playing = "yes"){
            playButton.dispatchEvent(new MouseEvent("click"));
            canvas.resetSpin();
        }
    }


    let imgSelect = document.querySelector("#imgSelect");
    let imgCustom = document.querySelector("#imgCustom");

    imgCustom.onchange = e => {
        selectedImg = URL.createObjectURL(e.target.files[0]);
        imgSelect.selectedIndex = 3;
        imgSelect.dispatchEvent(new Event("change"));
    }

    imgSelect.onchange = e => {
        if (e.target.value == "custom"){
            if (selectedImg != undefined){
                canvas.useImage(selectedImg);
            }
        }
        else{
            canvas.useImage(e.target.value);
        }
    }

    // checkboxes
    let barsCB = document.querySelector("#barsCB");
    barsCB.checked = true;
    barsCB.onchange = e => {
        drawParams.showBars = e.target.checked;
        }

    let imageCB = document.querySelector("#imageCB");
    imageCB.checked  = true;
    imageCB.onchange = e => {
        drawParams.showImage = e.target.checked;
        }

    let noiseCB = document.querySelector("#noiseCB");
    noiseCB.checked = false;
    noiseCB.onchange = e => {
        drawParams.showNoise = e.target.checked;
        }

    let invertCB = document.querySelector("#invertCB");
    invertCB.checked = false;
    invertCB.onchange = e => {
        drawParams.showInvert = e.target.checked;
        }
    
    let embossCB = document.querySelector("#embossCB");
    embossCB.checked = false;
    embossCB.onchange = e => {
        drawParams.showEmboss = e.target.checked;
        }
        
	
} // end setupUI

function loop(){
    requestAnimationFrame(loop);
    
    canvas.draw(drawParams);
}

export {init};