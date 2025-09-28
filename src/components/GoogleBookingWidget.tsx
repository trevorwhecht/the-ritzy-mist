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
      style="border: 0; max-width: 1200px; width: 100%; height: 3000px; margin: 0 auto; display: block; background: transparent; overflow: hidden;"
      class="h-[3000px] md:h-[1200px]"
      frameborder="0"
      scrolling="no"
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
