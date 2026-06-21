import "./CareItemIcon.css";

export default function CareItemIcon({ type = "nutrition", className = "" }) {
  const safeType = ["nutrition", "mariaMix", "acidWater"].includes(type)
    ? type
    : "nutrition";

  return (
    <span className={`care-item-icon care-item-icon--${safeType}${className ? ` ${className}` : ""}`} aria-hidden="true">
      <svg viewBox="0 0 64 78" focusable="false">
        <path className="care-item-icon__shadow" d="M14 68c4 7 32 8 38 0-7-5-31-5-38 0Z" />
        <path className="care-item-icon__cork" d="M24 7h16v12H24z" />
        <path className="care-item-icon__neck" d="M22 16h20v11H22z" />
        <path className="care-item-icon__glass" d="M18 25c-4 8-7 17-7 28 0 12 8 18 21 18s21-6 21-18c0-11-3-20-7-28H18Z" />
        <path className="care-item-icon__liquid" d="M14 47c7-4 28-4 36 0v10c0 8-6 12-18 12S14 65 14 57V47Z" />
        <path className="care-item-icon__shine" d="M21 29c-4 8-5 17-4 24" />
        {safeType === "nutrition" && (
          <>
            <path className="care-item-icon__mark" d="M31 54c-8-1-11-8-7-13 8 1 12 5 12 11 3-6 7-9 13-9-1 8-7 13-15 13" />
            <path className="care-item-icon__mark-line" d="M33 57c0-7-2-11-7-14m8 11c4-5 8-7 12-8" />
          </>
        )}
        {safeType === "mariaMix" && (
          <>
            <path className="care-item-icon__mark" d="m32 39 4 9 10 1-8 6 3 10-9-5-9 5 3-10-8-6 10-1 4-9Z" />
            <circle className="care-item-icon__spark" cx="46" cy="37" r="2" />
          </>
        )}
        {safeType === "acidWater" && (
          <>
            <circle className="care-item-icon__mark" cx="32" cy="51" r="10" />
            <circle className="care-item-icon__eye" cx="28" cy="49" r="2" />
            <circle className="care-item-icon__eye" cx="36" cy="49" r="2" />
            <path className="care-item-icon__mouth" d="M27 57h10m-8-3 1 5m4-5-1 5" />
          </>
        )}
      </svg>
    </span>
  );
}
