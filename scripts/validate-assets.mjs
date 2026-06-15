import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { allAssets } from "../src/core/assets/assetCatalog.js";
import { CROPS } from "../src/features/plantation/data/crops.js";

const errors = [];
const seenIds = new Set();
const seenSlugs = new Set();

for (const assetPath of allAssets) {
  if (!assetPath.startsWith("/assets/")) {
    errors.push(`Некорректный путь ассета: ${assetPath}`);
    continue;
  }

  const filePath = resolve("public", assetPath.slice(1));
  if (!existsSync(filePath)) {
    errors.push(`Файл не найден: ${assetPath}`);
  }
}

for (const crop of CROPS) {
  if (!crop.id || !crop.slug || !crop.name) {
    errors.push(`У культуры отсутствует id, slug или name: ${JSON.stringify(crop)}`);
    continue;
  }

  if (seenIds.has(crop.id)) errors.push(`Повторяющийся id культуры: ${crop.id}`);
  if (seenSlugs.has(crop.slug)) errors.push(`Повторяющийся slug культуры: ${crop.slug}`);
  seenIds.add(crop.id);
  seenSlugs.add(crop.slug);

  if (!Array.isArray(crop.stages) || crop.stages.length !== 3) {
    errors.push(`${crop.name}: должно быть ровно три стадии роста`);
  }

  crop.stages?.forEach((stage, index) => {
    if (!stage.image || !stage.name) {
      errors.push(`${crop.name}: стадия ${index + 1} заполнена не полностью`);
    }
  });

  if (!crop.infiniteSeeds && !crop.shop) {
    errors.push(`${crop.name}: для конечных семян не настроена продажа в магазине`);
  }
}

if (errors.length > 0) {
  console.error("\nПроверка структуры GrowApp завершилась с ошибками:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Проверено ассетов: ${allAssets.length}`);
console.log(`Проверено культур: ${CROPS.length}`);
console.log("Структура ассетов и каталога культур корректна.");
