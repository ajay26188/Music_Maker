document.addEventListener('DOMContentLoaded',function() {

    //Defining instrument's categories
    const instrumentCategories = {
        Bass: "Basses",
        Drum: "Drums",
        Piano: "Strings",
        Silence: "Special",
        StrangeBeat: "Special",
        Violin: "Strings"
    }

    // Array for mp3 samples, items are object having file source and name
    const samples = []


    //Function to load audio samples and get their durations
    function loadSample(src, name) {
        const audio = new Audio(src);
        audio.addEventListener('loadedmetadata',function() {
            const duration = audio.duration;
            samples.push({src, name, duration, audio });
            updateSampleButtons();
        })
    }

    //loading audio samples
    loadSample("bass.mp3", "Bass");
    loadSample("drum.mp3",  "Drum");
    loadSample("piano.mp3", "Piano");
    loadSample("silence.mp3", "Silence");
    loadSample("strange-beat.mp3", "StrangeBeat");
    loadSample("violin.mp3", "Violin");


    // 2D array of tracks – so one track can have multiple samples in a row
    let tracks = []
    tracks.push([])
    tracks.push([])
    tracks.push([])
    tracks.push([])


    // Let's add these tracks to HTML page, so that user can see them
    const tracksDiv = document.getElementById("tracks")
    for(let i = 0; i < tracks.length; i++) {
        let trackDiv = document.createElement("div")
        trackDiv.setAttribute("id", "trackDiv" + i)
        let trackDivHeader = document.createElement("h2")
        trackDivHeader.innerText = "Track " + (i + 1)
        trackDiv.appendChild(trackDivHeader)
        tracksDiv.appendChild(trackDiv)

        //User can delete tracks
        const deleteTrackButton = document.createElement("button");
        deleteTrackButton.innerText = "Delete Track";
        deleteTrackButton.addEventListener("click",() => {
            const trackNumber = trackDiv.id.replace("trackDiv", "");
            //Removing the track and its div
            tracks.splice(trackNumber,1);
            tracksDiv.removeChild(trackDiv);
            updateSampleButtons();
        });
        trackDiv.appendChild(deleteTrackButton);
    }

    //Function to populate the instrument category select box
    function populateCategorySelect() {
        const categorySelect = document.getElementById("categorySelect");
        const categories = Array.from(new Set(Object.values(instrumentCategories)));
        categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.text = category;
            categorySelect.appendChild(option);
        });
    }

    // Adding the sample buttons to the page, each sample will generate its own button
    function updateSampleButtons() {
        const categorySelect = document.getElementById("categorySelect");
        const selectedCategory = categorySelect.value;
        const addButtons = document.getElementById("addButtons");

        addButtons.innerHTML = "";

        samples.forEach((sample, index) => {
            if (instrumentCategories[sample.name] === selectedCategory) {
                const newButton = document.createElement("button")
                newButton.setAttribute("data-id", index)
                newButton.setAttribute("draggable", "true"); //Making the buttons draggable
                newButton.innerText = `${sample.name} (${sample.duration.toFixed(2)}s)`;
                //addButtons.appendChild(newButton);

                const volumeSlider = document.createElement('input');
                volumeSlider.type = 'range';
                volumeSlider.min = 0;
                volumeSlider.max = 1;
                volumeSlider.step = 0.01;
                volumeSlider.value = 1;
                volumeSlider.addEventListener('input', (event) => {
                    adjustInstrumentVolume(index, event.target.valueAsNumber);
                });

                const buttonContainer = document.createElement("div");
                buttonContainer.className = "sample-button-container";
                buttonContainer.appendChild(newButton);
                buttonContainer.appendChild(volumeSlider);
                addButtons.appendChild(buttonContainer);


                //Adding drag-and-drop functionality for the sample buttons here
                newButton.addEventListener('click', () => {
                    const sampleNumber = newButton.dataset.id;
                    const trackNumber = document.querySelector("input[name='track']:checked").value;
                    addSample(newButton, sampleNumber, trackNumber);
                });
                newButton.addEventListener('dragstart',(event) => {
                    event.dataTransfer.setData('text/plain', newButton.dataset.id);
                    //event.preventDefault();
                });
                
            } 
        });

    }


    // By pressing the sample button or dragging it to a track, the sample is added to the tracks array and to the track div
    function addSample(addButton, sampleNumber, trackNumber) {
        const sample = samples[sampleNumber];

        tracks[trackNumber].push(sample);

        let trackDiv = document.getElementById("trackDiv" + trackNumber)
        let newItem = document.createElement("div")
        newItem.innerText = sample.name;
        /*
        newItem.innerText = samples[sampleNumber].name
        trackDiv.appendChild(newItem);*/

        const removeButton = document.createElement("button");
        removeButton.innerText = "Remove";
        removeButton.addEventListener("click", () => {
            //Removing the instrument from the track div and track array
            const index = tracks[trackNumber].indexOf(sample);
            if (index !== -1) {
                tracks[trackNumber].splice(index,1);
                trackDiv.removeChild(newItem);
            }
        });
        //Appending the instrument and remove button to the track div
        newItem.appendChild(removeButton);
        trackDiv.appendChild(newItem);
    }

    //Adding drag-and-drop functionality for the track divs
    const trackDivs = document.querySelectorAll('#tracks > div');
    trackDivs.forEach((trackDiv) => {
        trackDiv.addEventListener('dragover',(event) => {
            event.preventDefault();
        });
        trackDiv.addEventListener('drop',(event) => {
            event.preventDefault();
            const sampleNumber = event.dataTransfer.getData('text/plain');
            const trackNumber = trackDiv.id.replace('trackDiv', '');
            addSample(null,sampleNumber, trackNumber);
        });
    })

    //Play button functionality
    const playButton = document.getElementById("play")
    playButton.addEventListener("click", () => playSong())

    // Song is played so that each track is started simultaneously 
    function playSong() {
        let i = 0;
        tracks.forEach((track) => {
            if(track.length > 0) {
                playTrack(track, i)
            }
            i++
        })
    }

    // Track is looped – that means it is restarted each time its samples are playd through
    function playTrack(track, trackNumber) {
        let audio = new Audio()
        let i = 0
        audio.addEventListener("ended", () => {
            i = ++i < track.length ? i : 0
            audio.src = track[i].src
            audio.play()
            console.log("Starting: Track " + trackNumber + ", instrument " + track[i].name)
        }, true )
        audio.volume = 1.0
        audio.loop = false
        audio.src = track[0].src
        audio.play()
        console.log("Starting: Track " + trackNumber + ", instrument " + track[i].name)
    }

    // There is a upload button that adds a sample to samples array and a sample button with an event listener
    const uploadButton = document.getElementById("upload")
    uploadButton.addEventListener("click", () => {
        const file = document.getElementById("input-sample").files[0]
        let audioSrc = ""
        if(!file) return
        
        audioSrc = URL.createObjectURL(file)
        let sample = {src: audioSrc, name: "New Sample"}
        samples.push(sample)
        id = samples.length - 1

        updateSampleButtons();
    });
        

    //Function to adjust the volume of a track
    function adjustTrackVolume(trackNumber, volume) {
        tracks[trackNumber].forEach(sample => {
            sample.audio.volume = volume;
        });
    }

    //Function to adjust the volume of an instrument item
    function adjustInstrumentVolume(sampleNumber, volume) {
        samples[sampleNumber].audio.volume = volume;
    }

    //Adding event listeners for track volume controls
    for (let i = 0; i < tracks.length; i++) {
        const trackVolumeInput = document.getElementById(`track${i+1}Volume`);
        trackVolumeInput.addEventListener('input', () => {
            adjustTrackVolume(i, trackVolumeInput.valueAsNumber);
        });
    }

    //Adding an event listener to the volume sliders for individual samples
    samples.forEach((sample,index) => {
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = 0;
        volumeSlider.max = 1;
        volumeSlider.step = 0.01;
        volumeSlider.value = 1;
        volumeSlider.addEventListener('input', () => {
            adjustInstrumentVolume(trackNumber, volumeSlider.valueAsNumber);
        });
    });
    
    //Use the web audio API and let users to record songs through microphone
    //Function to start and stop audio recording
    let isRecording = false;
    let recordedChunks=[];
    const recordButton = document.getElementById('record');
    const microphoneInput = document.getElementById('microphone-input');
    


    recordButton.addEventListener('click', () => {
        if (!isRecording) {
            startRecording();
        }else {
            stopRecording();
        }
    });

    const saveButton = document.getElementById('save');
    saveButton.addEventListener('click',saveRecordedAudio);

    let mediaRecorder;

    function startRecording() {
        navigator.mediaDevices.getUserMedia({ audio: true})
            .then((stream) => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = handleDataAvailable;
                mediaRecorder.start();
                isRecording = true;
                recordButton.textContent = 'Stop Recording';
            })
            .catch((error) => {
                console.error('Error accessing the microphone:',error);
            });
    }

    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            isRecording = false;
            recordButton.textContent = 'Record';
        }
    }


    function handleDataAvailable(event) {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    }

    function saveRecordedAudio() {
        const blob = new Blob(recordedChunks, {type: 'audio/webm'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recorded-audio.webm';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    }

    //Users can add as many tracks as they sees fit
    const addTrackButton = document.getElementById("addTrackButton");
    addTrackButton.addEventListener("click", () => {
        //Creating a new track
        const newTrack = [];
        tracks.push(newTrack);

        
        //Creating a new track div
        const trackDiv = document.createElement("div");
        const trackNumber = tracks.length - 1;
        trackDiv.setAttribute("id","trackDiv" + trackNumber);
        trackDiv.setAttribute("draggable","true");
        trackDiv.addEventListener("dragover",handleDragOver);
        trackDiv.addEventListener("drop",handleDrop);

        const trackDivHeader = document.createElement("h2");
        trackDivHeader.innerText = "Track" + (trackNumber + 1);
        trackDiv.appendChild(trackDivHeader);
        document.getElementById("tracks").appendChild(trackDiv);
        
        //Adding the "Delete Track" button the new track div
        const deleteTrackButton = document.createElement("button");
        deleteTrackButton.innerText = "Delete Track";
        deleteTrackButton.addEventListener("click",() => {
            const trackNumber = trackDiv.id.replace("trackDiv", "");
            //Removing the track and its div
            tracks.splice(trackNumber,1);
            tracksDiv.removeChild(trackDiv);
            updateSampleButtons();
        });
        trackDiv.appendChild(deleteTrackButton);

        //Adding a new track option to the play section
        const playTrackOption = document.createElement("input");
        playTrackOption.type = "radio";
        playTrackOption.name = "track";
        playTrackOption.value = trackNumber;
        playTrackOption.id = "track" + trackNumber;

        const playTrackLabel = document.createElement("label");
        playTrackLabel.setAttribute("for","track" + trackNumber);
        playTrackLabel.innerText = "Track " + (trackNumber +1)+" ";

        //Creating a container for the new track option and append it to the same section
        const trackContainer = document.createElement("div");
        trackContainer.appendChild(playTrackOption);
        trackContainer.appendChild(playTrackLabel);

        //Adding a line break
        //const lineBreak = document.createElement("br");

        //Adding a volume slider for the new tracks
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = 0;
        volumeSlider.max = 1;
        volumeSlider.step = 0.01;
        volumeSlider.value = 1;
        volumeSlider.addEventListener('input', () => {
            adjustInstrumentVolume(trackNumber, volumeSlider.valueAsNumber);
        });        
        trackContainer.appendChild(volumeSlider);

        //Appending elements to the containers
        document.getElementById("trackOptionsContainer").appendChild(trackContainer);
        //document.getElementById("trackOptionsContainer").appendChild(lineBreak);
        
        updateSampleButtons();
    });
    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDrop(event) {
        event.preventDefault();
        const sampleNumber = event.dataTransfer.getData('text/plain');
        const trackNumber = event.target.id.replace('trackDiv', '');
        addSample(null, sampleNumber, trackNumber);
    }

    

    populateCategorySelect();

    const categorySelect = document.getElementById("categorySelect");
    categorySelect.addEventListener("change" ,() => {
        updateSampleButtons();
    })

});



