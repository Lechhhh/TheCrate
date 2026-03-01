const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const ytSearch = require('yt-search');
const nodemailer = require('nodemailer'); 
const crypto = require('crypto'); 

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const dbPath = path.join(__dirname, 'database.json');
const usersPath = path.join(__dirname, 'users.json');

// ==========================================
// KONFIGURACJA WYSYŁKI E-MAIL (WPISZ SWOJE DANE!)
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'thecrate.kontakt@gmail.com', // <--- TUTAJ WPISZ SWÓJ E-MAIL GMAIL
        pass: 'ybzkosxsqtulgowb' // <--- TUTAJ WKLEJ HASŁO APLIKACJI Z GOOGLE (bez spacji)
    }
});

function safeReadDB() {
    try {
        if (!fs.existsSync(dbPath)) return JSON.parse(JSON.stringify(defaultDB));
        const data = fs.readFileSync(dbPath, 'utf8').trim();
        return data ? JSON.parse(data) : JSON.parse(JSON.stringify(defaultDB));
    } catch(e) {
        return JSON.parse(JSON.stringify(defaultDB));
    }
}

function safeReadUsers() {
    try {
        if (!fs.existsSync(usersPath)) {
            fs.writeFileSync(usersPath, '{}', 'utf8');
            return {};
        }
        const data = fs.readFileSync(usersPath, 'utf8').trim();
        return data ? JSON.parse(data) : {};
    } catch(e) {
        return {};
    }
}

if (!fs.existsSync(usersPath)) fs.writeFileSync(usersPath, '{}', 'utf8');

