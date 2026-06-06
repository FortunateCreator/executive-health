'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MotionSample {
  t: number;   // Date.now() when sample was recorded
  mag: number; // √(x² + y² + z²) from accelerationIncludingGravity
}

interface SleepIdleDetectorProps {
  /** Returns the current auth token (or null if unauthenticated).
   *  Same interface as the original idle-detector component. */
  getToken: () => string | null;
  /** Called after a sleep record is successfully persisted. */
  onSleepLogged?: () => void;
}

// =========================================================================
// Constants
// =========================================================================

/** Max standard deviation of acceleration magnitude for a phone to be
 *  considered "still."  A phone lying flat has σ ≈ 0.01–0.05; walking /
 *  handling drives σ well above 0.5. */
const STILLNESS_SIGMA_MAX = 0.12;

/** Rolling window for motion samples (5 minutes). */
const SAMPLE_WINDOW_MS = 5 * 60 * 1000;

/** "Recent" window used for the current-stillness calculation (1 minute). */
const RECENT_WINDOW_MS = 60 * 1000;

/** Minimum number of recent samples before we trust the stillness verdict. */
const MIN_SAMPLES = 10;

/** How often the stillness analysis runs. */
const TICK_MS = 30_000;

/** Delay before the very first analysis (gives sensors time to fill the buffer). */
const INITIAL_TICK_MS = 10_000;

/** Hard cap on the sample buffer to guard against runaway memory. */
const MAX_BUFFER = 20_000;

// =========================================================================
// Pure helpers
// =========================================================================

/** True when the current hour falls inside the sleep-detection window
 *  (22:00–10:00 by default). */
