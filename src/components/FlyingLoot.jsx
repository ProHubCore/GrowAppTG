function FlyingLoot({ lootItems }) {
  return (
    <div className="flying-loot-layer">
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
          🍅
        </div>
      ))}
    </div>
  );
}

export default FlyingLoot;