const defaultDB = {
  "art_01": { "category": "archive", "region": "US", "timestamp": 1608940800000, "title": "Playboi Carti: Whole Lotta Red", "snippet": "Album, który zmienił brzmienie trapu na całą dekadę.", "content": "<p>Gdy Whole Lotta Red wychodziło pod koniec 2020 roku, internet tego nie zrozumiał. Pierwsze reakcje były mieszane, a wielu fanów odrzuciło nowe, agresywne brzmienie. Płyta wydawała się chaotyczna, krzyczana i źle zmiksowana. Dziś wiemy, że był to ogromny błąd, a sam projekt to kamień milowy w rozwoju gatunku.</p><p>Carti wprowadził punkową estetykę i przesterowane bity F1lthy'ego do absolutnego mainstreamu, tworząc podwaliny pod gigantyczną subkulturę Opium. Nikt nie był gotowy na wokalne eksperymenty, które zaprezentował. Dzisiaj te utwory powodują trzęsienia ziemi na festiwalach.</p><br><p class='source-tag'>Źródło: Opracowanie własne The Crate</p>", "searchTags": "playboi carti wlr opium", "likes": 124, "dislikes": 3, "comments": [] },
  "art_02": { "category": "archive", "region": "PL", "timestamp": 1598918400000, "title": "Taco Hemingway: Jarmark i Europa", "snippet": "Dwie płyty, jeden dzień, miliony streamów. Taco zatrzymuje polski internet.", "content": "<p>Taco zamknął rok 2020 uderzając ze zdwojoną siłą. Wydanie dwóch pełnoprawnych projektów naraz na moment dosłownie zablokowało serwery w Polsce. 'Jarmark' uderzał w polityczno-społeczne struny polskiej rzeczywistości, bezlitośnie punktując narodowe przywary. Z kolei 'Europa' skupiała się na bardziej osobistych i popkulturowych przemyśleniach.</p><p>Tym ruchem Taco udowodnił, że w kwestii storytellingu i zdolności do kreowania masowych fenomenów muzycznych, nie ma sobie równych na polskiej scenie. Zrobił to bez grama promocji, bez wywiadów i bez sztucznego pompowania oczekiwań.</p><br><p class='source-tag'>Źródło: 2020 Label</p>", "searchTags": "taco hemingway jarmark", "likes": 89, "dislikes": 2, "comments": [] },
  "art_03": { "category": "archive", "region": "US", "timestamp": 1688169600000, "title": "Travis Scott powraca z UTOPIĄ", "snippet": "Monumentalne dzieło zrzucające klątwę Astroworld.", "content": "<p>Po latach ciszy spowodowanej tragedią, Travis Scott powrócił z monumentalnym projektem 'Utopia'. Płyta ta to odważny krok w stronę awangardowego, brudnego brzmienia zdominowanego przez mroczne syntezatory i gęste bębny, silnie inspirowane epoką 'Yeezusa'. Album udowodnił, że Travis nie boi się ryzyka i potrafi wyznaczać nowe ścieżki w architekturze dźwięku.</p><p>Trasa koncertowa 'Circus Maximus' potwierdziła, że artysta nie ma sobie równych pod kątem wizualnym i scenicznym. Rzymskie Colosseum, gigantyczne głośniki i gościnne występy absolutnej topki potwierdziły jego status władcy rapgry.</p><br><p class='source-tag'>Źródło: Cactus Jack</p>", "searchTags": "travis scott utopia", "likes": 210, "dislikes": 5, "comments": [] },
  "art_04": { "category": "archive", "region": "PL", "timestamp": 1654041600000, "title": "White 2115 i rockstarowy sen", "snippet": "Jak Młody Łajcior połączył trap ze statusem gwiazdy rocka.", "content": "<p>White 2115 to fenomen, który udowodnił, że nie trzeba być klasycznym raperem, by zdominować listy przebojów w Polsce. Jego wokalne przeloty, mocno przesiąknięte melancholią, złamanym sercem i typowo wakacyjnym vibem, stały się oficjalną ścieżką dźwiękową polskiej młodzieży.</p><p>Jego projekty regularnie pokrywają się diamentem, udowadniając, że muzyka gitarowa w połączeniu z ciężkimi trapowymi bębnami to sprawdzony przepis na komercyjny triumf. Mimo krytyki ze strony purystów, White robi swoje i wypełnia największe festiwalowe hale w kraju po brzegi.</p><br><p class='source-tag'>Źródło: SBM Label / Popkiller</p>", "searchTags": "white 2115 sbm rockstar", "likes": 45, "dislikes": 12, "comments": [] },
  "art_05": { "category": "archive", "region": "PL", "timestamp": 1717200000000, "title": "Oki i fenomen Ery 47", "snippet": "Od podziemnych bitew po wyprzedane hale.", "content": "<p>Oki wdarł się na szczyt polskiej branży z bezkompromisowym projektem 'Era 47'. Jego hiperaktywne flow, charyzma i techniczna perfekcja sprawiły, że to wydawnictwo stało się czymś więcej niż tylko zbiorem piosenek - to pełnoprawny ruch kulturowy. Ubrania sygnowane jeżem i numerem 47 zalały polskie ulice.</p><p>Jego monumentalna trasa koncertowa udowodniła sceptykom, że hip-hop w Polsce ostatecznie przeniósł się z małych, ciasnych klubów na gigantyczne areny i stadiony. Jako showman, Oki aktualnie nie ma sobie równych na polskiej scenie live, łącząc energię moshpitu z precyzją sceniczną.</p><br><p class='source-tag'>Źródło: Opracowanie własne</p>", "searchTags": "oki era 47", "likes": 88, "dislikes": 3, "comments": [] },
  "art_06": { "category": "archive", "region": "US", "timestamp": 1714521600000, "title": "Kendrick Lamar vs Drake: Upadek Imperium", "snippet": "Analiza największego beefu tej dekady.", "content": "<p>Wiosna 2024 roku zmieniła hip-hop na zawsze. Beef, który kiełkował od dekady, ostatecznie eksplodował z nuklearną siłą. Kendrick Lamar nie tylko wygrał starcie pod kątem lirycznym, ale przeprowadził metodyczną, publiczną egzekucję wizerunku Drake'a, punktując wszystkie jego słabości i mechanizmy działania wytwórni OVO.</p><p>Utwór 'Not Like Us' stał się absolutnym hymnem ulicznym w USA. Był grany w klubach, na meczach NBA i w samochodach, udowadniając, że klasyczny, oparty na wartościach hip-hop potrafi pobić pop-rap ich własną, najbardziej komercyjną bronią. To była lekcja pokory dla całej branży rozrywkowej.</p><br><p class='source-tag'>Źródło: RapNews USA / Complex</p>", "searchTags": "kendrick drake beef", "likes": 305, "dislikes": 18, "comments": [] },
  "art_07": { "category": "archive", "region": "US", "timestamp": 1696118400000, "title": "Ken Carson - A Great Chaos", "snippet": "Płyta, która zdefiniowała brzmienie nowożytnego moshpitu.", "content": "<p>Ken Carson udowodnił albumem 'A Great Chaos', że nie jest tylko przystawką do Playboi Cartiego. AGC to potężna ściana dźwięku. Przesterowane, wgniatające w ziemię basy, krzykliwe wokale i tempo, które nie pozwala słuchaczowi złapać oddechu nawet na chwilę.</p><p>Koncerty z tą płytą to czyste, niebezpieczne szaleństwo. Ten album wyznaczył zupełnie nowe standardy ciężkości dla całego amerykańskiego podziemia, a producenci wspięli się tu na absolutne wyżyny swoich mrocznych możliwości.</p><br><p class='source-tag'>Źródło: Opium Label</p>", "searchTags": "ken carson agc", "likes": 120, "dislikes": 4, "comments": [] },
  "art_08": { "category": "archive", "region": "US", "timestamp": 1706745600000, "title": "Yeat wkracza w rok 2093", "snippet": "Koniec z dzwoneczkami. Raper ewoluuje w stronę mrocznego cyberpunku.", "content": "<p>Yeat całkowicie odciął się od swojego dawnego brzmienia z ery 'Up 2 Më'. Płyta '2093' to monumentalne, dystopijne przedsięwzięcie, pełne ciężkich, industrialnych syntezatorów, zniekształconych wokali i mrocznego klimatu rodem z filmów science-fiction.</p><p>Udowodnił tym samym, że nie jest tylko TikTokową ciekawostką, która zniknie po jednym sezonie, ale artystą z prawdziwą, wielką wizją, który potrafi ewoluować szybciej, niż branża jest w stanie to przetrawić.</p><br><p class='source-tag'>Źródło: Lyfestyle Corporation</p>", "searchTags": "yeat 2093", "likes": 110, "dislikes": 14, "comments": [] },
  "art_09": { "category": "archive", "region": "PL", "timestamp": 1585699200000, "title": "Quebonafide - Romantic Psycho", "snippet": "Największa mistyfikacja w historii polskiego rapu.", "content": "<p>Quebonafide zniknął z sieci, by powrócić w niebieskiej koszulce polo i z przyklejonymi tatuażami. Akcja promocyjna 'Romantic Psycho' to marketingowy majstersztyk, o którym uczy się na studiach. Kuba Grabowski zwiódł całą Polskę, po to, by na koniec zrzucić maskę i dostarczyć jedno z najważniejszych dzieł w polskiej muzyce.</p><p>Sama płyta to zbiór niesamowitych, emocjonalnych i bardzo osobistych utworów, które ukazały artystę z zupełnie innej, wrażliwej strony. To jeden z najważniejszych projektów dekady.</p><br><p class='source-tag'>Źródło: QueQuality</p>", "searchTags": "quebonafide romantic psycho", "likes": 145, "dislikes": 1, "comments": [] },
  "art_10": { "category": "archive", "region": "US", "timestamp": 1711929600000, "title": "Future & Metro Boomin: We Don't Trust You", "snippet": "Najlepsze kolabo w trapie uderza ponownie, wciągając całą scenę w konflikt.", "content": "<p>Kiedy Metro Boomin zapowiada album z Future'em, wiadomo, że szykuje się klasyk. 'We Don't Trust You' to nie tylko pokaz mistrzowskiej, atlantskiej produkcji i mrocznego, toksycznego flow Plutona, ale też najważniejszy moment tego roku w amerykańskim rapie.</p><p>To na tym albumie znalazł się utwór 'Like That', który dzięki niespodziewanej, gościnnej zwrotce Kendricka Lamara rozpoczął największą wojnę domową w historii współczesnego hip-hopu, uderzając bezpośrednio w Drake'a i J. Cole'a.</p><br><p class='source-tag'>Źródło: Epic Records</p>", "searchTags": "future metro boomin like that", "likes": 115, "dislikes": 4, "comments": [] },
  "art_11": { "category": "archive", "region": "PL", "timestamp": 1620000000000, "title": "OIO – Supergrupa, której potrzebowaliśmy", "snippet": "Oki, Igi i Otsochodzi tworzą boysband idealny.", "content": "<p>Kiedy ogłoszono powstanie OIO, oczekiwania były gigantyczne. Na szczęście panowie dowieźli. Projekt to absolutna kumulacja energii, idealna na letnie festiwale i wielkie koncerty. Żadnych głębokich przemyśleń, czysty, niczym nieskrępowany fun i techniczna precyzja.</p><p>Ich zróżnicowane style – techniczny i agresywny Oki, niezwykle melodyjny Igi i wyluzowany Otsochodzi – stworzyły mieszankę wybuchową, która zdominowała cały rok w polskiej muzyce rozrywkowej.</p><br><p class='source-tag'>Źródło: 2020 Label</p>", "searchTags": "oio oki igi otsochodzi", "likes": 190, "dislikes": 6, "comments": [] },
  "art_12": { "category": "archive", "region": "UK", "timestamp": 1685577600000, "title": "Central Cee i Dave - Sprinter", "snippet": "Jak brytyjski drill ostatecznie zdobył Amerykę i świat.", "content": "<p>Wydanie 'Sprintera' przez dwóch gigantów UK Rapu to moment, w którym Wielka Brytania przestała być tylko ciekawostką dla fanów z USA, a stała się pełnoprawnym graczem w globalnym, komercyjnym mainstreamie.</p><p>Genialny, chwytliwy beat z akustyczną gitarą i niesamowita chemia między artystami sprawiły, że utwór pobił wszelkie rekordy odtworzeń na Wyspach i stał się potężnym wiralem na TikToku w każdym zakątku globu.</p><br><p class='source-tag'>Źródło: GRM Daily</p>", "searchTags": "central cee dave sprinter uk drill", "likes": 220, "dislikes": 8, "comments": [] },
  "art_13": { "category": "archive", "region": "US", "timestamp": 1682899200000, "title": "Destroy Lonely - If Looks Could Kill", "snippet": "Mroczny, rockowy klimat prosto z Opium.", "content": "<p>Destroy Lonely wydał album, który zacementował jego pozycję jako jednego z najciekawszych artystów amerykańskiego podziemia. 'If Looks Could Kill' to płyta bardzo długa, mroczna, momentami gotycka i przesiąknięta ciężkimi, gitarowymi samplami.</p><p>Jego specyficzny styl, idealnie łączący modę high fashion z surowym brzmieniem emo-rapu nowej generacji, nieustannie przyciąga rzesze fanów, którzy szukają czegoś znacznie więcej niż zwykły, uliczny trap.</p><br><p class='source-tag'>Źródło: Opium Label</p>", "searchTags": "destroy lonely if looks could kill", "likes": 105, "dislikes": 2, "comments": [] },
  "art_14": { "category": "archive", "region": "PL", "timestamp": 1572566400000, "title": "Bedoes - Opowieści z Doliny Smoków", "snippet": "Album, który pokazał prawdziwą dojrzałość lidera 2115.", "content": "<p>Bedoes na tej klasycznej już płycie zdecydowanie odciął się od stricte imprezowych, klubowych bangerów na rzecz głębszych, emocjonalnych opowieści o bolesnym dorastaniu, lojalności wobec ekipy i nieustającej walce z demonami przeszłości.</p><p>To wydawnictwo pokazało, że Borys potrafi być autentycznym głosem pokolenia, a producent Lanek dostarczył mu do tego jedne z najlepszych, niemalże filmowych i orkiestrowych bitów w całej swojej bogatej karierze.</p><br><p class='source-tag'>Źródło: SBM Label</p>", "searchTags": "bedoes dolina smokow", "likes": 180, "dislikes": 15, "comments": [] },
  "art_15": { "category": "archive", "region": "US", "timestamp": 1624579200000, "title": "Tyler, The Creator - Call Me If You Get Lost", "snippet": "Luksus, klasyczne mixtape'y i rap na najwyższym poziomie.", "content": "<p>Po niezwykle melodyjnym i śpiewanym projekcie 'IGOR', Tyler postanowił przypomnieć światu, że potrafi niesamowicie i technicznie rapować. Z pomocą legendarnego DJ Dramy stworzył album hołdujący erze klasycznych mixtape'ów z serii Gangsta Grillz.</p><p>Płyta jest przepiękną celebracją sukcesu, podróży po Europie i luksusu, ale nie brakuje na niej też gorzkich refleksji o miłości i utraconych relacjach. To absolutny klasyk dekady, w pełni zasłużenie nagrodzony statuetką Grammy.</p><br><p class='source-tag'>Źródło: Columbia Records</p>", "searchTags": "tyler the creator cmiygl", "likes": 250, "dislikes": 4, "comments": [] },
  "art_16": { "category": "archive", "region": "PL", "timestamp": 1630454400000, "title": "Chivas i jego emo-rapowa rewolucja", "snippet": "Jak brudne gitary i smutek podbiły serca polskich nastolatków.", "content": "<p>Chivas to artysta, który z niezwykłą precyzją wstrzelił się w niszę pozostawioną przez amerykańskich pionierów emo-rapu takich jak Lil Peep czy Juice WRLD. Jego umiejętność łączenia akustycznej gry na gitarze z ciężkimi, przesterowanymi basami typu 808 robi ogromne wrażenie.</p><p>Jego teksty to wylane na kartkę czyste emocje. Fani doceniają go przede wszystkim za szczerość i absolutny brak kalkulacji. Chivas nie udaje gangstera, śpiewa o złamanym sercu, uzależnieniach i robi to lepiej niż ktokolwiek inny w Polsce.</p><br><p class='source-tag'>Źródło: GUGU</p>", "searchTags": "chivas emo rap gugu", "likes": 130, "dislikes": 5, "comments": [] },
  "art_17": { "category": "archive", "region": "US", "timestamp": 1652313600000, "title": "Kendrick Lamar - Mr. Morale & The Big Steppers", "snippet": "Najbardziej osobista i terapeutyczna płyta w historii nowożytnego rapu.", "content": "<p>Kendrick kazał całemu światu czekać na ten album aż 5 długich lat. Kiedy w końcu wrócił, dostarczył niesamowicie trudne, dwupłytowe dzieło, które jest w zasadzie jedną, wielką sesją terapeutyczną udostępnioną publicznie. Kendrick rozlicza się na niej z ciężkim ojcostwem, traumą pokoleniową, zdradami i statusem 'zbawiciela kultury'.</p><p>To płyta nieoczywista, pozbawiona łatwych, klubowych bangerów, ale absolutnie genialna w swoim głębokim przekazie. Lamar udowodnił, że nie musi ścigać się o miejsca na listach przebojów, by pozostać najważniejszym głosem w kulturze.</p><br><p class='source-tag'>Źródło: pgLang</p>", "searchTags": "kendrick lamar mr morale", "likes": 280, "dislikes": 20, "comments": [] },
  "art_18": { "category": "archive", "region": "US", "timestamp": 1722470400000, "title": "A$AP Rocky powraca z Don't Be Dumb", "snippet": "Lord Flacko kończy wieloletnie milczenie zupełnie nowym brzmieniem.", "content": "<p>A$AP Rocky kazał nam czekać stanowczo za długo, zajmując się w międzyczasie modą i rodziną. Kiedy projekt 'Don't Be Dumb' ujrzał światło dzienne, fani na całym świecie odetchnęli z ogromną ulgą. Rocky idealnie połączył swój klasyczny, chłodny nowojorski swag z nowoczesnymi, mocno eksperymentalnymi i nieprzewidywalnymi produkcjami.</p><p>Album jest pełen niesamowitych, psychodelicznych wizualizacji, a sam raper udowadnia, że mimo bycia światową ikoną mody, wciąż potrafi zniszczyć każdy bit bez najmniejszego wysiłku. To powrót króla w wielkim stylu.</p><br><p class='source-tag'>Źródło: AWGE</p>", "searchTags": "asap rocky dont be dumb", "likes": 160, "dislikes": 3, "comments": [] },
  "art_19": { "category": "archive", "region": "PL", "timestamp": 1675209600000, "title": "Gibbs i gigantyczny sukces 'Dopehouse'", "snippet": "Od cichego, genialnego producenta do wokalisty wypełniającego hale po brzegi.", "content": "<p>Gibbs przeszedł niesamowitą, inspirującą drogę w polskim przemyśle muzycznym. Znany przez lata głównie jako utalentowany producent najpoważniejszych ulicznych i klasycznych polskich płyt, w pewnym momencie odważył się chwycić za mikrofon. Efekt? Całkowicie zdominował rynek swoim głębokim, szorstkim głosem i jesienną melancholią.</p><p>Jego własna wytwórnia Dopehouse to obecnie jedna z największych, niezależnych sił w polskim hip-hopie. Gibbs udowodnił wszystkim, że muzykalność, dbałość o detale i klasyczne podejście do instrumentów wciąż mają ogromne znaczenie dla dzisiejszych słuchaczy.</p><br><p class='source-tag'>Źródło: Dopehouse Label</p>", "searchTags": "gibbs dopehouse", "likes": 90, "dislikes": 1, "comments": [] },
  "art_20": { "category": "archive", "region": "PL", "timestamp": 1664582400000, "title": "Zeamsone - 5 Influencer", "snippet": "Jak niezależny, młody artysta zbudował armię fanów i rozbił mainstream.", "content": "<p>Zeamsone to doskonały, współczesny przykład artysty kompletnego, który wszystko robi sam. Od precyzyjnej produkcji potężnych bitów, przez nagrywanie chwytliwych wokali, aż po końcowy mix i mastering w swoim studiu. Jego flagowa płyta '5 Influencer' to pokaz niesamowitych umiejętności wokalnych i ewolucji od czasów podziemia.</p><p>Nigdy nie potrzebował wielkich kontraktów z gigantycznymi wytwórniami, by generować dziesiątki milionów wyświetleń. Jego fani to zgrana i jedna z najbardziej oddanych grup w polskim internecie, a on sam z każdym kolejnym rokiem bezlitośnie podnosi poprzeczkę jakości dla reszty sceny.</p><br><p class='source-tag'>Źródło: Opracowanie własne</p>", "searchTags": "zeamsone 5 influencer", "likes": 77, "dislikes": 4, "comments": [] },
  "art_21": { "category": "news", "region": "PL", "timestamp": 1718000000000, "title": "Kabe - Powrót do korzeni", "snippet": "Polsko-francuski styl wciąż króluje na osiedlach.", "content": "<p>Kabe od lat utrzymuje pozycję jednego z najbardziej unikalnych artystów na scenie. Jego bezbłędne łączenie francuskiego slangu z polską, brutalną rzeczywistością to przepis, którego nikt inny nie potrafi tak dobrze odtworzyć. Nowe utwory wskazują na to, że Kabe celuje teraz w bardziej mroczne, osiedlowe brzmienia rodem z przedmieść Paryża.</p><p>Jego współprace z czołowymi producentami pokazują, że artysta nie osiada na laurach. Czeka nas kolejna solidna dawka mocnego, europejskiego rapu, który testuje wytrzymałość głośników na każdym blokowisku.</p><br><p class='source-tag'>Źródło: QueQuality</p>", "searchTags": "kabe francja", "likes": 42, "dislikes": 2, "comments": [] },
  "art_22": { "category": "news", "region": "US", "timestamp": 1720000000000, "title": "Don Toliver zdefiniował brzmienie Houston", "snippet": "Hardstone Psycho to ostateczne wejście na szczyt list przebojów.", "content": "<p>Don Toliver przez lata funkcjonował nieco w cieniu swojego mentora Travisa Scotta, ale z potężnym albumem 'Hardstone Psycho' ostatecznie przejął pełną kontrolę nad swoim gwiazdorskim statusem. Jego niesamowity, unikalny wokal w połączeniu z ciężkimi, motocyklowymi i rockowymi bitami to absolutny majstersztyk produkcyjny.</p><p>Płyta ta ma niesamowity, brudny i skórzany klimat, który idealnie pasuje do estetyki wizualnej, jaką Don serwuje swoim fanom w teledyskach i na koncertach. Stał się on oficjalnie jednym z najważniejszych artystów tworzących szeroko pojęte RnB w USA.</p><br><p class='source-tag'>Źródło: Cactus Jack</p>", "searchTags": "don toliver hardstone psycho", "likes": 190, "dislikes": 2, "comments": [] },
  "art_23": { "category": "news", "region": "PL", "timestamp": 1721000000000, "title": "Kaz Bałagane i jego narkotyczny storytelling", "snippet": "Książę nieporządku nadal dyktuje warunki w warszawskim podziemiu.", "content": "<p>Kaz Bałagane to fenomen. Nikt w Polsce nie pisze tak abstrakcyjnych, naszpikowanych warszawskim slangiem i czarnym humorem tekstów jak on. Jego najnowsze ruchy i luźne utwory udowadniają, że wciąż ma monopol na opowiadanie historii z ciemnej strony miasta, które brzmią jak scenariusze do filmów kryminalnych Guya Ritchiego.</p><p>Jego hermetyczny styl, choć początkowo trudny w odbiorze dla przeciętnego słuchacza, przyciąga tysiące fanatyków, którzy cenią w rapie brak cenzury, cynizm i całkowite odcięcie od politycznej poprawności.</p><br><p class='source-tag'>Źródło: Narkopop</p>", "searchTags": "kaz balagane narkopop", "likes": 110, "dislikes": 8, "comments": [] },
  "art_24": { "category": "news", "region": "US", "timestamp": 1725000000000, "title": "Lil Uzi Vert odzyskuje formę?", "snippet": "Zapowiedzi 'Luv Is Rage 3' rozpalają fanów w sieci.", "content": "<p>Po długiej przerwie i mieszanym przyjęciu albumu Pink Tape, Lil Uzi Vert ponownie wszedł do studia z ogromną determinacją. Krążące po sieci fragmenty (snippety) sugerują powrót do emocjonalnego, melodyjnego brzmienia z ery, która dała mu status globalnej supergwiazdy, odcinając się od rockowych eksperymentów.</p><p>Fani liczą na kosmiczne bity od Maaly Rawa i klasyczny, energiczny flow. Jeśli Uzi rzeczywiście dowiezie to, co słyszymy na przeciekach, Luv Is Rage 3 z pewnością będzie jednym z najważniejszych i najchętniej słuchanych powrotów w amerykańskim rapie.</p><br><p class='source-tag'>Źródło: Generation Now / XXL</p>", "searchTags": "lil uzi vert luv is rage", "likes": 300, "dislikes": 12, "comments": [] },
  "art_25": { "category": "news", "region": "PL", "timestamp": 1730000000000, "title": "Malik Montana - Ekspansja na Europę", "snippet": "Szef GM2L nie zatrzymuje się na polskim podwórku. Współprace z gigantami.", "content": "<p>Malik Montana od dawna zapowiadał, że jego ambicje wykraczają daleko poza polski rynek. Ostatnie miesiące to dobitny dowód na to, że nie rzucał słów na wiatr. Poważne nagrywki z czołówką niemiecką i brytyjską stały się faktem, a jego marka GM2L rośnie w siłę z każdym kolejnym teledyskiem.</p><p>Mroczne, typowo klubowe bity i kontrowersyjny wizerunek sprawiają, że Malik jest dziś najbardziej zasięgowym graczem w polskim internecie. Krytyka jego tekstów zdaje się tylko napędzać algorytmy, z czego raper doskonale zdaje sobie sprawę.</p><br><p class='source-tag'>Źródło: GM2L / RapNews</p>", "searchTags": "malik montana gm2l", "likes": 240, "dislikes": 60, "comments": [] },
  "art_26": { "category": "leak", "region": "US", "timestamp": 1732000000000, "title": "Homixide Gang - Brutalne archiwa Opium", "snippet": "Wyciekają niepublikowane, ekstremalnie ciężkie utwory z obozu Cartiego.", "content": "<p>Homixide Gang, duet wchodzący w skład wytwórni Opium, znany jest z najbardziej agresywnego brzmienia w całej paczce. Do sieci trafiła właśnie paczka potężnych plików audio, które miały znaleźć się na ich najnowszym, odwołanym projekcie. Zniszczone przesterem basy i szybkie, szczekane wersy to istna poezja dla fanów moshpitów.</p><p>Te leaki udowadniają, że moda na rage rap wcale nie minęła, a wręcz przeciwnie – ewoluuje w jeszcze mroczniejsze, brudne, gitarowe rejony, z którymi radiowy mainstream nie potrafi i nie chce sobie w żaden sposób radzić.</p><br><p class='source-tag'>Źródło: Discord Opium Leaks</p>", "searchTags": "homixide gang opium leak", "likes": 85, "dislikes": 3, "comments": [] },
  "art_27": { "category": "news", "region": "US", "timestamp": 1740000000000, "title": "Nettspend: Dzieciak, który wkurzył branżę", "snippet": "Jak nastolatek z Virginii stworzył wokół siebie kult nienawiści i podziwu.", "content": "<p>Nettspend jest absolutną twarzą ruchu, który starsi słuchacze nazywają 'śmieciem', a młodzi 'genialnym, świeżym brzmieniem'. Używając celowo agresywnych, oderwanych od rytmu bębnów i niechlujnych wokali, ugruntował swoją pozycję w podziemiu i stał się niekwestionowanym królem TikToka na przekór krytykom z Twittera.</p><p>Jego koncerty to absolutny chaos. Możesz go nienawidzić za brak dykcji, autotune'a i brak skilli lirycznych, ale nie możesz zignorować faktu, że to właśnie tacy odklejeni artyści definiują dziś amerykański, młodzieżowy underground.</p><br><p class='source-tag'>Źródło: Complex</p>", "searchTags": "nettspend underground", "likes": 42, "dislikes": 88, "comments": [] },
  "art_28": { "category": "news", "region": "PL", "timestamp": 1745000000000, "title": "Wane i nowa era SoundClouda", "snippet": "Chłopak z podziemia stał się twarzą nowej fali trapu w Polsce.", "content": "<p>Wane to postać, której nie da się w żaden sposób zignorować. Jego agresywny, brudny styl, silnie zakorzeniony w estetyce glo i rage, zmienia reguły gry na polskim podziemnym SoundCloudzie, odcinając się od ugrzecznionego, radiowego pop-rapu. Każdy jego nowy snippet zyskuje tysiące odtworzeń w jeden wieczór.</p><p>Jego przesterowane wokale na mocnych bitach to powiew absolutnie świeżego powietrza na scenie. Udowadnia, że nie potrzebuje radiowych, chwytliwych refrenów, żeby generować gigantyczne liczby i budować niewiarygodną wręcz lojalność fanów.</p><br><p class='source-tag'>Źródło: The Crate</p>", "searchTags": "wane mlody west", "likes": 176, "dislikes": 5, "comments": [] },
  "art_29": { "category": "news", "region": "PL", "timestamp": 1750000000000, "title": "Aleshen - Melodie nowej fali", "snippet": "Unikalne wokale na polskich bitach. Jak Aleshen znajduje swoje miejsce na scenie.", "content": "<p>W zalewie bardzo podobnych do siebie, krzyczących do mikrofonu trapowych artystów, Aleshen wyróżnia się niesamowitym wyczuciem melodii. Jego internetowe wycieki i oficjalne dropy cieszą się ogromną popularnością wśród poszukiwaczy nieco spokojniejszego, bardziej emocjonalnego brzmienia w polskim podziemiu.</p><p>To muzyka, która brzmi jak stworzona w 100% do samotnej, nocnej jazdy po mieście. Wokale mocno zatopione w przestrzennych efektach typu reverb i delay sprawiają, że z każdym dniem wyrasta on na jednego z prawdziwych liderów nowej, nastrojowej fali.</p><br><p class='source-tag'>Źródło: Opracowanie własne The Crate</p>", "searchTags": "aleshen soundcloud", "likes": 64, "dislikes": 3, "comments": [] },
  "art_30": { "category": "news", "region": "PL", "timestamp": 1760000000001, "title": "Młody West: Kolejny krok do dominacji", "snippet": "Ewolucja brzmienia z polskiego undergroundu. Czy Młody West przejmie scenę?", "content": "<p>Młody West absolutnie nie zwalnia swojego morderczego tempa. Jego najnowsze, podziemne utwory i pojawiające się w sieci zwiastuny pokazują ewolucję w stronę jeszcze bardziej eksperymentalnych, połamanych i syntetycznych bitów. Fani z lupą w ręku analizują każdy jego ruch na Instagramie, wyczekując przełomowego, debiutanckiego materiału.</p><p>To ostateczny dowód na to, że polskie podziemie żyje i ma się wręcz wybornie, stale dostarczając głodnych sukcesu artystów gotowych rzucić wyzwanie starym, skostniałym gigantom mainstreamu. West, blisko współpracując m.in. z Wane, tworzy obecnie najsilniejszy i najbardziej obserwowany ruch na scenie.</p><br><p class='source-tag'>Źródło: The Crate Podziemie</p>", "searchTags": "mlody west wane", "likes": 155, "dislikes": 2, "comments": [] }
};

