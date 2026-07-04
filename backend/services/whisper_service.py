import os
import logging
import tempfile
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WhisperService:
    _model = None

    @classmethod
    def get_model(cls):
        """Lazy-loads and caches the Faster Whisper CPU model."""
        if cls._model is None:
            logger.info("Initializing Faster Whisper model ('tiny') on CPU (int8)...")
            try:
                # We use the tiny model (only 75MB) for maximum speed and memory efficiency on CPU.
                # It downloads from Hugging Face on first use.
                cls._model = WhisperModel("tiny", device="cpu", compute_type="int8")
                logger.info("Faster Whisper model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load Faster Whisper model: {e}")
                # Fallback to None, will raise exception or return a mock in transcribe
        return cls._model

    @classmethod
    def transcribe(cls, file_content: bytes) -> str:
        """
        Transcribes audio data (bytes) using Faster Whisper.
        Saves the audio to a temporary file, transcribes it, and removes the temp file.
        """
        model = cls.get_model()
        if not model:
            logger.error("Whisper Model not initialized. Returning mock transcription.")
            return "[Offline Mock Transcript]: Standard answer about building scalable applications."

        # Write bytes to a temp file that Whisper can read
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_audio:
            temp_audio.write(file_content)
            temp_path = temp_audio.name

        try:
            logger.info(f"Transcribing audio file: {temp_path}")
            segments, info = model.transcribe(temp_path, beam_size=5, language="en")
            
            transcript_parts = []
            for segment in segments:
                transcript_parts.append(segment.text)
                
            transcript = "".join(transcript_parts).strip()
            logger.info(f"Transcription complete. Language: {info.language} (probability: {info.language_probability:.2f})")
            return transcript if transcript else "[Silent / No Speech Detected]"
        except Exception as e:
            logger.error(f"Error during Faster Whisper transcription: {e}")
            return f"[Transcription Error: {str(e)}]"
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
