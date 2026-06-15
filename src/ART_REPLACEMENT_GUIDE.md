# Ассеты GrowApp

Все пути к изображениям собраны в `src/core/assets/assetCatalog.js`. Компоненты не должны разбрасывать по коду случайные строки вида `/assets/...`.

## Текущая структура

```text
public/assets/
  backgrounds/
    plantation.png
    district.png
    shop.png
    club.png
  buildings/
    club.png
    shop.png
    maria-ivanovna-house.png
  characters/
    club-dealer.png
    maria-ivanovna.png
  containers/
    basic-soil-bucket.png
    hydro-soil-bucket.png
    myco-bioreactor.png
  locations/maria-ivanovna-house/
    background.png
    quest-board.png
    radio.png
  plants/<slug>/
    stage-1.png
    stage-2.png
    stage-3.png
  seed-packets/
  tools/
  ui/
```

## Как заменить существующую картинку

Самый безопасный вариант — заменить PNG по тому же пути и с тем же именем. Код и сохранения тогда не меняются.

## Как добавить новую культуру

1. Создать папку `public/assets/plants/<slug>/`.
2. Положить туда `stage-1.png`, `stage-2.png`, `stage-3.png`.
3. Добавить три пути в `src/core/assets/assetCatalog.js`.
4. Добавить одну запись в `src/features/plantation/data/crops.js`.

После этого посадка, магазин, инвентарь, клуб и каталог подхватят культуру автоматически.

## Требования к PNG растений

- прозрачный фон без нарисованной шахматной сетки;
- основание стебля или грибницы в одинаковой точке всех трёх стадий;
- одинаковые внешние поля у последовательных стадий;
- без земли, ведра и лишнего декора вокруг корней;
- читаемый силуэт на маленьком экране;
- RGB/RGBA PNG, желательно до 2048 px по длинной стороне.

## Сцена и адаптивность

Внутренняя игровая сцена имеет размер `390 × 844` и масштабируется целиком. Объекты внутри неё позиционируются относительно `.game-stage`, а не через `vw` и `vh`.

```css
.my-object {
  position: absolute;
  left: 50%;
  bottom: 120px;
  width: 180px;
  transform: translateX(-50%);
}
```

Не привязывай элементы сцены напрямую к размеру окна браузера: это вызывает прыжки объектов на разных телефонах.