app.use(express.json()); 
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error("Zablokowano uszkodzony JSON z żądania.");
        return res.status(400).send({ success: false, msg: 'Błąd danych JSON' });
    }
    next();
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/articles', (req, res) => {
    let dbData = safeReadDB();
    if (Object.keys(dbData).length < 25) {
        fs.writeFileSync(dbPath, JSON.stringify(defaultDB, null, 2), 'utf8');
        dbData = defaultDB;
    }
    res.json(dbData);
});

app.post('/api/article/:id/vote', (req, res) => {
    const { type } = req.body; 
    let db = safeReadDB();
    if(db[req.params.id]) {
        if(!db[req.params.id].likes) db[req.params.id].likes = 0;
        if(!db[req.params.id].dislikes) db[req.params.id].dislikes = 0;
        if(type === 'like') db[req.params.id].likes++; else db[req.params.id].dislikes++;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ success: true, likes: db[req.params.id].likes, dislikes: db[req.params.id].dislikes });
    } else res.json({ success: false });
});

app.post('/api/article/:id/comment', (req, res) => {
    const { username, text } = req.body;
    let db = safeReadDB();
    if(db[req.params.id]) {
        if(!db[req.params.id].comments) db[req.params.id].comments = [];
        const dateStr = new Date().toLocaleDateString('pl-PL') + " " + new Date().toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'});
        db[req.params.id].comments.push({ username, text, date: dateStr });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ success: true, comments: db[req.params.id].comments });
    } else res.json({ success: false });
});

