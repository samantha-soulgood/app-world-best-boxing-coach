import React from 'react';

export const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinejoin="round"
    strokeMiterlimit="2"
  >
    <path
      fill="#00274c" // Navy Blue
      d="M175.32,59.388c-2.48,-9.94 -10.15,-19.98 -19.04,-25.92 -10.32,-6.89 -22.3,-10.88 -34.8,-11.52 -13.91,-0.72 -28.78,1.46 -40.59,8.44 -11.53,6.8 -19.4,18.25 -22.18,31.29 -2.48,11.64 -0.02,24.1 3.53,35.97 1.89,6.34 2.8,13.27 4.26,19.74 3.49,15.42 10.31,29.36 21.05,40.83 11.23,12.01 26.2,19.59 42.66,21.81 16.89,2.29 34.1,-0.12 48.06,-8.77 14.15,-8.75 24.31,-23.11 28.18,-38.75 2.11,-8.53 3.01,-17.41 3.01,-26.24 0,-15.82 -3.73,-31.25 -10.07,-44.88Z"
    />
    <path
      fill="none"
      stroke="#ffcb05" // Yellow/Gold
      strokeWidth="4"
      d="M175.32,59.388c-2.48,-9.94 -10.15,-19.98 -19.04,-25.92 -10.32,-6.89 -22.3,-10.88 -34.8,-11.52 -13.91,-0.72 -28.78,1.46 -40.59,8.44 -11.53,6.8 -19.4,18.25 -22.18,31.29 -2.48,11.64 -0.02,24.1 3.53,35.97 1.89,6.34 2.8,13.27 4.26,19.74 3.49,15.42 10.31,29.36 21.05,40.83 11.23,12.01 26.2,19.59 42.66,21.81 16.89,2.29 34.1,-0.12 48.06,-8.77 14.15,-8.75 24.31,-23.11 28.18,-38.75 2.11,-8.53 3.01,-17.41 3.01,-26.24 0,-15.82 -3.73,-31.25 -10.07,-44.88Z"
    />
    <path
      fill="#00274c"
      d="M106.33,79.038c-3.13,-12.54 -12.8,-25.21 -24.01,-32.7 -13.06,-8.73 -28.14,-13.72 -43.89,-14.53l0,43.2c0.23,1.38 0.44,2.77 0.63,4.15 1.13,7.99 1.96,16.2 3.51,24.18 3.73,19.2 12.04,36.56 25.86,49.19 8.23,7.52 18.67,12.28 29.83,14.01l0,-65.3c-0.12,-0.9 -0.25,-1.8 -0.38,-2.7 -0.73,-5.15 -1.26,-10.42 -2.13,-15.6 -2.1,-12.48 -5.61,-24.16 -10.63,-35.1l21.21,25.2Z"
    />
    <path
      fill="none"
      stroke="#ffcb05"
      strokeWidth="4"
      d="M106.33,79.038c-3.13,-12.54 -12.8,-25.21 -24.01,-32.7 -13.06,-8.73 -28.14,-13.72 -43.89,-14.53l0,43.2c0.23,1.38 0.44,2.77 0.63,4.15 1.13,7.99 1.96,16.2 3.51,24.18 3.73,19.2 12.04,36.56 25.86,49.19 8.23,7.52 18.67,12.28 29.83,14.01l0,-65.3c-0.12,-0.9 -0.25,-1.8 -0.38,-2.7 -0.73,-5.15 -1.26,-10.42 -2.13,-15.6 -2.1,-12.48 -5.61,-24.16 -10.63,-35.1l21.21,25.2Z"
    />
    <circle fill="#ffcb05" cx="72.11" cy="62.058" r="3.73" />
    <circle fill="#ffcb05" cx="59.07" cy="69.728" r="3.73" />
    <circle fill="#ffcb05" cx="60.29" cy="54.218" r="3.73" />
    <circle fill="#ffcb05" cx="73.1" cy="49.578" r="3.73" />
    <path fill="none" stroke="#ffcb05" strokeWidth="2" d="M62.02,67.6l8.48,-11.23" />
    <path fill="none" stroke="#ffcb05" strokeWidth="2" d="M72.59,65.89l-10.37,-9.62" />
  </svg>
);

export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

export const YouTubeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10C2.5 6 7.5 4 12 4s9.5 2 9.5 3a24.12 24.12 0 0 1 0 10c0 1-5 3-9.5 3s-9.5-2-9.5-3Z" />
        <path d="m10 15 5-3-5-3z" />
    </svg>
);

export const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m22 2-7 20-4-9-9-4Z"/>
        <path d="M22 2 11 13"/>
    </svg>
);

export const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

export const PlayCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="10 8 16 12 10 16 10 8"></polygon>
  </svg>
);

export const PauseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </svg>
);

export const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
  </svg>
);

export const SkipForwardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="5 4 15 12 5 20 5 4"></polygon>
    <line x1="19" y1="5" x2="19" y2="19"></line>
  </svg>
);

export const RestIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"></path>
    <path d="M12 6v6l4 2"></path>
  </svg>
);

export const VolumeOnIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
  </svg>
);

export const VolumeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <line x1="23" y1="9" x2="17" y2="15"></line>
    <line x1="17" y1="9" x2="23" y2="15"></line>
  </svg>
);

export const ThumbsUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 10v12" />
    <path d="M18 10h-5.41l.93-4.65a2 2 0 0 0-1.05-2.26L11 2 4 9v11h11.28a2 2 0 0 0 2-1.76l1-7A2 2 0 0 0 18 10Z" />
  </svg>
);

export const ThumbsDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 14V2" />
    <path d="M6 14H.59l-.93 4.65a2 2 0 0 0 1.05 2.26L2 22l7-7V4H7.72a2 2 0 0 0-2 1.76l-1 7A2 2 0 0 0 6 14Z" />
  </svg>
);