function inSleepWindow(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 10;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Walk backward through the sample buffer to locate the timestamp where the
 * current continuous-stillness episode most likely began.
 *
 * Uses a sliding local-window stddev check — when we find a window whose
 * stddev exceeds the threshold we know movement happened there, so stillness
 * began just after it.
 */
function findStillnessOnset(buffer: MotionSample[]): number {
  const LOCAL = 30; // samples either side
  const MIN_LOCAL = 10;

  for (let i = buffer.length - 1; i >= 0; i--) {
    const start = Math.max(0, i - LOCAL);
    const slice = buffer.slice(start, i + 1);
    if (slice.length < MIN_LOCAL) continue;

    if (stddev(slice.map((s) => s.mag)) >= STILLNESS_SIGMA_MAX) {
      // Movement found — stillness began with the next sample
      const nextIdx = Math.min(i + 1, buffer.length - 1);
      return buffer[nextIdx].t;
    }
  }

  // The entire buffer is still — fall back to the oldest sample we have
  return buffer[0].t;
}

// =========================================================================
// Component
// =========================================================================

export default function SleepIdleDetector({
  getToken,
  onSleepLogged,
}: SleepIdleDetectorProps) {
  // ---- sensor readiness --------------------------------------------------
  // 'unknown'  — waiting for iOS permission prompt or initial detection
  // 'ready'    — devicemotion events are flowing
  // 'absent'   — no DeviceMotion API (desktop) — the component renders null
  const [sensorReady, setSensorReady] = useState<boolean | null>(null); // null = unknown

  // ---- modal -------------------------------------------------------------
  const [showModal, setShowModal] = useState(false);
  // How long the phone was still before motion resumed (minutes)
  const [stillMinutes, setStillMinutes] = useState(0);
  // true → sleep was already auto-logged; modal just says "good morning"
  const [wasAutoLogged, setWasAutoLogged] = useState(false);

  // ---- refs (survive re-renders, readable inside interval/timer closures) --
  const samples = useRef<MotionSample[]>([]);
  const stillnessBegan = useRef<number | null>(null); // ms timestamp or null
  const autoLogged = useRef(false);
  const modalShownForEpisode = useRef(false);

  // Always-current prop snapshot so interval callbacks never close over
  // stale versions of getToken / onSleepLogged.
  const props = useRef({ getToken, onSleepLogged });
  props.current = { getToken, onSleepLogged };

  // =========================================================================
  // 1. Sensor capability & iOS 13+ permission
  // =========================================================================
  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setSensorReady(false); // desktop — no API at all
      return;
    }

    const requestPermissionFn =
      (DeviceMotionEvent as any).requestPermission as
        | (() => Promise<PermissionState>)
        | undefined;

    if (typeof requestPermissionFn === 'function') {
      // iOS 13+ — must call from a user gesture
      const onInteraction = async () => {
        try {
          const result = await requestPermissionFn();
          setSensorReady(result === 'granted');
        } catch {
          setSensorReady(false);
        }
        document.removeEventListener('touchstart', onInteraction);
        document.removeEventListener('click', onInteraction);
      };

      document.addEventListener('touchstart', onInteraction, { once: true });
      document.addEventListener('click', onInteraction, { once: true });
    } else {
      // Android Chrome, older Safari — no permission gate
      setSensorReady(true);
    }
  }, []);

  // =========================================================================
  // 2. Motion sampling — record acceleration magnitude every ~60 Hz
  //    (the browser fires at its native rate; we don't throttle so we get
  //    the richest signal for the stddev calculation)
  // =========================================================================
  useEffect(() => {
    if (!sensorReady) return;

    const onMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const mag = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      const buf = samples.current;
      const now = Date.now();

      buf.push({ t: now, mag });

      // Prune samples older than the rolling window
      const cutoff = now - SAMPLE_WINDOW_MS;
      while (buf.length > 0 && buf[0].t < cutoff) {
        buf.shift();
      }

      // Hard safety cap
      if (buf.length > MAX_BUFFER) {
        buf.splice(0, buf.length - 15_000);
      }
    };

    window.addEventListener('devicemotion', onMotion, { passive: true });
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [sensorReady]);

  // =========================================================================
  // 3. Periodic stillness analysis (every 30 s)
  // =========================================================================
  useEffect(() => {
    if (!sensorReady) return;

    const analyze = () => {
      const now = Date.now();
      const buf = samples.current;

      // ---- 3a. Determine current stillness --------------------------------
      const recent = buf.filter((s) => s.t >= now - RECENT_WINDOW_MS);
      if (recent.length < MIN_SAMPLES) return; // not enough data yet

      const sigma = stddev(recent.map((s) => s.mag));
      const isStill = sigma < STILLNESS_SIGMA_MAX;
      const sleepWin = inSleepWindow();

      // ---- 3b. State machine ---------------------------------------------
      if (isStill && sleepWin) {
        // Phone is sitting still during sleep hours.

        if (stillnessBegan.current === null) {
          // First tick where we're still — back-track to find the true onset
          stillnessBegan.current = findStillnessOnset(buf);
        }

        const duration = now - stillnessBegan.current;

        // 10+ min stillness → mark "likely asleep" (internal only)
        // 30+ min stillness → auto-log with no popup
        if (duration >= 30 * 60 * 1000 && !autoLogged.current) {
          autoLogged.current = true;
          logSleep(stillnessBegan.current);
        }
      } else if (!isStill) {
        // Phone moved (or we left the sleep window).

        if (stillnessBegan.current !== null) {
          const duration = now - stillnessBegan.current;

          // 10+ min of stillness followed by movement → optionally notify
          if (
            duration >= 10 * 60 * 1000 &&
            sleepWin &&
            !modalShownForEpisode.current
          ) {
            modalShownForEpisode.current = true;
            setStillMinutes(Math.round(duration / 60_000));
            setWasAutoLogged(autoLogged.current);
            setShowModal(true);
          }

          // Reset stillness tracking for the next episode
          stillnessBegan.current = null;
        }
      }

      // ---- 3c. Daytime reset -----------------------------------------------
      if (!sleepWin) {
        autoLogged.current = false;
        modalShownForEpisode.current = false;
        stillnessBegan.current = null;
      }
    };

    const timer = setInterval(analyze, TICK_MS);
    const initial = setTimeout(analyze, INITIAL_TICK_MS);

    return () => {
      clearInterval(timer);
      clearTimeout(initial);
    };
  }, [sensorReady]);

  // =========================================================================
  // 4. Sleep-log API call
  // =========================================================================
  const logSleep = useCallback(
    async (bedtimeMs: number) => {
      const token = props.current.getToken();
      if (!token) return;

      const now = new Date();
      const bedtime = new Date(bedtimeMs);

      try {
        const res = await fetch('/api/sleep/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: now.toISOString().slice(0, 10),
            bedtime: bedtime.toISOString(),
            wake_time: now.toISOString(),
            quality: 'fair',
            interruptions: 0,
            source: 'phone_sensor',
          }),
        });

        if (res.ok) {
          props.current.onSleepLogged?.();
        }
      } catch {
        // Silently fail — the user can always log manually
      }
    },
    [],
  );

  // =========================================================================
  // 5. Modal handlers
  // =========================================================================
  const handleConfirmSleep = useCallback(async () => {
    // Only POST when sleep *wasn't* already auto-logged (short-nap case)
    if (!wasAutoLogged) {
      const wakeTime = new Date();
      const bedtime = new Date(wakeTime.getTime() - stillMinutes * 60_000);
      await logSleep(bedtime.getTime());
    }
    setShowModal(false);
  }, [wasAutoLogged, stillMinutes, logSleep]);

  const handleDismiss = useCallback(() => {
    setShowModal(false);
  }, []);

  // =========================================================================
  // 6. Render
  // =========================================================================

  // Desktop / unsupported → render nothing (silent no-op, no console noise)
  if (sensorReady === false || sensorReady === null) return null;

  // No modal to display
  if (!showModal) return null;

  // ---- Wake-up / sleep-confirmation modal ---------------------------------
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? 'Good morning'
      : hour < 18
        ? 'Good afternoon'
        : 'Good evening';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        style={{
          background: '#1a1a2e',
          borderRadius: 16,
          padding: 40,
          maxWidth: 420,
          width: '90%',
          border: '1px solid #2a2a4e',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {wasAutoLogged ? '🌅' : '💤'}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 8,
          }}
        >
          {wasAutoLogged ? 'Welcome Back' : 'Were You Sleeping?'}
        </h2>

        {/* Body */}
        <p
          style={{
            fontSize: 14,
            color: '#94a3b8',
            marginBottom: 8,
            lineHeight: 1.5,
          }}
        >
          {greeting}! Your phone was still for{' '}
          <strong style={{ color: '#e2e8f0' }}>{stillMinutes}</strong> minutes.
        </p>

        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
          {wasAutoLogged
            ? 'We automatically logged your sleep. Hope you rested well!'
            : 'Would you like us to log this as sleep?'}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!wasAutoLogged && (
            <button
              onClick={handleConfirmSleep}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#0f3460',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                width: '100%',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  '#1a4a7a')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  '#0f3460')
              }
            >
              Yes, I was sleeping
            </button>
          )}

          <button
            onClick={handleDismiss}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: '1px solid #2a2a4e',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = '#ffffff')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = '#94a3b8')
            }
          >
            {wasAutoLogged ? 'Thanks!' : 'No, I was awake'}
          </button>
        </div>
      </div>
    </div>
  );
}