// LOGOWANIE, REJESTRACJA I PROFIL
app.post('/api/register', (req, res) => {
    const { email, username, password } = req.body;
    let users = safeReadUsers();
    
    if (users[username]) return res.json({ success: false, msg: "Ten Nick jest już zajęty!" });
    if (Object.values(users).some(u => u.email === email)) return res.json({ success: false, msg: "E-mail w użyciu!" });

    const verificationToken = crypto.randomBytes(20).toString('hex');

    users[username] = { 
        email, password, points: 0, avatar: "", bio: "", socials: { ig: "", sc: "", yt: "", sp: "" }, 
        isVerified: false, 
        verificationToken: verificationToken 
    };
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    const host = req.get('host');
    const protocol = req.protocol;
    const verifyLink = `${protocol}://${host}/api/verify-email?token=${verificationToken}&user=${username}`;

    const mailOptions = {
        from: '"THE CRATE." <twoj.mail@gmail.com>', 
        to: email,
        subject: 'Witaj w podziemiu! Aktywuj konto na THE CRATE.',
        html: `
            <div style="background-color: #0f0e0d; color: #e2dcd0; padding: 30px; font-family: sans-serif; text-align: center; border: 2px solid #dbff00;">
                <h1 style="color: #e5383b; text-transform: uppercase;">THE CRATE.</h1>
                <h2 style="color: #dbff00;">Siema ${username}!</h2>
                <p style="font-size: 16px;">Twoje konto zostało pomyślnie utworzone. Aby móc zdobywać punkty w Aux Battle i komentować najświeższe leaki, musisz potwierdzić swój adres e-mail.</p>
                <a href="${verifyLink}" style="background-color: #dbff00; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; font-size: 18px; display: inline-block; margin-top: 20px; border-radius: 5px;">AKTYWUJ KONTO</a>
                <p style="margin-top: 30px; opacity: 0.5; font-size: 12px;">Jeśli to nie Ty zakładałeś konto, zignoruj tę wiadomość.</p>
            </div>
        `
    };

    // WYSYŁKA W TLE - ZWROT DO KLIENTA NATYCHMIASTOWY
    transporter.sendMail(mailOptions).catch(err => console.log("Błąd SMTP: ", err));

    res.json({ success: true });
});

