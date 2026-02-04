/* global SpeechSDK, RequestAuthorizationToken */

var speechConfig,
  synthesizer,
  audioConfig,
  recognizer,
  listening = false;

if (!!SpeechSDK) {
  speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
    "04e1547c89a748e48e83ce40b942079d",
    "eastus"
  );

  speechConfig.speechSynthesisLanguage = "en-US";
  speechConfig.speechSynthesisVoiceName = "en-US-ChristopherNeural";

  speechConfig.speechRecognitionLanguage = "en-US";
  audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
}

let textToSpeechTimeout;

function textToSpeech(text, cb) {
  if (!synthesizer) {
    synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
  }

  console.log("Synthesizing speech...");
  synthesizer.speakTextAsync(
    text,
    (result) => {
      if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
        console.log("Speech synthesis done:", text);

        if (typeof cb === "function") {
          cb(text);
        }
      } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
        console.error("Speech synthesis failed:", result.errorDetails);
      }
    },
    (err) => console.log(err)
  );

  clearTimeout(textToSpeechTimeout);
  textToSpeechTimeout = setTimeout(() => {
    if (synthesizer) {
      synthesizer.close();
      synthesizer = undefined;
    }
  }, 3000);
}

function setVolume(volume) {
  if (!synthesizer) {
    synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
  }

  synthesizer.audioConfig.privDestination.volume = Math.max(
    0,
    Math.min(1.0, volume)
  );
}

let speechToTextTimeout;

function speechClose() {
  if (recognizer) {
    recognizer.close();
    recognizer = undefined;
  }
}

function speechToText(cb, continuous = false) {
  if (typeof cb !== "function") {
    speechClose();
    return;
  }

  if (!recognizer) {
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
  }

  console.log("Recognizing speech...");
  if (!listening) {
    let phrase = "";

    if (continuous) {
      recognizer.recognized = (s, e) => {
        if (e.result.text && e.result.reason == SpeechSDK.ResultReason.RecognizedSpeech) {
          phrase = e.result.text
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
            .toLowerCase();

          console.log("Speech recognized:", phrase);

          cb(phrase);
        }
      };

      recognizer.canceled = (s, e) => {
        console.error("Speech recognition failed:", e.errorDetails);

        recognizer.stopContinuousRecognitionAsync();
      };

      recognizer.sessionStopped = (s, e) => {
        console.error("Speech recognition stopped.");

        recognizer.stopContinuousRecognitionAsync();
      };

      recognizer.startContinuousRecognitionAsync();
    } else {
      listening = true;

      recognizer.recognizeOnceAsync(
        (result) => {
          if (result.text && result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            phrase += result.text
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
              .toLowerCase();

            console.log("Speech recognition done:", phrase);

            // we already know cb is of type function
            cb(phrase);
          } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
            console.error("Speech recognition failed:", result.errorDetails);
          }

          listening = false;
        },
        (err) => {
          listening = false;
        }
      );

      clearTimeout(speechToTextTimeout);
      speechToTextTimeout = setTimeout(speechClose, 10000);
    }
  }
}