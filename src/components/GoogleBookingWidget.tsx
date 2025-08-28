'use client';

import React, { useMemo } from 'react';

interface GoogleBookingWidgetProps {
  src: string;
}

const GoogleBookingWidget: React.FC<GoogleBookingWidgetProps> = React.memo(({ src }) => {
  // Memoize the iframe HTML to prevent re-creation on every render
  const iframeHtml = useMemo(() => `
    <iframe
      src="${src}"
      style="border: 0; max-width: 1200px; width: 100%; height: 1400px; margin: 0 auto; display: block; background: transparent;"
      class="h-[1400px] md:h-[1000px]"
      frameborder="0"
    ></iframe>
  `, [src]);

  return (
    <div className="bg-white/75 rounded-lg p-4">
      <div dangerouslySetInnerHTML={{ __html: iframeHtml }} />
    </div>
  );
});

GoogleBookingWidget.displayName = 'GoogleBookingWidget';

export default GoogleBookingWidget;
