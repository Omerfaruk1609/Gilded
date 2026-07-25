import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, Box, Typography, IconButton, Slider, Button } from '@mui/material';
import { Close as CloseIcon, PlayArrow as PlayIcon, Pause as PauseIcon, VolumeUp as VolumeUpIcon } from '@mui/icons-material';

const AMBIENT_SOUNDS = [
  { id: 'zen', name: 'Zen Lo-Fi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 'rain', name: 'Yağmur Sesi', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
  { id: 'ocean', name: 'Okyanus Dalgaları', url: 'https://actions.google.com/sounds/v1/weather/ocean_waves.ogg' },
  { id: 'forest', name: 'Orman Rüzgarı', url: 'https://actions.google.com/sounds/v1/weather/crickets.ogg' }
];

const BREATH_STEPS = [
  { text: 'Nefes Al', duration: 4, scale: 2, color: 'rgba(212,175,55,0.6)' },
  { text: 'Tut', duration: 4, scale: 2, color: 'rgba(212,175,55,0.9)' },
  { text: 'Nefes Ver', duration: 4, scale: 1, color: 'rgba(212,175,55,0.3)' },
  { text: 'Tut', duration: 4, scale: 1, color: 'rgba(212,175,55,0.1)' }
];

export default function MeditationModal({ open, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSound, setSelectedSound] = useState(AMBIENT_SOUNDS[0]);
  const [volume, setVolume] = useState(0.5);
  
  // Nefes Egzersizi Durumları
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);

  const audioRef = useRef(new Audio(selectedSound.url));

  // Audio Ayarları ve Güncellemeleri
  useEffect(() => {
    audioRef.current.pause();
    audioRef.current = new Audio(selectedSound.url);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    if (isPlaying) {
      audioRef.current.play().catch(err => console.log('Audio çalma hatası:', err));
    }
  }, [selectedSound, isPlaying, volume]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.log('Audio çalma hatası:', err));
    }
    setIsPlaying(!isPlaying);
  };

  const startBreathing = () => {
    setCurrentStep(0);
    setSecondsLeft(4);
    setIsBreathingActive(true);
  };

  const stopBreathing = () => {
    setIsBreathingActive(false);
    setCurrentStep(0);
    setSecondsLeft(4);
  };

  const handleClose = () => {
    audioRef.current.pause();
    setIsPlaying(false);
    stopBreathing();
    onClose();
  };

  // Nefes egzersizi döngüsü
  useEffect(() => {
    if (!isBreathingActive) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setCurrentStep((prevStep) => (prevStep + 1) % BREATH_STEPS.length);
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingActive]);

  const activeStepInfo = BREATH_STEPS[currentStep];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(15, 15, 15, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '24px',
          color: '#fff',
          p: 2
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#D4AF37', fontWeight: 700 }}>
          Zihinsel Sığınak 🧘
        </Typography>
        <IconButton onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.6)' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        {/* NEFES EGZERSİZİ ALANI */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '220px',
          width: '100%',
          position: 'relative'
        }}>
          {isBreathingActive ? (
            <>
              {/* Nefes Çemberi */}
              <Box 
                sx={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  bgcolor: 'transparent',
                  border: `4px solid ${activeStepInfo.color}`,
                  boxShadow: `0 0 40px ${activeStepInfo.color}`,
                  transform: `scale(${activeStepInfo.scale})`,
                  transition: 'all 4s linear', // Genişleme animasyonu 4s
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute'
                }}
              />
              {/* Çemberin İçindeki Yazı */}
              <Box sx={{ zIndex: 10, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                  {activeStepInfo.text}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: '#D4AF37', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                  {secondsLeft}
                </Typography>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', zIndex: 10, p: 2 }}>
              <Typography variant="body2" sx={{ color: '#aaa', mb: 3 }}>
                Zihnini sakinleştirmek ve ruhunu onarmak için 4-4-4-4 Kutu Nefesi egzersizini başlat.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={startBreathing}
                sx={{ 
                  borderColor: '#D4AF37', 
                  color: '#D4AF37', 
                  borderRadius: '20px',
                  px: 4,
                  '&:hover': { bgcolor: 'rgba(212,175,55,0.1)', borderColor: '#D4AF37' }
                }}
              >
                Nefes Egzersizini Başlat
              </Button>
            </Box>
          )}
        </Box>

        {isBreathingActive && (
          <Button 
            size="small" 
            onClick={stopBreathing}
            sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'none' }}
          >
            Egzersizi Durdur
          </Button>
        )}

        <Box sx={{ width: '100%', height: '1px', bgcolor: 'rgba(255,255,255,0.1)', my: 1 }} />

        {/* SES KONTROL ALANI */}
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="caption" sx={{ color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            Arka Plan Sesleri
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {AMBIENT_SOUNDS.map((sound) => (
              <Button
                key={sound.id}
                size="small"
                onClick={() => setSelectedSound(sound)}
                variant={selectedSound.id === sound.id ? 'contained' : 'outlined'}
                sx={{
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  bgcolor: selectedSound.id === sound.id ? '#D4AF37' : 'transparent',
                  color: selectedSound.id === sound.id ? '#000' : '#D4AF37',
                  borderColor: 'rgba(212,175,55,0.3)',
                  '&:hover': {
                    bgcolor: selectedSound.id === sound.id ? '#F9E076' : 'rgba(212,175,55,0.05)',
                    borderColor: '#D4AF37'
                  }
                }}
              >
                {sound.name}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <IconButton onClick={handlePlayPause} sx={{ color: '#D4AF37', bgcolor: 'rgba(212,175,55,0.1)' }}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <VolumeUpIcon sx={{ color: '#888', fontSize: '1.2rem' }} />
              <Slider 
                size="small"
                value={volume} 
                min={0}
                max={1}
                step={0.05}
                onChange={(e, val) => setVolume(val)}
                sx={{ 
                  color: '#D4AF37',
                  '& .MuiSlider-thumb': { bgcolor: '#D4AF37' }
                }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
