# CO2 Odtis

## Opis in vizija projekta

CO2 Odtis je interaktivna spletna aplikacija, namenjena poglobljeni analizi in vizualizaciji emisij CO₂ tako za Slovenijo kot za svet. Z uporabo zanesljivih podatkovnih virov, naprednih vizualizacij in napovednih modelov omogoča uporabnikom celosten vpogled v razvoj emisij skozi čas, primerjavo med državami, sektorji in regijami ter izračun ogljičnega odtisa na različnih nivojih.

**Vizija projekta** je prispevati k boljši ozaveščenosti o podnebnih spremembah in podpreti trajnostne odločitve posameznikov, organizacij in oblikovalcev politik z enostavno dostopnimi in vizualno privlačnimi orodji za spremljanje in napovedovanje emisij CO₂.

Z vključitvijo napovednih modelov in interaktivnih kalkulatorjev potovanj želimo uporabnikom pokazati, kako njihove odločitve vplivajo na okolje ter jih spodbuditi k bolj trajnostnim načinom življenja.


## Vsebina

- [CO2 Odtis](#co2-odtis)
- [Opis in vizija projekta](#opis-in-vizija-projekta)
- [Funkcionalnosti](#funkcionalnosti)
  - [🌍 Svetovni pogled](#-svetovni-pogled)
  - [🚶‍♂️ Kalkulator emisij glede na način prevoza](#-kalkulator-emisij-glede-na-način-prevoza)
  - [🇸🇮 Analiza emisij za Slovenijo](#-analiza-emisij-za-slovenijo)
- [Tehnološki sklad](#tehnološki-sklad)
  - [🔧 Frontend](#-frontend)
  - [🗂️ Podatkovni viri](#️-podatkovni-viri)
  - [📈 Vizualizacija](#-vizualizacija)
  - [🤖 Modeli in napovedi](#-modeli-in-napovedi)
- [Namestitev in nadaljnji razvoj](#namestitev-in-nadaljnji-razvoj)
  - [🔧 Lokalna namestitev](#-lokalna-namestitev)
  - [🔮 Nadaljnji razvoj](#-nadaljnji-razvoj)
- [Podatkovni viri](#podatkovni-viri)
- [Napovedni modeli (Jupyter Notebook)](#napovedni-modeli-jupyter-notebook)
- [Avtorji](#avtorji)
- [Licenca](#licenca)

## Funkcionalnosti

### 🌍 Svetovni pogled

- Interaktivna primerjava emisij CO₂ med državami.
- Vizualizacija svetovnih emisij po sektorjih (promet, energetika, industrija itd.).
- Prikaz zgodovinskih trendov emisij skozi čas (po državah in globalno).
- Interaktivni svetovni zemljevid z emisijami CO₂ in podatki o populaciji.
- Napoved prihodnjih svetovnih emisij na podlagi učnega modela.

### 🚶‍♂️ Kalkulator emisij glede na način prevoza

- Uporabnik lahko izbere dve točki in primerja, koliko emisij CO₂ povzroči pot:
  - peš
  - s kolesom
  - z avtom
  - z avtobusom
  - z vlakom
  - z letalom
- Prikaz emisij in prihrankov v kg CO₂ za vsako izbiro.

### 🇸🇮 Analiza emisij za Slovenijo

- Emisije CO₂ na prebivalca skozi leta.
- Razčlenitev emisij po vrsti goriva (premog, plin, obnovljivi viri ipd.).
- Prikaz emisij po sektorjih (promet, industrija, stanovanjski sektor, kmetijstvo, ipd.).
- Interaktivni zemljevid emisij po regijah.
- Napoved emisij v prihodnosti na podlagi lokalno prilagojenega modela.

## Tehnološki sklad

Pri razvoju projekta CO2 Odtis so uporabljene naslednje tehnologije in podatkovne oblike:

### 🔧 Frontend

- **Next.js** – ogrodje za izdelavo zmogljivih React aplikacij z renderiranjem na strežni strani.
- **JavaScript (ES6+)** – logika za interakcijo, prikaz podatkov, delo z API-ji in dogodki.
- **Bootstrap 5** – za hitro postavitev odzivnega in estetskega vmesnika.
- **CSS** – za dodatno prilagajanje izgleda komponent.
- **Leaflet** (in/ali Mapbox) – za prikaz interaktivnih zemljevidov z emisijami in populacijo.

### 🗂️ Podatkovni viri

- **CSV datoteke** – za hranjenje strukturiranih podatkov (emisije po letih, sektorjih, regijah, državah ipd.).
- **GeoJSON datoteke** – za prikaz zemljevidov (slovenske regije, svetovne države).
- **Ročno pripravljeni ali uvoženi nabori podatkov** iz javno dostopnih virov (npr. Our World in Data, Statistični urad RS, IEA).

### 📈 Vizualizacija

- **Chart.js** / **Recharts** – za prikaz linijskih, stolpčnih in tortnih grafov.
- **Interaktivni zemljevidi** z označenimi regijami ali državami ter podatki ob prehodu miške.

### 🤖 Modeli in napovedi

- **Umetna inteligenca / strojno učenje** (osnovni napovedni model): za projekcijo emisij CO₂ v prihodnosti, na svetovni in nacionalni ravni.
- Napovedni modeli so osnovani na časovnih vrstah iz zgodovinskih podatkov.

## Namestitev in nadaljnji razvoj

### 🔧 Lokalna namestitev

Za lokalni zagon projekta CO2-Odtis sledite naslednjim korakom:

1. Klonirajte repozitorij:
   ```bash
   git clone https://github.com/Freak4e/OpsiCO2.git
   ```

2. Premaknite se v mapo projekta:
   ```bash
   cd OpsiCO2
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

### 🔮 Nadaljnji razvoj

Možnosti za nadgradnjo in razširitev projekta vključujejo:

- Integracija z realnimi API-ji za dinamične posodobitve podatkov (npr. podatki v živo).
- Izboljšava napovednega modela z uporabo naprednejših tehnik (npr. LSTM, regresija, Prophet).
- Uporaba podatkovnih baz (npr. PostgreSQL ali Firebase) za shranjevanje podatkov namesto CSV.
- Dodajanje uporabniških profilov z možnostjo spremljanja osebnega ogljičnega odtisa.
- Večjezična podpora (angleščina/slovenščina).
- Mobilna optimizacija in PWA (Progressive Web App) različica.

## Podatkovni viri

Pri izdelavi projekta CO2 Odtis so bili uporabljeni naslednji viri podatkov:

### 🌍 Svetovni podatki o emisijah CO₂

- [Our World in Data – CO₂ Emissions Dataset](https://ourworldindata.org/co2-emissions)  
  Obsežen in ažuren nabor podatkov o emisijah CO₂ za skoraj vse države sveta, z dolgo zgodovino meritev.
- [IEA – International Energy Agency](https://www.iea.org/reports/global-energy-co2-status-report-2023)  
  Uradni podatki o energetski porabi in emisijah s strani mednarodne agencije.
- [Global Carbon Atlas](http://www.globalcarbonatlas.org/)  
  Interaktivni atlas za spremljanje globalnih in regionalnih emisij ogljika.
- [UN Data – Carbon Dioxide Emissions](http://data.un.org/)  
  Podatki Združenih narodov o izpustih ogljikovega dioksida po državah.

### 🇸🇮 Slovenski podatki

- [Statistični urad Republike Slovenije (SURS)](https://www.stat.si/)  
  Uradni statistični podatki o različnih okoljskih in energetskih kazalnikih za Slovenijo.
- [Agencija RS za okolje (ARSO)](https://www.arso.gov.si/)  
  Okoljski podatki in poročila za Slovenijo, vključno z emisijami in stanjem okolja.

### 📈 Napovedi emisij

- [Climate Action Tracker – Emission Projections](https://climateactiontracker.org/)  
  Neodvisna analiza in projekcije emisij glede na podnebne cilje in politike držav.
- [IEA – Global Energy and Climate Model](https://www.iea.org/reports/world-energy-model)  
  Modeli in napovedi za globalno energetsko porabo in emisije CO₂.
- [EDGAR – Emissions Database for Global Atmospheric Research](https://edgar.jrc.ec.europa.eu/)  
  Podrobna baza emisijskih podatkov, ki podpira znanstvene študije in politike.
- [IPCC Data Distribution Centre](https://www.ipcc-data.org/)  
  Podpora dostopu do podnebnih napovedi in modelov, ki so osnova za globalne emisijske scenarije.


### 💻 Uporabljeni GitHub repozitorij za podatke

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

Projekt CO2 Odtis so razvili študenti:

- **Konstantin Mihajlov**
- **Anastasija Todorov**
- **Matej Filipov**

Vsi člani ekipe so enakovredno sodelovali pri razvoju, načrtovanju, analizi podatkov in pripravi vizualizacij.

## Licenca

Ta projekt je odprtokoden in je na voljo pod licenco MIT.


