import { useEffect } from 'react';
import { Platform } from 'react-native';
import { analytics } from '../analytics/posthog';

interface FrameMetrics {
  avgFps: number;
  droppedFrames: number;
  severeDrops: number; // >100ms frames
  jankRate: number;
}

class FrameMonitor {
  private frameCount = 0;
  private lastFrameTime = 0;
  private droppedFrames = 0;
  private severeDrops = 0;
  private totalFrameTime = 0;
  private isRunning = false;
  private rafId: number | null = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private loop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = now - this.lastFrameTime;

    if (delta > 16.67) { // Missed 60fps frame
      this.droppedFrames++;
      if (delta > 100) {
        this.severeDrops++;
      }
    }

    this.totalFrameTime += delta;
    this.frameCount++;
    this.lastFrameTime = now;

    // Report every 5 seconds (approx 300 frames)
    if (this.frameCount >= 300) {
      this.report();
      this.reset();
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private report() {
    const avgFrameTime = this.totalFrameTime / this.frameCount;
    const avgFps = 1000 / avgFrameTime;
    const jankRate = this.droppedFrames / this.frameCount;

    // Only report if performance is concerning
    if (avgFps < 55 || jankRate > 0.05 || this.severeDrops > 0) {
      analytics.capture('performance_issue', {
        avg_fps: Math.round(avgFps * 10) / 10,
        dropped_frames: this.droppedFrames,
        severe_drops: this.severeDrops,
        jank_rate: Math.round(jankRate * 1000) / 1000,
        platform: Platform.OS,
        screen: 'unknown', // Inject from navigation context in production
      });
    }
  }

  private reset() {
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.severeDrops = 0;
    this.totalFrameTime = 0;
  }

  getMetrics(): FrameMetrics {
    const avgFrameTime = this.totalFrameTime / Math.max(this.frameCount, 1);
    return {
      avgFps: 1000 / avgFrameTime,
      droppedFrames: this.droppedFrames,
      severeDrops: this.severeDrops,
      jankRate: this.droppedFrames / Math.max(this.frameCount, 1),
    };
  }
}

export const frameMonitor = new FrameMonitor();

// React hook for screen-level monitoring
export function useFrameMonitor(screenName: string) {
  useEffect(() => {
    frameMonitor.start();
    return () => frameMonitor.stop();
  }, []);
}
