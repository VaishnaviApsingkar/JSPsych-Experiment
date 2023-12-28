/**
 * jspsych-test-motion-event-audio-response
 * 
 * Arella Gussow, Nov 2023
 * THIS IS A SIMPLIFIED VERSION CREATED FOR NOLAB APPLICANT TESTING:
 * - NO DIRECT (DIAGONAL) CONDITION INCLUDED; ONLY UNCERTAIN.
 * - TARGETS ONLY ON TOP (BOTTOM-UP MOVEMENT); NO TOP-DOWN.
 * 
 * Arella Gussow, Sep 2023
 * This plugin is an adapted version of jspsych-audio-response, which displays simple html and 
 * records participants' speech.
 * In current version, plugin displays motion event of actor moving from top/bottom of screen
 * to one of two target objects. Movement path is either  
 * direct (diagonal) or uncertain (between the two targets initially,and turns toward target at the end).
 * 
 * Note this is the vertical version. Original movement was left-to-right.
 * 
 * Properties of the original jspsych-audio-response were modified or eliminated
 * as necessary to simplify code.
 * 
 * Credits for original jspsych-audio-response:
 * 
 * Matt Jaquiery, Feb 2018 (https://github.com/mjaquiery)
 * Becky Gilbert, Apr 2020 (https://github.com/becky-gilbert)
  * Hannah Small, 2020/07/07 (https://github.com/hesmall)
 * added in browser checking and mic checking using this code: https://experiments.ppls.ed.ac.uk/ -- Hannah Small, 2020/07/07
 * added option to manually end recording on each trial
 *
 * plugin for displaying an html stimulus and getting an audio response
 *
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["test-motion-event-audio-response"] = (function() {

    var plugin = {};

    plugin.info = {
        name: 'test-motion-event-audio-response',
        description: 'Present motion even of actor moving to target, retrieve an audio response.',
        parameters: {

// from here until next noted, plugin info edited. AEG          
            prompt: {
                type: jsPsych.plugins.parameterType.HIMAGE,
                pretty_name: 'Prompt',
                default: undefined,
                description: 'Any content here will be displayed on screen - can be HTML.'
            },

            trial_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Trial duration',
                default: -1,
                description: 'The duration of recording.'
            },
              itemID: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Stimulus number',
                default: 'itemID',
                description: 'Identifier number for trial stimulus'
            },
        
              trial_num: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'trial number',
                default: 'trial_num',
                description: 'Index of trial in the sequence'
            },


            trial_type: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'jspsych plugin type',
                default: 'trial_type',
                description: 'name of jspsych plugin',
                                                             
            },

              side: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Side',
                default: 'side',
                description: 'Target side: movement to the right or to the left'
            }, 
        
              turn: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Turn direction',
                default: 'turn',
                description: 'Move right or left: target on right ot left'
            },  


            direction: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Path direction',
                default: 'right',
                description: 'Movement up or down'
            },  
        
        
        
              target: {
                type: jsPsych.plugins.parameterType.IMAGE,
                pretty_name: 'Target',
                default: undefined,
                description: 'Target Image'
            },
        
              competitor: {
                type: jsPsych.plugins.parameterType.IMAGE,
                pretty_name: 'Competitor',
                default: undefined,
                description: 'Competitor Image'
            },
        
              actor: {
                type: jsPsych.plugins.parameterType.IMAGE,
                pretty_name: 'Actor',
                default: undefined,
                description: 'Actor Image'
            },
        
        
              canvas_size: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Canvas size',
                array: true,
                default: [1000,750],
                description: 'Array specifying the width and height of the area that the animation will display in.'
            }, 
        
              image_size: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Image size',
                array: true,
                default: [120,120],
                description: 'Array specifying the width and height of the images to show.'
            },

            buffer_length: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Buffer length',
                default: 5500,// o.g 4000, but would cut trial off. 
                description: 'Length of the audio buffer.'
            },
            postprocessing: {
                type: jsPsych.plugins.parameterType.FUNCTION,
                pretty_name: 'Postprocessing function',
                default: function(data) {
                    return new Promise(function(resolve) {
                        const blob = new Blob(data, { type: 'audio/webm' });
                        // create URL, which is used to replay the audio file (if allow_playback is true)
                        let url = URL.createObjectURL(blob);
                        var reader = new window.FileReader();
                        reader.readAsDataURL(blob);
                        const readerPromise = new Promise(function(resolveReader) {
                            reader.onloadend = function() {
                                // Create base64 string, which is used to save the audio data in JSON/CSV format.
                                // This has to go inside of a Promise so that the base64 data is converted before the 
                                // higher-level data processing Promise is resolved (since that will pass the base64
                                // data to the onRecordingFinish function).
                                var base64 = reader.result;
                                base64 = base64.split(',')[1];
                                resolveReader(base64);
                            };
                        });
                        readerPromise.then(function(base64) {
                            // After the base64 string has been created we can resolve the higher-level Promise, 
                            // which pass both the base64 data and the URL to the onRecordingFinish function.
                            var processed_data = {url: url, str: base64};
                            resolve(processed_data);
                        });
                    });
                },
                description: 'Function to execute on the audio data prior to saving. '+
                    'This function takes the audio data as an argument, '+
                    'and returns an object with keys called "str" and "url". '+
                    'The str and url values are saved in the trial data as "audio_data" and "audio_url". '+
                    'The url value is used as the audio source to replay the recording if allow_playback is true. '+
                    'By default, the str value is a base64 string which can be saved in the JSON/CSV data and '+
                    'later converted back into an audio file. '+
                    'This parameter can be used to pass a custom function that saves the file using a different '+
                    'method/format and generates an ID that relates this file to the trial data. '+
                    'The custom postprocessing function must return an object with "str" and "url" keys. '+
                    'The url value must be a valid audio source, which is used if allow_playback is true. '+
                    'The str value can be null.'
            },
            allow_playback: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Allow playback',
                default: false,
                description: 'Whether to allow the participant to play back their '+
                'recording and re-record if unhappy.'
            },
           
            prompt: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Prompt',
                default: null,
                description: 'Any content here will be displayed under the button.'
            },

            margin_vertical: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Margin vertical',
                default: '0px',
                description: 'The vertical margin of the button.'
            },
            margin_horizontal: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Margin horizontal',
                default: '8px',
                description: 'The horizontal margin of the button.'
            },
            response_ends_trial: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Response ends trial',
                default: false,
                description: 'If true, then trial will end when user responds.'
            },
            wait_for_mic_approval: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Wait for mic approval',
                default: false,
                description: 'If true, the trial will not start until the participant approves the browser mic request.'
            },
            enable_mic_message: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Will allow pop-up for participant to enable microphone',
                default: false,
                description: 'If true, will allow the browser mic request. This should be done before recording any audio!'
            },
            manually_end_recording: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Subject will manually end their recording',
                default: false,
                description: 'If true, the subject will have to press a key to stop recording and continue.'
            },
            manually_end_recording_key: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'Key to manually end recording',
                default: 67, // key "c" will manually end recording
                description: 'The key to end recording on any given trial, default is any key.'

            }
        }
    };

    plugin.trial = function(display_element, trial) {
        
        let playbackElements = [];
        // store response
        let response = {
            rt: null,
            audio_data: null
        };
        let recorder = null;
        let start_time = null;

        // add stimulus
        let html = '<div id="jspsych-motion-event-audio-response-stimulus">'+trial.stimulus+'</div>';
        display_element.innerHTML = html;           

        function start_trial() {  
            // define locations of the four images
            // default sets both target and competitor to be on the left, later will adjust based on left/right balancing
          
            // var locationsU = [ // locations for when the target is on the top (bottom-up motion)
            //     {
            //     "id" : "target",
            //     "xPos": 150,
            //     "yPos": 100 
            //     },

            //     {
            //     "id": "competitor",
            //     "xPos": 150,
            //     "yPos": 100 
            //     },
            //     {
            //     "id": "actor",
            //     "class": "none",
            //     "xPos": 350,
            //     "yPos": 600 
            //     }
            //     ];  

            var locationsR = [ // locations for when the target is on the right (left-right motion)
                {
                "id" : "target",
                "xPos": 550,
                "yPos": 400 
                },

                {
                "id": "competitor",
                "xPos": 550,
                "yPos": 400 
                },
                {
                "id": "actor",
                "class": "none",
                "xPos": 0,
                "yPos": 225 
                }
                ];

            // define path combinations:
            //  whether the turn is up or down (whether the target is on up or down side of screen)

            // var pathU = 't0,-200';
            // var turnUright = 't200,-200';
            // var turnUleft = 't-200,-200';

            var pathR = 't350,0';
            var turnRup = 't350,-200';
            var turnRdown = 't350,200';

            // where right-side images should be 
            var right = 550

            // for up -side images
            var up = 50

            // path and turn times 
            var path_time = 4000 // how long (ms) it moves in straight line
            var turn_time = 1000 // how long (ms) the turn to the target takes

            // initialize variables
            var locations = ''
            var turn = ''
            var path = ''


            // if (trial.direction == 'up'){
            //     locations = locationsU
            //     path = pathU
            //     if (trial.turn == 'right'){
            //     turn = turnUright
            //     locations [0]["xPos"] = right // adjust target location to be on the right
            //     } else if (trial.turn == 'left'){
            //     turn = turnUleft
            //     locations [1]["xPos"] = right  // adjust competitor location to be on the right
            //     }
               
            // };

            if (trial.direction == 'right'){
                locations = locationsR
                path = pathR
                if (trial.turn == 'up'){
                turn = turnRup
                //locations [0]["xPos"] = right // adjust target location to be on the right
                locations [0]["yPos"] = up
                } else if (trial.turn == 'down'){
                turn = turnRdown
                locations [1]["yPos"] = up  // adjust competitor location to be on the right
                }
               
            };
            
            // draw the images
            display_element.innerHTML = "<svg id='jspsych-image-animate-canvas' width=" + trial.canvas_size[0] + " height=" + trial.canvas_size[1] + "></svg>";  //+
            var paper = Snap("#jspsych-image-animate-canvas");  
            paper.image(trial.target, locations[0]["xPos"], locations[0]["yPos"], 300,300); 
            paper.image(trial.competitor, locations[1]["xPos"], locations[1]["yPos"], 300,300); 
            var c = paper.image(trial.actor, locations[2]["xPos"], locations[2]["yPos"], 300,300).attr({
            "id": 'jspsych-image-animate-moving-image',
        }); 

        // start mic recording
        start_recording();
        
        // trial start time
        start_time = performance.now();
        
        display_element.querySelector('#jspsych-image-animate-moving-image').removeAttribute('preserveAspectRatio'); 

       // animation function - path trajectory     
        function start() {
            c.animate({
                transform: path, // path trajectory
            }, 
            path_time, end); // how long the direct path animation takes + what to do afterwards
        }

        // turn towards target (in uncertain condition) to end movement
            function end() {
            c.animate({
                    transform: turn, // turn trajectory
            }, turn_time); // how long the turn takes. same duration of movement for both conditions
            } 
            setTimeout(start, 0); // delay when the movement starts  (preview time)    
        }

        // audio element processing
        function start_recording() {
            // hide existing playback elements
            playbackElements.forEach(function (id) {
                let element = document.getElementById(id);
                element.style.visibility = 'hidden';
            });
            navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(process_audio);
            console.log ("i'm recording!")
            // if (!trial.wait_for_mic_approval) {
            //     // Add visual indicators to let people know we're recording
            //     document.querySelector('#jspsych-html-audio-response-recording-container').innerHTML = trial.recording_light;
            // }
        }
        
        // function to handle responses by the subject
        function process_audio(stream) {

            if (trial.wait_for_mic_approval) {
                if (start_time === null) {
                    start_trial();
                }
                // else {
                //     document.querySelector('#jspsych-html-audio-response-recording-container').innerHTML = trial.recording_light;
                // }
            } 

            // This code largely thanks to skyllo at
            // http://air.ghost.io/recording-to-an-audio-file-using-html5-and-js/

            // store streaming data chunks in array
            const chunks = [];
            // create media recorder instance to initialize recording
            // Note: the MediaRecorder function is not supported in Safari or Edge

            //ADD check for browser! FROM https://experiments.ppls.ed.ac.uk/, THANKS TO ANNIE HOLTZ AND KENNY SMITH

            var wrong_browser_message = "Sorry, it's not possible to run the experiment on your web browser. Please try using Chrome or Firefox instead.";
            var declined_audio_message = "You must allow audio recording to take part in the experiment. Please reload the page and allow access to your microphone to proceed.";

            // function that throws error and displays message if experiment is run in browsers that do not support MediaRecorder, or if microphone access is denied
            function errorQuit(message) {
              var body = document.getElementsByTagName('body')[0];
              body.innerHTML = '<p style="color: #FF0000">'+message+'</p>'+body.innerHTML;//defines the style of error messages
              throw error;
            };

            //either starts handlerFunction if access to microphone is enabeled or catches that it is blocked and calls errorQuit function
            if(trial.enable_mic_message){
                navigator.mediaDevices.getUserMedia({audio:true})
                    .then(stream => {handlerFunction(stream)})
                    .catch(error => {errorQuit(declined_audio_message)});
            }else{
                recorder = new MediaRecorder(stream)
                stream = recorder.stream
                handlerFunction(stream)
             }
            //function that catches incompatibility with MediaRecorder (e.g. in Safari or Edge)
            function handlerFunction(stream) {
                try {
                    recorder = new MediaRecorder(stream);
                    recorder.data = [];
                    recorder.wrapUp = false;
                    recorder.ondataavailable = function(e) {
                    // add stream data to chunks
                    chunks.push(e.data);
                    if (recorder.wrapUp) {
                        if (typeof trial.postprocessing !== 'undefined') {
                            trial.postprocessing(chunks)
                                .then(function(processedData) {
                                    onRecordingFinish(processedData);
                                });
                    } else {
                        // should never fire - trial.postprocessing should use the default function if
                        // not passed in via trial parameters
                        onRecordingFinish(chunks);
                    }
                    }
                }; 

                // start recording with 1 second time between receiving 'ondataavailable' events
                recorder.start(1000);
                
                if(trial.manually_end_recording == false){
                    // setTimeout to stop recording after 4 seconds
                    setTimeout(function() {
                        // this will trigger one final 'ondataavailable' event and set recorder state to 'inactive'
                        recorder.stop();
                        recorder.wrapUp = true;
                        }, trial.buffer_length);
                }else{
                    //wait for response from keyboard to end recording
                    var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
                        callback_function: after_response,
                        valid_responses: trial.manually_end_recording_key,
                        rt_method: 'performance',
                        persist: false,
                        allow_held_key: false
                    });


                }
            } catch(error) {
                errorQuit(wrong_browser_message);
            };
        }
                   

        }

        var after_response = function(info){

            // after a valid response, the stimulus will have the CSS class 'responded'
            // which can be used to provide visual feedback that a response was recorded
            display_element.querySelector('#jspsych-html-audio-response-stimulus').className += ' responded';
            console.log('responded')

            // only record the first response
            if (response.key == null) {
                response = info;
            }
            // this will trigger one final 'ondataavailable' event and set recorder state to 'inactive'
            recorder.stop();
            recorder.wrapUp = true;
        }


        function onRecordingFinish(data) {
            // measure rt
            let end_time = performance.now();
            let rt = end_time - start_time;
            response.audio_data = data.str;
            response.audio_url = data.url;
            response.rt = rt;

            if (trial.response_ends_trial) {
                end_trial();
            // } else if (trial.allow_playback) {  // only allow playback if response doesn't end trial
            //     showPlaybackTools(response.audio_url);
            } else { 
                // fallback in case response_ends_trial and allow_playback are both false, 
                // which would mean the trial never ends
                end_trial();
                console.log("done recording.")
            }
        }

        // function to end trial when it is time
        function end_trial() {
            // kill any remaining setTimeout handlers
            jsPsych.pluginAPI.clearAllTimeouts();
            //kill keyboard listeners
            jsPsych.pluginAPI.cancelAllKeyboardResponses();

            // gather the data to store for the trial
            let trial_data = {
                "rt": response.rt,
             //   "stimulus": trial.stimulus,
                "audio_data": response.audio_data,
                "condition": trial.condition,
                "probe": trial.probe,
              //  "actor": trial.actor,
               // "key_press": response.key
            };

            // clear the display
            display_element.innerHTML = '';

            // move on to the next trial
            jsPsych.finishTrial(trial_data);
        }

        if (trial.wait_for_mic_approval) {
            start_recording();
            } else {
                start_trial();
            }

    };

    return plugin;
})();