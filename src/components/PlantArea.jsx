import Pot from "./Pot";
import Plant from "./Plant";
import "./PlantArea.css";

function PlantArea({ pot, plant, canCollect, onCollect }) {
  return (
    <div className="plant-area">
      {plant && (
        <Plant
          plant={plant}
          canCollect={canCollect}
          onCollect={onCollect}
        />
      )}

      <Pot pot={pot} />
    </div>
  );
}

export default PlantArea;