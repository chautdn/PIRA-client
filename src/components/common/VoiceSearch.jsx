import React, { useState, useEffect } from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';
import { motion } from 'framer-motion';

/**
 * Voice Search Component - Tìm kiếm bằng giọng nói
 * Hỗ trợ tiếng Việt
 */
const VoiceSearch = ({ onSearch, language = 'vi-VN' }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    // Kiểm tra trình duyệt có hỗ trợ Web Speech API không
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Trình duyệt không hỗ trợ nhận dạng giọng nói');
      return;
    }

    // Khởi tạo Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = language;
    recognitionInstance.maxAlternatives = 1;

    // Xử lý kết quả nhận diện
    recognitionInstance.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

      setTranscript(currentTranscript);

      if (event.results[0].isFinal) {
        onSearch(currentTranscript);
        setIsListening(false);
      }
    };

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setError('');
      setTranscript('');
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    recognitionInstance.onerror = (event) => {
      setIsListening(false);
      switch (event.error) {
        case 'no-speech':
          setError('Không phát hiện giọng nói');
          break;
        case 'audio-capture':
          setError('Không tìm thấy microphone');
          break;
        case 'not-allowed':
          setError('Vui lòng cấp quyền microphone');
          break;
        default:
          setError('Đã xảy ra lỗi');
      }
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [language, onSearch]);

  const toggleListening = () => {
    if (!recognition) {
      setError('Không thể khởi tạo nhận diện giọng nói');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        setError('Không thể bắt đầu nhận diện giọng nói');
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        disabled={!recognition}
        className={`p-3 rounded-full transition-all duration-300 ${
          isListening
            ? 'bg-red-500 text-white shadow-lg scale-110'
            : ' text-gray-500 hover:text-gray-700 shadow-md'
        } ${!recognition ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isListening ? 'Đang nghe...' : 'Tìm kiếm bằng giọng nói'}
      >
        {isListening ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
      </button>

      {/* Transcript hiển thị */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap z-10"
        >
          <p className="text-sm text-gray-700">{transcript}</p>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-red-50 text-red-600 px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap z-10"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default VoiceSearch;