// ENDPOINT: ODBIERANIE KLIKNIĘCIA Z MAILA I WYSYŁKA POWITANIA
app.get('/api/verify-email', (req, res) => {
    const { token, user } = req.query;
    let users = safeReadUsers();

    if (users[user] && users[user].verificationToken === token) {
        users[user].isVerified = true;
        users[user].verificationToken = null; 
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

        const host = req.get('host');
        const protocol = req.protocol;
        
        const welcomeMailOptions = {
            from: '"THE CRATE." <twoj.mail@gmail.com>', 
            to: users[user].email,
            subject: 'Konto aktywowane! Witamy w THE CRATE.',
            html: `
                <div style="background-color: #0f0e0d; color: #e2dcd0; padding: 30px; font-family: sans-serif; text-align: center; border: 2px solid #dbff00;">
                    <h1 style="color: #e5383b; text-transform: uppercase;">THE CRATE.</h1>
                    <h2 style="color: #dbff00;">Konto aktywowane pomyślnie!</h2>
                    <p style="font-size: 16px;">Twoje konto o nazwie <b>${user}</b> jest już w pełni aktywne na naszej stronie. Możesz się teraz zalogować, dyskutować z innymi i brać udział w pojedynkach Aux Battle.</p>
                    <a href="${protocol}://${host}" style="background-color: #dbff00; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; font-size: 18px; display: inline-block; margin-top: 20px; border-radius: 5px;">WEJDŹ NA STRONĘ</a>
                </div>
            `
        };

        transporter.sendMail(welcomeMailOptions).catch(err => console.log("Błąd wysyłki maila powitalnego: ", err));
        
        res.send(`
            <body style="background:#0f0e0d; color:#dbff00; font-family:sans-serif; text-align:center; padding-top:100px;">
                <h1 style="font-size:40px;">KONTO ZWERYFIKOWANE!</h1>
                <p style="color:#e2dcd0; font-size:20px;">Możesz się teraz zalogować w systemie THE CRATE.</p>
                <a href="/" style="display:inline-block; margin-top:30px; background:#e5383b; color:#fff; padding:15px 30px; text-decoration:none; font-weight:bold; text-transform:uppercase;">WRÓĆ NA STRONĘ GŁÓWNĄ</a>
            </body>
        `);
    } else {
        res.send(`
            <body style="background:#0f0e0d; color:#e5383b; font-family:sans-serif; text-align:center; padding-top:100px;">
                <h1 style="font-size:40px;">BŁĄD WERYFIKACJI</h1>
                <p style="color:#e2dcd0; font-size:20px;">Link aktywacyjny jest nieważny lub konto zostało już aktywowane.</p>
                <a href="/" style="display:inline-block; margin-top:30px; background:#dbff00; color:#000; padding:15px 30px; text-decoration:none; font-weight:bold; text-transform:uppercase;">WRÓĆ NA STRONĘ GŁÓWNĄ</a>
            </body>
        `);
    }
});

