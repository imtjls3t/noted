const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function isSupported() {
  return !!SpeechRecognition;
}

export function createRecognition({ onResult, onEnd, onError }) {
  if (!SpeechRecognition) {
    onError?.('Speech recognition is not supported in this browser.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interim = '';
    for (let i = 0; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interim += transcript;
      }
    }
    onResult?.(finalTranscript + interim);
  };

  recognition.onend = () => {
    onEnd?.();
  };

  recognition.onerror = (event) => {
    if (event.error !== 'aborted') {
      onError?.(event.error);
    }
  };

  return {
    start() {
      recognition.start();
    },
    stop() {
      recognition.stop();
    },
    abort() {
      recognition.abort();
    },
  };
}
