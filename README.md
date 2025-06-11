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
  - [📈 Vizualizacija](#📈-vizualizacija)
  - [🤖 Modeli in napovedi](#🤖-modeli-in-napovedi)
- [💻 Namestitev in nadaljnji razvoj](#namestitev-in-nadaljnji-razvoj)
  - [🛠️ Lokalna namestitev](#🔧-lokalna-namestitev)
- [📊 Podatkovni viri](#podatkovni-viri)
  - [💻 Uporabljeni GitHub repozitorij za podatke](#💻-uporabljeni-github-repozitorij-za-podatke)
- [📓 Napovedni modeli (Jupyter Notebook)](#napovedni-modeli-jupyter-notebook)
- [👨‍💻 Avtorji](#avtorji)



## Funkcionalnosti

### Svetovni pogled

- Interaktivna primerjava emisij CO₂ med državami.
- Vizualizacija svetovnih emisij po sektorjih (promet, energetika, proizvodnja in gradbeništvo itd.).
- Interaktivna primerjava držav (skupni CO₂, CO₂ na prebivalca, CO₂ glede na BDP).
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
- Razčlenitev emisij po vrsti goriva (premog, plin, nafta ipd.).
- Prikaz emisij po sektorjih (promet, industrija, energetika, stavbe, ipd.).
- Interaktivni zemljevid emisij po regijah.
- Napoved emisij v prihodnosti na podlagi lokalno prilagojenega modela.

## Tehnološki sklad

Pri razvoju projekta CarbonScope so bile uporabljene naslednje tehnologije:

- **HTML** <br>
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/HTML5_logo_and_wordmark.svg/512px-HTML5_logo_and_wordmark.svg.png" alt="HTML Logo" width="50">
- **CSS**  <br>
  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/CSS3_logo_and_wordmark.svg" alt="CSS Logo" width="50">
- **Bootstrap 5** <br>
  <img src="https://getbootstrap.com/docs/5.3/assets/brand/bootstrap-logo-shadow.png" alt="Bootstrap Logo" width="50">
- **JavaScript** <br>
  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png" alt="JavaScript Logo" width="40">
- **Node.js + Express**  
  <img src="https://qualitapps.com/wp-content/uploads/2023/02/102.png" alt="Node.js Logo" width="100">

### Vizualizacija

- **Chart.js**  <br>
  <img src="https://www.chartjs.org/img/chartjs-logo.svg" alt="Chart.js Logo" width="50">
- **D3.js** <br>
  <img src="https://d3js.org/logo.svg" alt="D3.js Logo" width="50">
- **Leaflet** - mapa<br>
  <img src="https://leafletjs.com/docs/images/logo.png" alt="Leaflet Logo" width="100">

### Modeli in napovedi

- **Python** – uporabljen v Jupyter Notebook za razvoj modelov strojnega učenja za projekcijo emisij CO₂ v prihodnosti na svetovni in nacionalni ravni.  
  <img src="https://cdn.iconscout.com/icon/free/png-256/free-python-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-vol-5-pack-logos-icons-3030224.png?f=webp" alt="Python Logo" width="50">

## Namestitev in nadaljnji razvoj

### Lokalna namestitev

Za lokalni zagon projekta CarbonScope sledite naslednjim korakom:

### Predpogoji

- **Node.js**: Prepričajte se, da imate nameščen Node.js (priporočena različica 16.x ali novejša). Prenesete ga lahko z [uradne spletne strani](https://nodejs.org/).  
  
2. Premaknite se v mapo projekta:
   ```bash
   cd CarbonScope
   ```

3. Odprite projekt v Visual Studio Code ali vašem priljubljenem urejevalniku kode.

4. Namestite vse odvisnosti (vključno z Express.js):
   ```bash
   npm install
   ```

5. Zaženite razvojni strežnik:
   ```bash
   npm run dev
   ```

6. Odprite brskalnik in obiščite:
   ```
   http://localhost:3000
   ```

Projekt bo zagnan lokalno v razvojnem okolju.

---

## Podatkovni viri

Pri izdelavi projekta CarbonScope so bili uporabljeni naslednji viri podatkov:

- [Our World in Data – CO₂ Emissions Dataset](https://ourworldindata.org/co2-emissions)  
  Obsežen in ažuren nabor podatkov o emisijah CO₂ za skoraj vse države sveta, z dolgo zgodovino meritev.
- [IEA – International Energy Agency](https://www.iea.org/reports/global-energy-co2-status-report-2023)  
  Uradni podatki o energetski porabi in emisijah s strani mednarodne agencije.
- Kombinirani podatki, sestavljeni iz različnih CSV datotek, pridobljenih iz različnih spletnih strani.

Za primerjavo našega modela za napovedovanje prihodnjih emisij CO₂ smo raziskali in analizirali podatke ter projekcije iz naslednjih virov, da bi preverili skladnost in verodostojnost naših rezultatov:

- [EIA – Outlook for Future Emissions](https://www.eia.gov/energyexplained/energy-and-the-environment/outlook-for-future-emissions.php)  
  Podatki in napovedi o prihodnjih emisijah, ki jih zagotavlja ameriška uprava za energijo.
- [Statista – Projected CO₂ Emissions](https://www.statista.com/statistics/1426279/projected-co2-emissions-from-combustion-and-industrial-processes/)  
  Projekcije globalnih emisij CO₂ iz izgorevanja in industrijskih procesov do leta 2050, razdeljene po različnih scenarijih.
- [Carbon Brief – Global CO₂ Emissions Peak Analysis](https://www.carbonbrief.org/analysis-global-co2-emissions-could-peak-as-soon-as-2023-iea-data-reveals/)  
  Analiza, ki temelji na podatkih IEA in napoveduje možen vrhunec globalnih emisij CO₂ že leta 2023.

#### Uporabljeni GitHub repozitorij za podatke

- [owid/co2-data](https://github.com/owid/co2-data) - javni repozitorij z obsežnimi CSV-ji o svetovnih emisijah, ki jih vzdržuje Our World in Data.

## Napovedni modeli (Jupyter Notebook)

V repozitoriju je vključen tudi Python Jupyter Notebook (`notebooks/co2_forecasting.ipynb`), kjer so implementirani osnovni napovedni modeli za prihodnje CO₂ emisije.

Vključeni modeli strojnega učenja:
- Linearna regresija
- Naključnega gozda (Random Forest)
- Gradient Boosting Regressor,
- Support Vector Regressor (Podporni vektorji),
- Decision Tree Regressor (Odločitveno drevo)...
  
> 📁 Lokacija: `notebooks/co2_forecasting.ipynb`

## Avtorji

Projekt CarbonScope je bil razvit s strastjo in predanostjo s strani našega tima:

| <img src="https://em-content.zobj.net/source/apple/81/male-technologist-type-1-2_1f468-1f3fb-200d-1f4bb.png" alt="Konstantin Mihajlov" width="100" height="100" style="border-radius:50%; border: 3px solid #2ecc71;"> | <img src="https://em-content.zobj.net/source/apple/81/female-technologist_1f469-200d-1f4bb.png" alt="Anastasija Todorov" width="110" height="100" style="border-radius:50%; border: 3px solid #3498db;"> | <img src="https://angeloalbanese.it/_next/image?url=%2FangeloMacbook.png&w=1200&q=100" alt="Matej Filipov" width="140" height="135" style="border-radius:50%; border: 3px solid #e74c3c;"> |
|:---:|:---:|:---:|
| **Konstantin Mihajlov**<br>Razvijalec<br>[<img src="https://img.icons8.com/fluent-systems-regular/512/40C057/github.png" alt="GitHub Profile" width="30" height="30">](https://github.com/kmihajlov) | **Anastasija Todorov**<br>Razvijalka<br>[<img src="https://img.icons8.com/fluent-systems-regular/512/40C057/github.png" alt="GitHub Profile" width="30" height="30">](https://github.com/AnjaTodorov) | **Matej Filipov**<br>Razvijalec<br>[<img src="https://img.icons8.com/fluent-systems-regular/512/40C057/github.png" alt="GitHub Profile" width="30" height="30">](https://github.com/Freak4e) |