app.post('/api/login', (req, res) => {
    const { login, password } = req.body; 
    let users = safeReadUsers();
    for (const [nick, data] of Object.entries(users)) {
        if ((nick === login || data.email === login) && data.password === password) {
            if(!data.isVerified) return res.json({ success: false, msg: "Konto nie zostało aktywowane! Sprawdź pocztę e-mail." });
            return res.json({ success: true, msg: "Zalogowano!", user: { username: nick, ...data } });
        }
    }
    res.json({ success: false, msg: "Błędne dane logowania!" });
});

app.post('/api/profile', (req, res) => {
    const { username, avatar, bio, socials } = req.body; 
    let users = safeReadUsers();
    if (users[username]) { 
        users[username].avatar = avatar; 
        users[username].bio = bio; 
        users[username].socials = socials; 
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2)); 
        res.json({ success: true }); 
    }
});

app.get('/api/user/:username', (req, res) => { 
    let users = safeReadUsers(); 
    if (users[req.params.username]) res.json({ success: true, user: users[req.params.username] }); 
    else res.json({ success: false }); 
});

app.get('/api/leaderboard', (req, res) => { 
    let users = safeReadUsers(); 
    let sorted = Object.keys(users).map(k => ({ username: k, points: users[k].points })).sort((a, b) => b.points - a.points).slice(0, 10); 
    res.json(sorted); 
});

