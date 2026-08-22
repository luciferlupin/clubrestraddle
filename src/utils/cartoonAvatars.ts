const avatarPalettes = [
  ['#ffd166', '#ef476f', '#7b2cbf'],
  ['#90e0ef', '#0077b6', '#ff9f1c'],
  ['#caffbf', '#2d6a4f', '#ff595e'],
  ['#f8c8dc', '#9d4edd', '#00b4d8'],
  ['#ffcad4', '#6d597a', '#f4a261'],
  ['#bde0fe', '#3a86ff', '#ff006e'],
] as const;

const encodeSvg = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

export const createCartoonAvatar = (variant = 0): string => {
  const index = Math.abs(variant) % avatarPalettes.length;
  const [background, hair, shirt] = avatarPalettes[index];
  const accessories = [
    '<path d="M26 47h16M58 47h16" stroke="#22172b" stroke-width="4" stroke-linecap="round"/><path d="M42 47h16" stroke="#22172b" stroke-width="3"/>',
    '<path d="M27 43q8-9 16 0M57 43q8-9 16 0" fill="none" stroke="#22172b" stroke-width="4" stroke-linecap="round"/>',
    '<circle cx="34" cy="47" r="9" fill="none" stroke="#22172b" stroke-width="4"/><circle cx="66" cy="47" r="9" fill="none" stroke="#22172b" stroke-width="4"/><path d="M43 47h14" stroke="#22172b" stroke-width="3"/>',
    '<path d="M29 43l10 7-10 7M71 43l-10 7 10 7" fill="none" stroke="#22172b" stroke-width="4" stroke-linecap="round"/>',
    '<circle cx="34" cy="47" r="4" fill="#22172b"/><circle cx="66" cy="47" r="4" fill="#22172b"/><path d="M25 38q9-7 18 0M57 38q9-7 18 0" fill="none" stroke="#22172b" stroke-width="4" stroke-linecap="round"/>',
    '<path d="M27 47h14M59 47h14" stroke="#22172b" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="47" r="2" fill="#fff"/><circle cx="66" cy="47" r="2" fill="#fff"/>',
  ][index];
  const mouths = [
    'M38 64q12 15 24 0', 'M39 66q11-8 22 0', 'M37 63q13 19 26 0',
    'M40 65h20', 'M38 64q12 13 24 0', 'M39 62q11 18 22 0',
  ];

  return encodeSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="28" fill="${background}"/>
    <path d="M12 100q5-28 38-28t38 28" fill="${shirt}"/>
    <circle cx="50" cy="49" r="31" fill="#f7c9a9"/>
    <path d="M20 44q0-31 30-31 29 0 31 28-13-8-22-19-10 15-39 22z" fill="${hair}"/>
    <circle cx="18" cy="51" r="7" fill="#f7c9a9"/><circle cx="82" cy="51" r="7" fill="#f7c9a9"/>
    ${accessories}
    <path d="${mouths[index]}" fill="none" stroke="#8b3553" stroke-width="4" stroke-linecap="round"/>
    <path d="M47 53q3 4 6 0" fill="none" stroke="#d08b73" stroke-width="3" stroke-linecap="round"/>
  </svg>`);
};

export const CARTOON_AVATARS = Array.from({ length: 6 }, (_, index) => ({
  label: `Funny cartoon avatar ${index + 1}`,
  url: createCartoonAvatar(index),
}));

export const cartoonAvatarForPlayer = (playerIdOrName: string): string => {
  const seed = Array.from(playerIdOrName).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return createCartoonAvatar(seed);
};
