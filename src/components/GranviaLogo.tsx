interface GranviaLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  iconColor?: string;
  accentColor?: string;
}

const LOGO_SRC = '/granvia-logo.png';
const LOGO_ASPECT_RATIO = 595 / 1070;

export default function GranviaLogo({
  size = 48,
  showText = true,
}: GranviaLogoProps) {
  const logoHeight = showText ? size * 1.2 : size;
  const logoWidth = logoHeight * LOGO_ASPECT_RATIO;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src={LOGO_SRC}
        alt="Granvia Logo"
        style={{
          width: logoWidth,
          height: logoHeight,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}
