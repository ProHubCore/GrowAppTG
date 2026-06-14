import { ASSETS } from "../../../core/assets/assetCatalog";
import { useState } from "react";
import { HARVEST_QUALITIES } from "../../plantation/data/harvestQuality";
import { QUALITY_PRICE_MULTIPLIERS, getQualityAmount } from "../../plantation/data/qualityInventory";

const ITEMS = {
  greenTomato: { name: "Кислоплод", icon: "🟢", basePrice: 4 },
  lumenweed: { name: "Люмен-трава", image: ASSETS.plants.lumenweed[2], basePrice: 10 },
  moonmint: { name: "Лунная мята", icon: "🌿", basePrice: 8 },
  velvetbud: { name: "Бархатный бутон", icon: "🌺", basePrice: 15 },
  psychoshroom: { name: "Психомор", icon: "🍄", basePrice: 24 },
  bluecap: { name: "Синий колпак", icon: "🔵", basePrice: 34 },
  starleaf: { name: "Звёздный лист", icon: "✨", basePrice: 18 },
  emberpod: { name: "Жар-стручок", icon: "🔥", basePrice: 26 },
  dreamcap: { name: "Сонный колпак", icon: "🌙", basePrice: 30 },
  ghostmorel: { name: "Призрачный сморчок", icon: "👻", basePrice: 48 },
};

export default function InventoryModal({ isOpen, qualityInventory = {}, onClose, onDeleteQualityItem }) {
  const [selected, setSelected] = useState(null);
  if (!isOpen) return null;
  const stacks = [];
  Object.entries(ITEMS).forEach(([itemId, item]) => {
    HARVEST_QUALITIES.forEach((quality) => {
      const count = getQualityAmount(qualityInventory, itemId, quality.id);
      if (count > 0) stacks.push({ itemId, qualityId: quality.id, count, item, quality });
    });
  });
  return <div className="modal-overlay"><div className="inventory-modal">
    <button className="modal-close" type="button" onClick={() => {setSelected(null);onClose();}}>×</button>
    <div className="modal-title">Инвентарь качества</div>
    <div className="modal-subtitle">Каждое качество хранится и продаётся отдельно</div>
    <div className="inventory-grid">
      {Array.from({length:12},(_,i)=>stacks[i]||null).map((stack,i)=><button key={stack?`${stack.itemId}-${stack.qualityId}`:`empty-${i}`} className={stack?"inventory-slot":"inventory-slot empty"} type="button" onClick={()=>stack&&setSelected(stack)}>
        {stack && <>{stack.item.image?<img src={stack.item.image} alt="" style={{width:48,height:48,objectFit:"contain"}}/>:<span style={{fontSize:30}}>{stack.item.icon}</span>}<span style={{position:"absolute",left:4,top:4,fontSize:11}}>{stack.quality.icon}</span><div className="inventory-count">x{stack.count}</div></>}
      </button>)}
    </div>
    <div className="inventory-hint">Качество повышает цену и репутацию при продаже клубу.</div>
    {selected && <div className="inventory-action-panel"><div className="inventory-selected-item"><span style={{fontSize:48}}>{selected.item.icon||selected.quality.icon}</span><div><div className="seed-name">{selected.item.name}</div><div className="seed-description">{selected.quality.icon} {selected.quality.name} · x{selected.count}</div><div className="seed-description">Ориентир цены: {Math.round(selected.item.basePrice * QUALITY_PRICE_MULTIPLIERS[selected.qualityId])} монет/шт.</div></div></div><div className="modal-actions"><button className="cancel-button" onClick={()=>setSelected(null)}>Отмена</button><button className="delete-button" onClick={()=>{onDeleteQualityItem(selected.itemId,selected.qualityId,selected.count);setSelected(null);}}>Удалить</button></div></div>}
  </div></div>;
}
