import { ReactNode, useEffect, useState } from 'react';

interface LiveRegionProps {
  children: ReactNode;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  role?: 'status' | 'alert' | 'log';
  clearAfter?: number; // Clear message after N milliseconds
}

export default function LiveRegion({
  children,
  'aria-live': ariaLive = 'polite',
  'aria-atomic': ariaAtomic = true,
  role = 'status',
  clearAfter,
}: LiveRegionProps) {
  const [content, setContent] = useState<ReactNode>(children);

  useEffect(() => {
    setContent(children);

    if (clearAfter && children) {
      const timer = setTimeout(() => {
        setContent(null);
      }, clearAfter);
      return () => clearTimeout(timer);
    }
  }, [children, clearAfter]);

  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className="sr-only"
    >
      {content}
    </div>
  );
}

// Hook for programmatic announcements
export function useAnnounce() {
  const [message, setMessage] = useState<string | null>(null);

  const announce = (text: string, clearAfter = 5000) => {
    setMessage(text);
    if (clearAfter > 0) {
      setTimeout(() => setMessage(null), clearAfter);
    }
  };

  const LiveRegionComponent = () => (
    <LiveRegion aria-live="polite" clearAfter={5000}>
      {message}
    </LiveRegion>
  );

  return { announce, LiveRegion: LiveRegionComponent };
}
