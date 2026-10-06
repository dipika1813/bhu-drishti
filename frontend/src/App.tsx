import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LandingScreen } from './screens/LandingScreen';
import { ConsoleScreen } from './screens/ConsoleScreen';
import { PrivacyScreen } from './screens/PrivacyScreen';
import { TermsScreen } from './screens/TermsScreen';
import type { Session, UploadedImages } from './lib/types';
import { mockUpload, BUNDLED_SAMPLES } from './lib/api';
import './index.css';

function ConsoleRouteWrapper({
  session,
  images,
  onNewSession,
  onSessionUpdate,
}: {
  session: Session | null;
  images: UploadedImages;
  onNewSession: () => void;
  onSessionUpdate: (s: Session, imgs: UploadedImages) => void;
}) {
  const navigate = useNavigate();

  // If no session exists yet (e.g. direct URL entry to /console), initialize with the first bundled sample
  const effectiveSession: Session =
    session || mockUpload('single', BUNDLED_SAMPLES[0]);

  const effectiveImages: UploadedImages =
    images.primaryPreview
      ? images
      : {
          primary: null,
          secondary: null,
          primaryPreview: BUNDLED_SAMPLES[0].file1,
          secondaryPreview: null,
        };

  return (
    <div className="w-screen h-screen overflow-hidden bg-hud-bg">
      <ConsoleScreen
        session={effectiveSession}
        images={effectiveImages}
        onNewSession={() => {
          onNewSession();
          navigate('/');
        }}
        onSessionUpdate={onSessionUpdate}
      />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [images, setImages] = useState<UploadedImages>({
    primary: null,
    secondary: null,
    primaryPreview: null,
    secondaryPreview: null,
  });

  const handleSessionReady = (s: Session, imgs: UploadedImages) => {
    setSession(s);
    setImages(imgs);
  };

  const handleNewSession = () => {
    setSession(null);
    setImages({ primary: null, secondary: null, primaryPreview: null, secondaryPreview: null });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="w-full min-h-screen bg-hud-bg">
              <LandingScreen onSessionReady={handleSessionReady} />
            </div>
          }
        />
        <Route
          path="/console"
          element={
            <ConsoleRouteWrapper
              session={session}
              images={images}
              onNewSession={handleNewSession}
              onSessionUpdate={(s, imgs) => {
                setSession(s);
                setImages(imgs);
              }}
            />
          }
        />
        <Route path="/privacy" element={<PrivacyScreen />} />
        <Route path="/terms" element={<TermsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
