import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LandingScreen } from './screens/LandingScreen';
import { ConsoleScreen } from './screens/ConsoleScreen';
import type { Session, UploadedImages } from './lib/types';
import './index.css';

type AppScreen = 'landing' | 'console';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [images, setImages] = useState<UploadedImages>({ primary: null, secondary: null, primaryPreview: null, secondaryPreview: null });

  const handleSessionReady = (s: Session, imgs: UploadedImages) => {
    setSession(s);
    setImages(imgs);
    setScreen('console');
  };

  const handleNewSession = () => {
    setScreen('landing');
    setSession(null);
    setImages({ primary: null, secondary: null, primaryPreview: null, secondaryPreview: null });
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-hud-bg">
      <AnimatePresence mode="wait">
        {screen === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <LandingScreen onSessionReady={handleSessionReady} />
          </motion.div>
        ) : session ? (
          <motion.div
            key="console"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <ConsoleScreen session={session} images={images} onNewSession={handleNewSession} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
