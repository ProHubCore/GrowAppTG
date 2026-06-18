function FlyingLoot({ lootItems }) {
  return (
    <div className="flying-loot-layer" aria-hidden="true">
      {lootItems.map((item) => (
        <div
          key={item.id}
          className="flying-loot-item"
          style={{
            left: `${item.startX}px`,
            top: `${item.startY}px`,
            animationDelay: `${item.delay}ms`,
          }}
        >
          {item.image ? (
            <img src={item.image} alt="" draggable="false" />
          ) : (
            <span>{item.icon || "🌿"}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default FlyingLoot;
