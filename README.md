# CarbonScope

🔗 [💻 Preizkusi našo spletno stran - CarbonScope](https://carbonscope.onrender.com)

## Opis in vizija projekta

CarbonScope je interaktivna spletna aplikacija, zasnovana za poglobljeno analizo in vizualizacijo emisij CO₂ v Sloveniji in po svetu. Aplikacija združuje zanesljive podatke iz različnih virov, kot so CSV datoteke in druge oblike podatkovnih datotek, pridobljenih iz priznanih spletnih strani. Z uporabo naprednih vizualizacijskih orodij, kot so dinamični grafi, interaktivni zemljevidi, animacije trendov, napovedni modeli omogoča uporabnikom celovit vpogled v razvoj emisij skozi čas, primerjavo med državami, sektorji in regijami ter izračun ogljičnega odtisa (npr. za potovanja ali vsakodnevno porabo).

Vizija projekta je ustvariti pregledno in privlačno platformo, ki z uporabo raznolikih podatkov o emisijah CO₂ z vsega sveta in posebej za Slovenijo osvetljuje trende, vzorce in vplive podnebnih sprememb. CarbonScope želi z interaktivnimi vizualizacijami, napovednimi modeli in orodji, kot so kalkulatorji ogljičnega odtisa, omogočiti uporabnikom, da razumejo in zmanjšajo svoj vpliv na okolje.



## Vsebina

- [🔝 CarbonScope](#carbonscope)
- [🌟 Opis in vizija projekta](#opis-in-vizija-projekta)
- [⚙️ Funkcionalnosti](#funkcionalnosti)
  - [🌍 Svetovni pogled](#🌍-svetovni-pogled)
  - [🚶‍♂️ Kalkulator emisij glede na način prevoza](#🚶‍♂️-kalkulator-emisij-glede-na-način-prevoza)
  - [🇸🇮 Analiza emisij za Slovenijo](#🇸🇮-analiza-emisij-za-slovenijo)
- [🧪 Tehnološki sklad](#tehnološki-sklad)
  - [🔧 Frontend](#🔧-frontend)
  - [🗂️ Podatkovni viri](#🗂️-podatkovni-viri)
  - [📈 Vizualizacija](#📈-vizualizacija)
  - [🤖 Modeli in napovedi](#🤖-modeli-in-napovedi)
- [💻 Namestitev in nadaljnji razvoj](#namestitev-in-nadaljnji-razvoj)
  - [🛠️ Lokalna namestitev](#🔧-lokalna-namestitev)
  - [🚀 Nadaljnji razvoj](#🔮-nadaljnji-razvoj)
- [📊 Podatkovni viri](#podatkovni-viri)
  - [🌍 Svetovni podatki o emisijah CO₂](#🌍-svetovni-podatki-o-emisijah-co₂)
  - [🇸🇮 Slovenski podatki](#🇸🇮-slovenski-podatki)
  - [📈 Napovedi emisij](#📈-napovedi-emisij)
  - [💻 Uporabljeni GitHub repozitorij za podatke](#💻-uporabljeni-github-repozitorij-za-podatke)
- [📓 Napovedni modeli (Jupyter Notebook)](#napovedni-modeli-jupyter-notebook)
- [👨‍💻 Avtorji](#avtorji)



## Funkcionalnosti

### Svetovni pogled

- Interaktivna primerjava emisij CO₂ med državami.
- Vizualizacija svetovnih emisij po sektorjih (promet, energetika, industrija itd.).
- Prikaz zgodovinskih trendov emisij skozi čas (po državah in globalno).
- Interaktivni svetovni zemljevid z emisijami CO₂ in podatki o populaciji.
- Napoved prihodnjih svetovnih emisij na podlagi učnega modela.

### Kalkulator emisij glede na način prevoza

- Uporabnik lahko izbere dve točki in primerja, koliko emisij CO₂ povzroči pot:
  - peš
  - s kolesom
  - z avtom
  - z avtobusom
  - z letalom
- Prikaz emisij in prihrankov v g CO₂ za vsako izbiro.

### Analiza emisij za Slovenijo

- Emisije CO₂ na prebivalca skozi leta.
- Razčlenitev emisij po vrsti goriva (premog, plin, obnovljivi viri ipd.).
- Prikaz emisij po sektorjih (promet, industrija, stanovanjski sektor, kmetijstvo, ipd.).
- Interaktivni zemljevid emisij po regijah.
- Napoved emisij v prihodnosti na podlagi lokalno prilagojenega modela.

## Tehnološki sklad

Pri razvoju projekta CarbonScope so uporabljene naslednje tehnologije in podatkovne oblike:

### Frontend

- **Node.js** – okolje za izvajanje JavaScript kode na strežni strani.
- **Express.js** – minimalistični spletni strežnik za izdelavo API-jev in strežbo vsebine.
- **JavaScript (ES6+)** – logika za interakcijo, prikaz podatkov, delo z API-ji in dogodki.
- **Bootstrap 5** – za hitro postavitev odzivnega in estetskega vmesnika.
- **CSS** – za dodatno prilagajanje izgleda komponent.
- **Leaflet** (in/ali Mapbox) – za prikaz interaktivnih zemljevidov z emisijami in populacijo.

### Podatkovni viri

- **CSV datoteke** – za hranjenje strukturiranih podatkov (emisije po letih, sektorjih, regijah, državah ipd.).
- **GeoJSON datoteke** – za prikaz zemljevidov (slovenske regije, svetovne države).
- **Ročno pripravljeni ali uvoženi nabori podatkov** iz javno dostopnih virov (npr. Our World in Data, Statistični urad RS, IEA).

### Vizualizacija

- **Chart.js** / **Recharts** – za prikaz linijskih, stolpčnih in tortnih grafov.
- **Interaktivni zemljevidi** z označenimi regijami ali državami ter podatki ob prehodu miške.

### Modeli in napovedi

- **Umetna inteligenca / strojno učenje** (osnovni napovedni model): za projekcijo emisij CO₂ v prihodnosti, na svetovni in nacionalni ravni.
- Napovedni modeli so osnovani na časovnih vrstah iz zgodovinskih podatkov.

## Namestitev in nadaljnji razvoj

### Lokalna namestitev

Za lokalni zagon projekta CO2-Odtis sledite naslednjim korakom:

1. Klonirajte repozitorij:
   ```bash
   git clone https://github.com/Freak4e/CarbonScope.git
   ```

2. Premaknite se v mapo projekta:
   ```bash
   cd CarbonScope
   ```

3. Namestite vse odvisnosti:
   ```bash
   npm install
   ```

4. Zaženite razvojni strežnik:
   ```bash
   npm run dev
   ```

5. Odprite brskalnik in obiščite:
   ```
   http://localhost:3000
   ```

Projekt bo zagnan lokalno v razvojnem okolju.

---

### Nadaljnji razvoj

Možnosti za nadgradnjo in razširitev projekta vključujejo:

- Integracija z realnimi API-ji za dinamične posodobitve podatkov (npr. podatki v živo).
- Izboljšava napovednega modela z uporabo naprednejših tehnik (npr. LSTM, regresija, Prophet).
- Uporaba podatkovnih baz (npr. PostgreSQL ali Firebase) za shranjevanje podatkov namesto CSV.
- Dodajanje uporabniških profilov z možnostjo spremljanja osebnega ogljičnega odtisa.
- Večjezična podpora (angleščina/slovenščina).
- Mobilna optimizacija in PWA (Progressive Web App) različica.

## Podatkovni viri

Pri izdelavi projekta CarbonScope so bili uporabljeni naslednji viri podatkov:

### Svetovni podatki o emisijah CO₂

- [Our World in Data – CO₂ Emissions Dataset](https://ourworldindata.org/co2-emissions)  
  Obsežen in ažuren nabor podatkov o emisijah CO₂ za skoraj vse države sveta, z dolgo zgodovino meritev.
- [IEA – International Energy Agency](https://www.iea.org/reports/global-energy-co2-status-report-2023)  
  Uradni podatki o energetski porabi in emisijah s strani mednarodne agencije.
- [Global Carbon Atlas](http://www.globalcarbonatlas.org/)  
  Interaktivni atlas za spremljanje globalnih in regionalnih emisij ogljika.
- [UN Data – Carbon Dioxide Emissions](http://data.un.org/)  
  Podatki Združenih narodov o izpustih ogljikovega dioksida po državah.

### Slovenski podatki

- [Statistični urad Republike Slovenije (SURS)](https://www.stat.si/)  
  Uradni statistični podatki o različnih okoljskih in energetskih kazalnikih za Slovenijo.
- [Agencija RS za okolje (ARSO)](https://www.arso.gov.si/)  
  Okoljski podatki in poročila za Slovenijo, vključno z emisijami in stanjem okolja.

### Napovedi emisij

- [Climate Action Tracker – Emission Projections](https://climateactiontracker.org/)  
  Neodvisna analiza in projekcije emisij glede na podnebne cilje in politike držav.
- [IEA – Global Energy and Climate Model](https://www.iea.org/reports/world-energy-model)  
  Modeli in napovedi za globalno energetsko porabo in emisije CO₂.
- [EDGAR – Emissions Database for Global Atmospheric Research](https://edgar.jrc.ec.europa.eu/)  
  Podrobna baza emisijskih podatkov, ki podpira znanstvene študije in politike.
- [IPCC Data Distribution Centre](https://www.ipcc-data.org/)  
  Podpora dostopu do podnebnih napovedi in modelov, ki so osnova za globalne emisijske scenarije.


### Uporabljeni GitHub repozitorij za podatke

- [owid/co2-data](https://github.com/owid/co2-data) – javni repozitorij z obsežnimi CSV-ji o svetovnih emisijah, ki jih vzdržuje Our World in Data.

## Napovedni modeli (Jupyter Notebook)

V repozitoriju je vključen tudi Python Jupyter Notebook (`notebooks/co2_forecasting.ipynb`), kjer so implementirani osnovni napovedni modeli za prihodnje CO₂ emisije.

Modeli vključujejo:
- Linearna regresija
- Eksponentno glajenje (Exponential Smoothing)
- Prophet (Facebookovo ogrodje za časovne vrste)
- Vizualizacije napovedi za svet in Slovenijo

Notebook omogoča hitro testiranje in primerjavo metod za napoved emisij do leta 2050. Primeren je tudi kot osnova za nadaljnje izboljšave in vključevanje bolj naprednih metod (npr. LSTM, ARIMA).

> 📁 Lokacija: `notebooks/co2_forecasting.ipynb`

## Avtorji

Projekt CarbonScope je bil razvit s strastjo in predanostjo s strani našega tima:

| <img src="https://em-content.zobj.net/source/apple/81/male-technologist-type-1-2_1f468-1f3fb-200d-1f4bb.png" alt="Konstantin Mihajlov" width="100" height="100" style="border-radius:50%; border: 3px solid #2ecc71;"> | <img src="https://em-content.zobj.net/source/apple/81/female-technologist_1f469-200d-1f4bb.png" alt="Anastasija Todorov" width="110" height="100" style="border-radius:50%; border: 3px solid #3498db;"> | <img src="https://angeloalbanese.it/_next/image?url=%2FangeloMacbook.png&w=1200&q=100" alt="Matej Filipov" width="140" height="135" style="border-radius:50%; border: 3px solid #e74c3c;"> |
|:---:|:---:|:---:|
| **Konstantin Mihajlov**<br>Razvijalec<br>[<img src="https://img.icons8.com/fluent-systems-regular/512/40C057/github.png" alt="GitHub Profile" width="30" height="30">](https://github.com/kmihajlov) | **Anastasija Todorov**<br>Razvijalka<br>[<img src="https://img.icons8.com/fluent-systems-regular/512/40C057/github.png" alt="GitHub Profile" width="30" height="30">](https://github.com/AnjaTodorov) | **Matej Filipov**<br>Razvijalec<br>[<img src="https://img.icons8.com/fluent-systems-regular/512/40C057/github.png" alt="GitHub Profile" width="30" height="30">](https://github.com/Freak4e) |




