const COIN_LAYOUTS = {
  1: [
    { x: 50, y: 49, scale: 1.12, rotate: -4 },
  ],
  3: [
    { x: 50, y: 34, scale: 1.06, rotate: -3 },
    { x: 36, y: 61, scale: 0.94, rotate: -11 },
    { x: 64, y: 61, scale: 0.94, rotate: 10 },
  ],
  5: [
    { x: 39, y: 37, scale: 1.00, rotate: -8 },
    { x: 61, y: 37, scale: 1.00, rotate: 8 },
    { x: 28, y: 65, scale: 0.89, rotate: -13 },
    { x: 50, y: 66, scale: 0.94, rotate: 0 },
    { x: 72, y: 65, scale: 0.89, rotate: 13 },
  ],
  9: [
    { x: 31, y: 32, scale: 0.91, rotate: -10 },
    { x: 50, y: 27, scale: 1.02, rotate: -1 },
    { x: 69, y: 32, scale: 0.91, rotate: 10 },
    { x: 18, y: 57, scale: 0.80, rotate: -15 },
    { x: 39, y: 55, scale: 0.90, rotate: -6 },
    { x: 61, y: 55, scale: 0.90, rotate: 6 },
    { x: 82, y: 57, scale: 0.80, rotate: 15 },
    { x: 36, y: 77, scale: 0.78, rotate: -7 },
    { x: 64, y: 77, scale: 0.78, rotate: 7 },
  ],
};

function resolveLayout(count) {
  if (count >= 9) return COIN_LAYOUTS[9];
  if (count >= 5) return COIN_LAYOUTS[5];
  if (count >= 3) return COIN_LAYOUTS[3];
  return COIN_LAYOUTS[1];
}

export default function CurrencyCoinPile({ type = "premium", count = 1 }) {
  const layout = resolveLayout(Math.max(1, Number(count) || 1));

  return (
    <span
      className={`currency-coin-pile currency-coin-pile--${type} currency-coin-pile--count-${layout.length}`}
      aria-hidden="true"
    >
      <span className="currency-coin-pile__halo" />
      {layout.map((coin, index) => (
        <i
          key={index}
          className="currency-coin-pile__coin"
          style={{
            "--coin-x": `${coin.x}%`,
            "--coin-y": `${coin.y}%`,
            "--coin-scale": coin.scale,
            "--coin-rotate": `${coin.rotate}deg`,
            "--coin-z": layout.length - index,
          }}
        />
      ))}
      <span className="currency-coin-pile__spark currency-coin-pile__spark--one" />
      <span className="currency-coin-pile__spark currency-coin-pile__spark--two" />
    </span>
  );
}