// ==========================================
// CHATBOT AI 
// ==========================================
async function callSmartAI(systemMsg, userMsg) {
    try {
        const payload = JSON.stringify({ messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }], model: 'openai' });
        const res = await fetch('https://text.pollinations.ai/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
        return await res.text();
    } catch(e) { return null; }
}

app.post('/api/chat', async (req, res) => {
    const sysPrompt = `Jesteś Digger_AI, wirtualnym redaktorem portalu rapowego THE CRATE. Bądź naturalnym, wyluzowanym ziomkiem, który po prostu dobrze zna się na muzyce rap/trap.
    ZASADY, KTÓRYCH MUSISZ PRZESTRZEGAĆ:
    1. Pisz w 100% poprawnym językiem polskim.
    2. MASZ ABSOLUTNY ZAKAZ zmyślania faktów i wymyślania tytułów piosenek! Jeśli nie znasz konkretnego utworu z podziemia (np. rapera Wane, Aleshen), napisz po prostu: "Ciężko wybrać jeden numer, chłopak wrzuca sporo luźnych tracków na Soundcloudzie, trzeba to śledzić na bieżąco".
    3. Używaj tylko naturalnych, powszechnie akceptowanych w rapie zwrotów (np. beat, podziemie, flow, track, underground).
    4. CAŁKOWITY ZAKAZ boomerskiego slangu (zero słów typu: drip, swag, mordo, tissue, smack, sazek).
    5. Żadnego sztywnego, naukowego języka (zero "eksplorowania struktur" czy analiz). Odpowiadaj krótko (max 3 zdania).`;
    
    const reply = await callSmartAI(sysPrompt, req.body.message) || "Sorki, wystąpił błąd serwera. Spróbuj jeszcze raz.";
    res.json({ reply: reply.replace(/\n/g, '<br>') });
});

