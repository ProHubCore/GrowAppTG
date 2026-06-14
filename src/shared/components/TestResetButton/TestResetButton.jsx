import "./TestResetButton.css";

function TestResetButton({ onClick, disabled = false }) {
  return (
    <button
      className="test-reset-button"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      Сбросить всё
    </button>
  );
}

export default TestResetButton;
