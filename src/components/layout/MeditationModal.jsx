import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, Box, Typography, IconButton, Slider, Button } from '@mui/material';
import { Close as CloseIcon, PlayArrow as PlayIcon, Pause as PauseIcon, VolumeUp as VolumeUpIcon } from '@mui/icons-material';
import { ambientAudio } from '../../utils/ambientAudio';

const AMBIENT_SOUNDS = [
  { id: 'zen', name: '🧘 Zen 432Hz' },
  { id: 'rain', name: '🌧️ Yağmur Sesi' },
  { id: 'ocean', name: '🌊 Okyanus Dalgaları' },
  { id: 'forest', name: '🌲 Orman Rüzgarı' }
];

const BREATH_STEPS = [
  { text: 'Nefes Al (İçine Çek)', duration: 4, scale: 1.7, color: '#D4AF37' },
  { text: 'Nefesini Tut', duration: 4, scale: 1.7, color: '#F9E076' },
  { text: 'Nefes Ver (Bırak)', duration: 4, scale: 1.0, color: 'rgba(212,175,55,0.5)' },
  { text: 'Dinlen & Bekle', duration: 4, scale: 1.0, color: 'rgba(255,255,255,0.2)' }
];

export default function MeditationModal({ open, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSound, setSelectedSound] = useState(AMBIENT_SOUNDS[0]);
  const [volume, setVolume] = useState(0.7);

  // Nefes Egzersizi Durumları
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const timerRef = useRef(null);

  // Ses Seçildiğinde (Tıklanınca hemen çalmaya başlar)
  const handleSelectSound = (sound) => {
    setSelectedSound(sound);
    ambientAudio.setVolume(volume);
    ambientAudio.play(sound.id);
    setIsPlaying(true);
  };

  // Oynat / Durdur
  const handlePlayPause = () => {
    if (isPlaying) {
      ambientAudio.stop();
      setIsPlaying(false);
    } else {
      ambientAudio.setVolume(volume);
      ambientAudio.play(selectedSound.id);
      setIsPlaying(true);
    }
  };

  // Ses Seviyesi Değişimi
  const handleVolumeChange = (e, val) => {
    setVolume(val);
    ambientAudio.setVolume(val);
  };

  // Nefes Egzersizi Başlat / Durdur
  const startBreathing = () => {
    setCurrentStep(0);
    setSecondsLeft(4);
    setIsBreathingActive(true);
  };

  const stopBreathing = () => {
    setIsBreathingActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentStep(0);
    setSecondsLeft(4);
  };

  const handleClose = () => {
    ambientAudio.stop();
    setIsPlaying(false);
    stopBreathing();
    onClose();
  };

  // Nefes Egzersizi Zamanlayıcısı
  useEffect(() => {
    if (!isBreathingActive) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setCurrentStep((step) => (step + 1) % BREATH_STEPS.length);
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBreathingActive]);

  // Unmount veya kapatma temizliği
  useEffect(() => {
    return () => {
      ambientAudio.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const activeStepInfo = BREATH_STEPS[currentStep];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(18, 18, 18, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '24px',
          color: '#fff',
          p: 2,
          boxShadow: '0 20px 60px rgba(0,0,0,0.85)'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
        <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif", color: '#D4AF37', fontWeight: 700 }}>
          Zihinsel Sığınak & Meditasyon 🧘
        </Typography>
        <IconButton onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.6)' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
        {/* NEFES EGZERSİZİ ALANI */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '200px',
          width: '100%',
          position: 'relative'
        }}>
          {isBreathingActive ? (
            <>
              {/* Nefes Çemberi Animasyonu */}
              <Box 
                sx={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  bgcolor: 'transparent',
                  border: `4px solid ${activeStepInfo.color}`,
                  boxShadow: `0 0 35px ${activeStepInfo.color}`,
                  transform: `scale(${activeStepInfo.scale})`,
                  transition: 'all 4s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute'
                }}
              />
              {/* Çemberin İçindeki Yazı */}
              <Box sx={{ zIndex: 10, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: 0.5, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                  {activeStepInfo.text}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: '#D4AF37', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                  {secondsLeft}
                </Typography>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', zIndex: 10, p: 1 }}>
              <Typography variant="body2" sx={{ color: '#aaa', mb: 2.5, lineHeight: 1.6 }}>
                Zihnini sakinleştirmek ve ruhunu onarmak için 4-4-4-4 Kutu Nefesi egzersizini başlat.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={startBreathing}
                sx={{ 
                  borderColor: '#D4AF37', 
                  color: '#D4AF37', 
                  borderRadius: '20px',
                  px: 3.5,
                  py: 0.8,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(212,175,55,0.12)', borderColor: '#F9E076', color: '#FFF6D6' }
                }}
              >
                🌬️ Nefes Egzersizini Başlat
              </Button>
            </Box>
          )}
        </Box>

        {isBreathingActive && (
          <Button 
            size="small" 
            onClick={stopBreathing}
            sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none', fontSize: '0.8rem', mt: -1 }}
          >
            Egzersizi Durdur
          </Button>
        )}

        <Box sx={{ width: '100%', height: '1px', bgcolor: 'rgba(212,175,55,0.15)', my: 0.5 }} />

        {/* SES KONTROL ALANI */}
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              Doğal Meditasyon Sesleri
            </Typography>
            {isPlaying && (
              <Typography variant="caption" sx={{ color: '#4ADE80', fontWeight: 600, fontSize: '0.75rem' }}>
                ● Çalıyor
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {AMBIENT_SOUNDS.map((sound) => {
              const isSelected = selectedSound.id === sound.id;
              return (
                <Button
                  key={sound.id}
                  size="small"
                  onClick={() => handleSelectSound(sound)}
                  variant={isSelected && isPlaying ? 'contained' : 'outlined'}
                  sx={{
                    borderRadius: '16px',
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    bgcolor: isSelected && isPlaying ? '#D4AF37' : 'rgba(255,255,255,0.02)',
                    color: isSelected && isPlaying ? '#000' : (isSelected ? '#F9E076' : '#ccc'),
                    borderColor: isSelected ? '#D4AF37' : 'rgba(255,255,255,0.15)',
                    '&:hover': {
                      bgcolor: isSelected && isPlaying ? '#F9E076' : 'rgba(212,175,55,0.12)',
                      borderColor: '#D4AF37'
                    }
                  }}
                >
                  {sound.name}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, bgcolor: 'rgba(255,255,255,0.03)', p: 1.5, borderRadius: '16px' }}>
            <IconButton 
              onClick={handlePlayPause} 
              sx={{ 
                color: isPlaying ? '#000' : '#000', 
                bgcolor: '#D4AF37',
                '&:hover': { bgcolor: '#F9E076', transform: 'scale(1.05)' },
                width: 44,
                height: 44,
                boxShadow: '0 0 15px rgba(212,175,55,0.3)',
                transition: 'all 0.2s'
              }}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <VolumeUpIcon sx={{ color: '#D4AF37', fontSize: '1.3rem' }} />
              <Slider 
                size="small"
                value={volume} 
                min={0}
                max={1}
                step={0.05}
                onChange={handleVolumeChange}
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
