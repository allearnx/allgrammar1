declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

let apiLoaded = false;
let apiLoadPromise: Promise<void> | null = null;

export function loadYouTubeAPI(): Promise<void> {
  if (apiLoaded && window.YT?.Player) {
    return Promise.resolve();
  }

  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise<void>((resolve) => {
    if (window.YT?.Player) {
      apiLoaded = true;
      resolve();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      resolve();
    };
  });

  return apiLoadPromise;
}

export interface YouTubePlayerOptions {
  videoId: string;
  elementId: string;
  onReady?: (player: YT.Player) => void;
  onStateChange?: (event: YT.OnStateChangeEvent) => void;
  onError?: (event: YT.OnErrorEvent) => void;
}

export async function createYouTubePlayer(options: YouTubePlayerOptions): Promise<YT.Player> {
  await loadYouTubeAPI();

  return new window.YT.Player(options.elementId, {
    videoId: options.videoId,
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
      cc_load_policy: 0,
    },
    events: {
      onReady: (event) => options.onReady?.(event.target),
      onStateChange: options.onStateChange,
      onError: options.onError,
    },
  });
}
