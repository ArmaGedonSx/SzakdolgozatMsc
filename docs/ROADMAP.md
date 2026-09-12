# Chronos-RPG – Fejlesztési Irányok és Ütemterv (Roadmap)

Ez a dokumentum rögzíti a projekt legfrissebb fejlesztéseit, az elhárított hibákat, valamint a következő lehetséges mérföldköveket a szakdolgozati játékhoz.

---

## 1. Friss eredmények és elhárított hibák (Develop állapot)

1. **Játék közbeni HUD (Fejlécsáv) letisztítása:**
   - Új, kompakt fekete-arany-bronz keret a felső sávhoz a képernyő tetején.
   - Túlélési idő, zóna-célkitűzés (Objective) és közeledő horda/boss figyelmeztetések áttekinthető kijelzése.
   - Megölt ellenségek (Kills) és aktuális szintjelző letisztult elrendezése.
2. **Főmenü optimalizálás:**
   - A menüben lévő, felesleges inventory panel és gomb eltávolítása.
   - Szimmetrikus, 4 gombos elrendezés (Stages, Upgrades, Achievements, Settings / Play).
3. **Kritikus futásidejű hibajavítások:**
   - **`TypeError: Cannot read properties of null (reading 'Health')` elhárítva:** A futam befejezésekor/menübe kilépéskor a játékos referencia megsemmisülése már nem okoz unhandled promise rejectiont a `Game.play` és `update` ciklusokban.
   - **Cocos Creator `@property` figyelmeztetés elhárítva:** A `ZoneBackgroundSet` `zoneId` és prefab tömbjei explicit típusdeklarációt kaptak (`CCString`, `[Prefab]`, `[ZoneBackgroundSet]`).
   - **Target kompatibilitás:** A `ZoneResolver.ts` tömbindexelése biztonságos indexelésre cserélve.
4. **Minőségbiztosítás:**
   - Mind az 55 Jest tesztcsomag (170 egységteszt) hiba nélkül lefut.

---

## 2. Lehetséges fejlesztési irányok

### A. Futam végi összegző ablak (End-of-Run Summary Modal) – *Kiemelt prioritás*
- **Cél:** A roguelite játékciklus lezárása. Amikor a játékos meghal vagy lejár a túlélési célidő, egy modális ablak jelenik meg, amely összefoglalja az elért eredményeket:
  - Győzelem (Clear) vagy Vereség (Defeat) állapot.
  - Túlélési idő és elért karakterszint.
  - Megölt ellenségek száma, szerzett arany (+ első teljesítésért járó bónusz).
  - Értesítés új zóna feloldásáról vagy új rekordról (Highscore).
  - „Tovább a menübe” gomb.
- **Háttér:** A `GameRunCompletion` és `RunResultPresentation` már most kiszámítja ezeket, csupán a dedikált UI ablak hiányzik.

### B. Harci visszacsatolás és játékérzet (Game Feel & Combat Feedback)
- **Cél:** A harcok látványosabbá és érezhetőbbé tétele.
  - Alacsony életerő figyelmeztetés (pulzáló vörös vignetta/keret 25% HP alatt).
  - Figyelmeztető banner a képernyő közepén horda vagy boss megjelenésekor.
  - Találati felvillanás (hit flash) az ellenfeleken, lebegő sebzés-számok (floating combat text).

### C. Zónák, ellenségek és nehézségi egyensúly (Balancing & Content)
- **Cél:** A progression görbe finomhangolása.
  - A zónák spawn hullámainak (`ZoneEnemySpawnDirector`) és a bossok időzítésének kalibrálása.
  - Különböző ellenségtípusok sebességének, életerejének és aranyarányának tesztelése.

### D. Szakdolgozati metrikák és mérések (Thesis Focus)
- **Cél:** A dolgozat kutatási és mérési fejezeteinek megalapozása.
  - Object Pooling és memóriaterhelés mérése böngészőben/mobilon nagy ellenségszám (200+) mellett.
  - Architektúrális dokumentáció (Cocos Creator komponensmodell, Event-vezérelt kommunikáció, adatközpontú állapotkezelés).

---

## 3. Következő konkrét feladat

**End-of-Run Summary Modal megvalósítása:**
1. Új modális felület kialakítása (`RunSummaryModalWindow`).
2. Bekötése a `GameRunner` / `Game` folyamatba a futam lezárásakor (a jelenlegi közvetlen menü-újratöltés helyett).
3. Eredmények és feloldások átadása és vizuális megjelenítése.
