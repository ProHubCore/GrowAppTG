function ClubDealer({ onClick }) {
  return (
    <button
      className="club-dealer"
      type="button"
      onClick={onClick}
      aria-label="Поговорить с продавцом"
    >
      <div className="club-dealer__hitbox" />
    </button>
  );
}

export default ClubDealer;