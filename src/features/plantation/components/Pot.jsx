function Pot({ pot }) {
  if (pot?.image) return <img className="pot" src={pot.image} alt={pot.name} />;
  return <div className="pot pot-emoji" aria-label={pot?.name || "Ёмкость"}>{pot?.icon || "🪴"}</div>;
}
export default Pot;
