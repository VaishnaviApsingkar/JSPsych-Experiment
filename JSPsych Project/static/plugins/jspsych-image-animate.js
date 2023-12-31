/**
 * jsPsych plugin for showing animations that mimic the experiment described in
 *
 * Fiser, J., & Aslin, R. N. (2002). Statistical learning of higher-order
 * temporal structure from visual shape sequences. Journal of Experimental
 * Psychology: Learning, Memory, and Cognition, 28(3), 458.
 *
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 *
 */

jsPsych.plugins['image-animate'] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('image-animate', 'stimuli', 'image');

  plugin.info = {
    name: 'image-animate',
    description: '',
    parameters: {
      stimuli: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Stimuli',
        default: undefined,
        array: true,
        description: 'A stimulus is a path to an image file.'
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEY,
        pretty_name: 'Choices',
        array: true,
        default: jsPsych.ALL_KEYS,
        description: 'This array contains the keys that the subject is allowed to press in order to respond to the stimulus. '
      },
      canvas_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Canvas size',
        array: true,
        default: [400,400],
        description: 'Array specifying the width and height of the area that the animation will display in.'
      },
      image_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Image size',
        array: true,
        default: [100,100],
        description: 'Array specifying the width and height of the images to show.'
      },
      initial_direction: {
        type: jsPsych.plugins.parameterType.SELECT,
        pretty_name: 'Initial direction',
        choices: ['left','right'],
        default: 'right',
        description: 'Which direction the stimulus should move first.'
      },
      occlude_center: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Occlude center',
        default: true,
        description: 'If true, display a rectangle in the center of the screen that is just wide enough to occlude the image completely as it passes behind.'
      },
      cycle_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Cycle duration',
        default: 1000,
        description: 'How long it takes for a stimulus in the sequence to make a complete cycle.'
      },
      pre_movement_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Pre movement duration',
        default: 500,
        description: 'How long to wait before the stimuli starts moving from behind the center rectangle.'
      }
    }
  }

  plugin.trial = function(display_element, trial) {
    
    // variable to keep track of timing info and responses
    var start_time = 0;
    var responses = [];

    var directions = [
      [{
        params: {
          x: trial.canvas_size[0] - trial.image_size[0]
        },
        ms: trial.cycle_duration
      }, {
        params: {
          x: trial.canvas_size[0] - trial.image_size[0] 
        },
        ms: trial.cycle_duration 
      }],
      [{
        params: {
          x: 0
        },
        ms: trial.cycle_duration / 2
      }, {
        params: {
          x: trial.canvas_size[0] / 2 - trial.image_size[0] / 2
        },
        ms: trial.cycle_duration / 2
      }]
    ];

    var which_image = 0;
    var next_direction = (trial.initial_direction == "right") ? 0 : 1;

    function next_step() {
      if (trial.stimuli.length == which_image) {
        endTrial();
      } else {

        var d = directions[next_direction];
        next_direction === 0 ? next_direction = 1 : next_direction = 0;
        var i = trial.stimuli[which_image];
        which_image++;

        c.animate(d[0].params, d[0].ms, mina.linear, function() {
          c.animate(d[1].params, d[1].ms, mina.linear, function() {
            next_step();
          });
        });

        c.attr({
          href: i
        });

        // start timer for this trial
        start_time = performance.now();
      }
    }

    display_element.innerHTML = "<svg id='jspsych-image-animate-canvas' width=" + trial.canvas_size[0] + " height=" + trial.canvas_size[1] + "></svg>";

    var paper = Snap("#jspsych-image-animate-canvas");

    var c = paper.image(trial.stimuli[which_image], trial.canvas_size[0] / 2 - trial.image_size[0] / 2, trial.canvas_size[1] / 2 - trial.image_size[1] / 2, trial.image_size[0], trial.image_size[1]).attr({
      "id": 'jspsych-image-animate-moving-image'
    });

    display_element.querySelector('#jspsych-image-animate-moving-image').removeAttribute('preserveAspectRatio');

    if (trial.occlude_center) {
      paper.rect((trial.canvas_size[0] / 2) - (trial.image_size[0] / 2), 0, trial.image_size[0], trial.canvas_size[1]).attr({
        fill: "#000"
      });
    }

    // add key listener
    var after_response = function(info) {
      responses.push({
        key: info.key,
        stimulus: which_image - 1,
        rt: info.rt
      });
    }

    key_listener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: after_response,
      valid_responses: trial.choices,
      rt_method: 'performance',
      persist: true,
      allow_held_key: false
    });

    if (trial.pre_movement_duration > 0) {
      jsPsych.pluginAPI.setTimeout(function() {
        next_step();
      }, trial.pre_movement_duration);
    } else {
      next_step();
    }

    function endTrial() {

      display_element.innerHTML = '';

      jsPsych.pluginAPI.cancelKeyboardResponse(key_listener);

      var trial_data = {
        stimuli: trial.stimuli,
        response: responses
      };

      jsPsych.finishTrial(trial_data);
    }
  };

  return plugin;
})();