// ==========================================
// MULTIPLAYER (BATTLE & MIXER)
// ==========================================
const activeRooms = {};
io.on('connection', (socket) => {
    socket.emit('updateRooms', activeRooms);
    socket.on('createRoom', (data) => { const roomId = 'CYPHER-' + Math.random().toString(36).substr(2, 5).toUpperCase(); activeRooms[roomId] = { id: roomId, hostName: data.alias, hostSocket: socket.id, players: 1 }; socket.join(roomId); socket.emit('roomCreated', activeRooms[roomId]); io.emit('updateRooms', activeRooms); });
    socket.on('joinRoom', (data) => { const room = activeRooms[data.roomId]; if (!room || room.players >= 2) return; room.players++; room.player2Name = data.alias; room.player2Socket = socket.id; socket.join(room.id); io.to(room.id).emit('gameStarted', room); io.emit('updateRooms', activeRooms); });
    socket.on('searchTrack', async (query) => { try { const r = await ytSearch(query); socket.emit('searchResults', r.videos.slice(0, 4).map(v => ({ id: v.videoId, title: v.title, thumb: v.thumbnail }))); } catch (e) {} });
    socket.on('searchTrackMixer', async (data) => { try { const r = await ytSearch(data.query); if(r && r.videos.length > 0) socket.emit('searchResultsMixer', { videos: r.videos.slice(0, 4), deck: data.deck, error: false }); else socket.emit('searchResultsMixer', { videos: [], deck: data.deck, error: true }); } catch (e) { socket.emit('searchResultsMixer', { videos: [], deck: data.deck, error: true }); } });
    socket.on('submitTrack', (data) => { const room = activeRooms[data.roomId]; if(room) { room.currentTrack = data.ytId; room.originalTitle = data.title; io.to(room.id).emit('trackPlaying', { currentTrack: room.currentTrack }); } });
    socket.on('makeGuess', (data) => {
        const room = activeRooms[data.roomId];
        if(room) {
            if(data.guess === "timeout") io.to(room.id).emit('gameOver', { winner: room.hostName, points: 0, msg: `CZAS MINĄŁ! To było: ${room.originalTitle}` });
            else {
                const g = data.title.toLowerCase().replace(/[^a-z0-9]/g, ''); const c = room.originalTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
                if(data.ytId === room.currentTrack || c.includes(g) || g.includes(c)) io.to(room.id).emit('gameOver', { winner: room.player2Name, points: data.points, msg: `TRAFIENIE! Wykryto track: ${room.originalTitle}` });
                else io.to(room.id).emit('gameOver', { winner: room.hostName, points: data.points, msg: `PUDŁO! To było: ${room.originalTitle}` });
            }
            delete activeRooms[data.roomId]; io.emit('updateRooms', activeRooms);
        }
    });
    socket.on('claimPoints', (data) => { let users = safeReadUsers(); if(users[data.username]) { users[data.username].points += data.points; fs.writeFileSync(usersPath, JSON.stringify(users, null, 2)); io.emit('leaderboardUpdated'); } });
});

// ==========================================
// AUTODIGGER AI - BEZPIECZNE GENEROWANIE NEWSÓW
// ==========================================
const fallbackBank = [
    { title: "Future & Metro Boomin - Złota Era Trapu", snippet: "Duet, który nie potrafi nagrać słabego utworu.", content: "<p>Kiedy Metro Boomin robi bity, a Future wchodzi do kabiny, dzieje się magia. Ich projekty to absolutna esencja atlantskiego trapu, od mrocznych syntezatorów po lodowate flow Plutona.</p><p>Każdy wyciek z ich sesji nagraniowych to natychmiastowy hit w podziemiu. Future udowadnia, że wciąż potrafi wyznaczać nowe standardy toksycznego brzmienia R&B.</p><p>To niesamowite, jak ich chemia ewoluowała od czasów 'Monster'. Żaden inny duet w rapie nie ma takiej powtarzalności w dostarczaniu hitów.</p><br><p class='source-tag'>Źródło: The Crate</p>", searchQuery: "Future official music video", isLeak: false, artist: "Future" }
];

async function runAutoDigger() {
    let currentDB = safeReadDB();
    let articleData = null;

    try {
        const sysPrompt = `Jesteś redaktorem The Crate. MUSISZ napisać min. 15 zdań, bardzo długi tekst. Pisz w 100% po polsku. ZAKAZ wymyślania dziwnych słów. NIE PISZ DATY. Na końcu dodaj: <br><p class='source-tag'>Źródło: HiphopDX</p>.`;
        const usrPrompt = `Wybierz [Ken Carson, J Cole, Wane, Szpaku]. ZWRÓĆ TYLKO JSON: {"title": "Tytuł", "snippet": "Długa zajawka", "content": "<p>Epicki artykuł.</p>", "searchQuery": "Ksywa rapera", "isLeak": true_lub_false, "artist": "Ksywa"}`;

        let aiText = await callSmartAI(sysPrompt, usrPrompt);
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        
        if(jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.title && parsed.content.length > 200) {
                    articleData = parsed;
                }
            } catch(parseErr) {
            }
        }
    } catch(e) {}

    if(!articleData) articleData = fallbackBank[Math.floor(Math.random() * fallbackBank.length)];
    if (Object.values(currentDB).some(item => item.title === articleData.title)) return;

    try {
        let ytQuery = articleData.searchQuery;
        if(!articleData.isLeak) ytQuery = articleData.artist + " official music video";
        const searchResults = await ytSearch(ytQuery);
        let finalContent = articleData.content;

        if (searchResults && searchResults.videos.length > 0) {
            const vTitle = searchResults.videos[0].title.toLowerCase();
            const aName = (articleData.artist || "").toLowerCase();
            if (!articleData.isLeak || (articleData.isLeak && vTitle.includes(aName))) {
                const headerText = articleData.isLeak ? "/ ZNALEZIONY WYCIEK" : "/ POSŁUCHAJ KLASYKU (WIDEO)";
                finalContent += `<h3 style="color: var(--acid); margin-top: 3rem; font-family:'Syne';">${headerText}</h3><iframe class="media-embed" src="https://www.youtube.com/embed/${searchResults.videos[0].videoId}" frameborder="0" allowfullscreen></iframe>`;
            }
        }

        const now = Date.now(); 
        
        currentDB['auto_' + now] = {
            category: "news", 
            region: articleData.title.includes('Wane') || articleData.title.includes('Szpaku') ? 'PL' : 'US',
            timestamp: now, 
            searchTags: articleData.title.toLowerCase(),
            title: articleData.title, snippet: articleData.snippet, content: finalContent,
            likes: 0, dislikes: 0, comments: []
        };

        fs.writeFileSync(dbPath, JSON.stringify(currentDB, null, 2), 'utf8');
        io.emit('newArticleAdded', { title: articleData.title, snippet: articleData.snippet });
    } catch(e) {}
}

setTimeout(runAutoDigger, 15000); setInterval(runAutoDigger, 300000);
const PORT = 3000;
server.listen(PORT, () => console.log(`[THE CRATE] System Online (Port: ${PORT}).`));