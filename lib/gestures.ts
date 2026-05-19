import { useRef, useCallback, TouchEvent } from 'react';

// ─── Swipe Detection ───────────────────────────────
interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }: UseSwipeOptions) {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchEnd };
}

// ─── Pull-to-Refresh ───────────────────────────────
interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 80 }: UsePullToRefreshOptions) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullDistance = useRef(0);
  const refreshing = useRef(false);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || refreshing.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      pullDistance.current = Math.min(dy * 0.4, 120);
      if (indicatorRef.current) {
        indicatorRef.current.style.transform = `translateY(${pullDistance.current}px)`;
        indicatorRef.current.style.opacity = String(Math.min(pullDistance.current / threshold, 1));
      }
    }
  }, [threshold]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance.current >= threshold && !refreshing.current) {
      refreshing.current = true;
      if (indicatorRef.current) {
        indicatorRef.current.style.transform = 'translateY(40px)';
        indicatorRef.current.style.opacity = '1';
      }
      await onRefresh();
      refreshing.current = false;
    }

    pullDistance.current = 0;
    if (indicatorRef.current) {
      indicatorRef.current.style.transition = 'transform 300ms ease, opacity 300ms ease';
      indicatorRef.current.style.transform = 'translateY(0)';
      indicatorRef.current.style.opacity = '0';
      setTimeout(() => {
        if (indicatorRef.current) indicatorRef.current.style.transition = '';
      }, 300);
    }
  }, [onRefresh, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd, indicatorRef };
}
