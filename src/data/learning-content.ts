export interface Lesson {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  transcript: {
    en: string;
    ro: string;
    fr: string;
  };
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Module {
  id: string;
  number: number;
  title: string;
  shortDesc: string;
  lessons: Lesson[];
  quiz: QuizQuestion[];
}

export const MOOC_CONTENT: Module[] = [
  {
    id: "module-1",
    number: 1,
    title: "Introduction to AI & Heritage",
    shortDesc: "Foundational AI concepts and their transformative role in cultural preservation.",
    lessons: [
      {
        id: "m1-l1",
        title: "Introduction to AI and Heritage",
        youtubeId: "e_Yz5r5T7J8",
        description: "Learn how Large Language Models act as digital assistants to breathe new life into historical documents.",
        transcript: {
          en: `Hello and welcome to Module One: Introduction to AI and Heritage, part of the Echoes of the Past Erasmus+ project.

Imagine a collection of postcards from 1914. They are not just pieces of paper; they hold personal memories, language, and emotions. However, these materials are at risk. Fading ink and brittle paper can turn these stories into partial fragments. This is where artificial intelligence can help.

Think of LLMs (Large Language Models) as a powerful digital brain designed to understand and generate human language. These models act as assistants to help us transcribe, translate, interpret, or breathe new life into historical documents—without ever replacing human judgment.

How AI Thinks
Let's start by breaking down how AI thinks in simple terms. You can view LLMs as very smart prediction machines. Imagine you are typing on your smartphone and it suggests the next word; that is a tiny version of what a massive AI language model does.

- The Prompt: You type something in. This is what we call the prompt or input.
- Processing: The AI analyzes your input. It doesn't "understand" it in the way a person does; instead, it looks for patterns.
- The Library: It compares your input to everything it has ever read. Imagine a massive library containing every book, article, and conversation available on the internet. It remembers which words usually follow others.
- The Guess: Based on those patterns, it guesses the most likely next word, then the one after that, and so on.

For example, if you type, "It’s raining cats and..." the AI has seen the phrase "cats and dogs" so many times that it is almost certain "dogs" comes next. Similarly, if an old letter says, "Dear Mother, we arrived...", the AI has seen thousands of letters where people say "arrived safely" or "arrived yesterday." It picks the most statistically fitting word.

There is a website you can explore where you can see an illustration of this process. The designer of that platform has mapped out neural networks as well. By running the sentence "Intelligence is..." through the LLM with different criteria, they created a visual representation of how the model's digital neurons connect and how they identify the statistically most likely next part of the sentence.

Why "Large"?
Why do we call these models "large"? It’s simple: scale gives them ability. A top-tier language model pairs a complex digital brain with an enormous amount of text. Four things define this scale:

1. Tokens: Think of tokens as tiny pieces of text or parts of a word. The model studies billions of them to learn the patterns of how we talk and write.
2. Huge Datasets: These models are trained on massive collections of books, letters, and records. It’s as if the model has a huge reservoir of human writing.
3. Neural Networks: This is the model's digital wiring—a structure that links words and ideas so it can predict how a sentence should continue.
4. Contextual Knowledge: Because of its size, the model can handle context, make analogies, and deal with messy or unclear language, such as the kind found in smudged historical records.

The main point is: Big Data + Big Model = Useful World Knowledge. This is why these tools are so helpful for tricky heritage tasks.

Flexibility and Application
What makes LLMs so useful is their flexibility. Older AI models were single-task: one for translation, another for summarizing. Modern LLMs can perform many jobs through the same simple interface or API.

On our platform, we have several pre-configured actions ready to use, but you also have the ability to customize your own. Our current toolkit includes:
- Creating historical narratives
- Creating illustrative architectural renders
- Generating audio tours
- Writing "time capsule" letters
- Creating animations
- Image recoloring and enhancement
- OCR (Optical Character Recognition) transcription
- Sentiment analysis
- Generating museum labels and tags

We invite you to explore these and also work towards creating your own prompts.

The CARE Framework
To improve the quality of your prompts and results, it is helpful to use a framework. One of the best is the CARE framework:
- C – Context: Provide the AI with background on the task.
- A – Action: Give it a clear, specific task.
- R – Result: Define the desired format, length, and style of the output.
- E – Example: Provide examples of your desired output to guide the LLM.

The Human Element
As we conclude this first module, we must talk about the most important role: yours. While LLMs are powerful assistants, historical truth still requires human judgment, verification, and context. In this project, the archivist always remains responsible for the final story.

A vital caveat to keep in mind: Plausible is not the same as proven. AI models can sometimes "hallucinate." This means they produce confident-sounding text that seems reasonable but is actually factually wrong.

Because of this, we work in a partnership. The AI is the co-pilot: it drafts summaries, translates text, or helps guess missing words on a smudged card. But you, the human, must verify this work. Your job is to compare the suggestions against official records, your own expertise, and the memory of your community to ensure accuracy.

Through this process, you are building valuable digital skills while learning the limits and responsibilities of technology. Together, we are preserving our shared collective memory with greater access and stronger care than ever. Our ultimate goal is to use AI to bridge the digital divide while preserving the echoes of our shared past.

The AI is here to help, but you are the one who saves history. Thank you.`,
          ro: `Salut și bun venit la Modulul Unu: Introducere în IA și Patrimoniu, parte a proiectului Erasmus+ Echoes of the Past.

Imaginați-vă o colecție de cărți poștale din 1914. Nu sunt doar bucăți de hârtie; ele păstrează amintiri personale, limbaj și emoții. Totuși, aceste materiale sunt expuse riscului. Cerneala care se estompează și hârtia fragilă pot transforma aceste povești în fragmente parțiale. Aici poate ajuta inteligența artificială.

Gândiți-vă la LLM-uri (Modele de Limbaj Mari) ca la un creier digital puternic, conceput pentru a înțelege și genera limbaj uman. Aceste modele acționează ca asistenți care ne ajută să transcriem, să traducem, să interpretăm sau să dăm o nouă viață documentelor istorice – fără a înlocui vreodată judecata umană.

Cum gândește IA
Să începem prin a descompune modul în care gândește IA în termeni simpli. Puteți privi LLM-urile ca pe niște mașini de predicție foarte inteligente. Imaginați-vă că tastați pe smartphone și acesta vă sugerează următorul cuvânt; este o versiune minusculă a ceea ce face un model de limbaj IA masiv.

- Solicitarea (Prompt): Tastați ceva. Aceasta este ceea ce numim solicitare sau input.
- Procesarea: IA vă analizează inputul. Nu îl "înțelege" așa cum o face un om; în schimb, caută tipare.
- Biblioteca: Compară inputul cu tot ce a citit vreodată. Imaginați-vă o bibliotecă masivă care conține fiecare carte, articol și conversație disponibilă pe internet. Își amintește ce cuvinte urmează de obicei după altele.
- Ghicirea: Pe baza acestor tipare, ghicește cel mai probabil următorul cuvânt, apoi următorul, și așa mai departe.

De exemplu, dacă tastați, "Plouă cu găleata și...", IA a văzut această expresie de atâtea ori încât este aproape sigură ce urmează. În mod similar, dacă o scrisoare veche spune, "Dragă mamă, am ajuns...", IA a văzut mii de scrisori în care oamenii spun "am ajuns cu bine" sau "am ajuns ieri." Alege cuvântul care se potrivește cel mai bine din punct de vedere statistic.

De ce "Mari"?
De ce numim aceste modele "mari"? E simplu: scara le dă abilitatea. Un model de limbaj de top asociază un creier digital complex cu o cantitate enormă de text. Patru lucruri definesc această scară:

1. Token-uri: Gândiți-vă la token-uri ca la mici bucăți de text sau părți dintr-un cuvânt. Modelul studiază miliarde de ele pentru a învăța tiparele modului în care vorbim și scriem.
2. Seturi uriașe de date: Aceste modele sunt antrenate pe colecții masive de cărți, scrisori și înregistrări. Este ca și cum modelul ar avea un rezervor uriaș de scriere umană.
3. Rețele Neuronale: Acesta este cablajul digital al modelului – o structură care leagă cuvinte și idei, astfel încât să poată prezice cum ar trebui să continue o propoziție.
4. Cunoștințe contextuale: Datorită dimensiunii sale, modelul poate gestiona contextul, face analogii și trata limbajul dezordonat sau neclar, cum ar fi cel găsit în înregistrările istorice pătate.

Flexibilitate și Aplicare
Ceea ce face LLM-urile atât de utile este flexibilitatea lor. Modelele IA mai vechi aveau o singură sarcină: unul pentru traducere, altul pentru rezumare. LLM-urile moderne pot îndeplini multe sarcini prin aceeași interfață simplă sau API.

Cadrul CARE
Pentru a îmbunătăți calitatea solicitărilor și a rezultatelor dvs., este util să utilizați un cadru. Unul dintre cele mai bune este cadrul CARE:
- C – Context: Oferiți IA contextul sarcinii.
- A – Acțiune: Oferiți o sarcină clară și specifică.
- R – Rezultat: Definiți formatul, lungimea și stilul dorit pentru ieșire.
- E – Exemplu: Oferiți exemple ale ieșirii dorite pentru a ghida LLM-ul.

Elementul Uman
Încheind acest prim modul, trebuie să vorbim despre cel mai important rol: al vostru. Deși LLM-urile sunt asistenți puternici, adevărul istoric necesită în continuare judecată umană, verificare și context. În acest proiect, arhivistul rămâne întotdeauna responsabil pentru povestea finală.

Un avertisment vital de ținut minte: Plauzibil nu înseamnă dovedit. Modelele IA pot uneori să "halucineze." Aceasta înseamnă că produc text cu sunet încrezător, care pare rezonabil, dar este de fapt incorect faptic. IA este aici pentru a vă ajuta, dar voi sunteți cei care salvează istoria. Vă mulțumesc.`,
          fr: `Bonjour et bienvenue dans le Module Un : Introduction à l'IA et au Patrimoine, dans le cadre du projet Erasmus+ Echoes of the Past.

Imaginez une collection de cartes postales de 1914. Ce ne sont pas seulement des morceaux de papier ; elles renferment des souvenirs personnels, un langage et des émotions. Cependant, ces documents sont menacés. L'encre qui s'efface et le papier cassant peuvent transformer ces histoires en fragments partiels. C'est là que l'intelligence artificielle peut aider.

Considérez les LLM (Grands Modèles Linguistiques) comme un puissant cerveau numérique conçu pour comprendre et générer le langage humain. Ces modèles agissent comme des assistants pour nous aider à transcrire, traduire, interpréter ou donner une nouvelle vie aux documents historiques — sans jamais remplacer le jugement humain.

Comment pense l'IA
Commençons par décomposer la façon dont l'IA pense en termes simples. Vous pouvez considérer les LLM comme des machines de prédiction très intelligentes. Imaginez que vous tapez sur votre smartphone et qu'il suggère le mot suivant ; c'est une version minuscule de ce que fait un modèle linguistique d'IA massif.

- Le Prompt (l'invite) : Vous tapez quelque chose. C'est ce que nous appelons le prompt ou l'entrée.
- Le Traitement : L'IA analyse votre entrée. Elle ne la « comprend » pas comme le fait une personne ; elle cherche plutôt des modèles.
- La Bibliothèque : Elle compare votre entrée à tout ce qu'elle a lu. Imaginez une bibliothèque massive contenant chaque livre, article et conversation disponibles sur Internet. Elle se souvient quels mots en suivent généralement d'autres.
- La Prédiction : Sur la base de ces modèles, elle devine le mot suivant le plus probable, puis le suivant, et ainsi de suite.

Par exemple, si vous tapez « Il pleut des cordes et... », l'IA a vu cette expression tant de fois qu'elle est presque certaine de ce qui suit. De même, si une vieille lettre dit « Chère mère, nous sommes arrivés... », l'IA a vu des milliers de lettres où les gens disent « arrivés à bon port » ou « arrivés hier ». Elle choisit le mot le plus approprié statistiquement.

Pourquoi « Grands » ?
Pourquoi appelons-nous ces modèles « grands » ? C'est simple : l'échelle leur donne des capacités. Un modèle linguistique de premier plan associe un cerveau numérique complexe à une énorme quantité de texte. Quatre éléments définissent cette échelle :

1. Les Tokens : Considérez les tokens comme de minuscules morceaux de texte ou des parties d'un mot. Le modèle en étudie des milliards pour apprendre les modèles de notre façon de parler et d'écrire.
2. D'énormes jeux de données : Ces modèles sont entraînés sur des collections massives de livres, lettres et archives. C'est comme si le modèle disposait d'un immense réservoir de l'écriture humaine.
3. Réseaux de Neurones : C'est le câblage numérique du modèle, une structure qui relie les mots et les idées afin de pouvoir prédire comment une phrase devrait continuer.
4. Connaissances Contextuelles : En raison de sa taille, le modèle peut gérer le contexte, faire des analogies et traiter un langage désordonné ou peu clair, comme celui que l'on trouve dans des archives historiques tachées.

Flexibilité et Application
Ce qui rend les LLM si utiles, c'est leur flexibilité. Les anciens modèles d'IA étaient monotâches : un pour la traduction, un autre pour le résumé. Les LLM modernes peuvent effectuer de nombreuses tâches via la même interface simple ou API.

Le Cadre CARE
Pour améliorer la qualité de vos invites et résultats, il est utile d'utiliser un cadre. L'un des meilleurs est le cadre CARE :
- C – Contexte : Fournissez à l'IA le contexte de la tâche.
- A – Action : Donnez-lui une tâche claire et spécifique.
- R – Résultat : Définissez le format, la longueur et le style souhaités pour la sortie.
- E – Exemple : Fournissez des exemples de votre sortie souhaitée pour guider le LLM.

L'Élément Humain
Pour conclure ce premier module, nous devons parler du rôle le plus important : le vôtre. Bien que les LLM soient de puissants assistants, la vérité historique exige toujours le jugement, la vérification et le contexte humains. Dans ce projet, l'archiviste reste toujours responsable de l'histoire finale.

Une mise en garde vitale à garder à l'esprit : Plausible ne signifie pas prouvé. Les modèles d'IA peuvent parfois « halluciner ». Cela signifie qu'ils produisent un texte qui semble confiant et raisonnable, mais qui est en fait factuellement faux. L'IA est là pour vous aider, mais c'est vous qui sauvez l'histoire. Merci.`
        }
      }
    ],
    quiz: [
      {
        question: "What is the primary goal of the Echoes of the Past platform?",
        options: [
          "To replace human historians with AI",
          "To digitize, geolocate, and creatively reimagine historical postcards",
          "To sell expensive historical artifacts",
          "To create a social media network for tourists"
        ],
        correctAnswer: 1,
        explanation: "Echoes of the Past uses AI not to replace human judgment, but to assist archivists in preserving, mapping, and breathing new life into fragile historical postcards."
      },
      {
        question: "How does a Large Language Model (LLM) generate text?",
        options: [
          "By understanding the deep emotional meaning of words like a human does",
          "By accessing a live encyclopedia and copying facts directly",
          "By identifying statistical patterns to guess the most likely next word",
          "By asking a team of human programmers for the correct answer"
        ],
        correctAnswer: 2,
        explanation: "LLMs act as highly advanced prediction machines. They use enormous datasets to calculate the statistical probability of which words should follow each other, based on patterns."
      },
      {
        question: "What does the 'C' stand for in the CARE prompt framework?",
        options: [
          "Clarity",
          "Context",
          "Calculation",
          "Creativity"
        ],
        correctAnswer: 1,
        explanation: "The C stands for Context. Providing the AI with background information on the task ensures the output is appropriately framed for your specific historical goal."
      },
      {
        question: "What is an AI 'hallucination'?",
        options: [
          "When the AI generates a surreal image instead of text",
          "When the AI's servers overheat and shut down",
          "When the AI refuses to answer a prompt",
          "When the AI produces confident-sounding text that is factually incorrect"
        ],
        correctAnswer: 3,
        explanation: "Because LLMs predict the most statistically plausible next word, they can sometimes generate 'plausible but false' information, known as hallucinations. This is why human verification is critical."
      },
      {
        question: "Why are modern LLMs considered 'flexible' compared to older AI models?",
        options: [
          "They run on smaller computers like smartphones",
          "They can perform multiple different tasks (translation, summarization, coding) through a single interface",
          "They automatically translate themselves into any language instantly",
          "They do not require any input prompts to work"
        ],
        correctAnswer: 1,
        explanation: "Unlike single-purpose older AI (like a tool that only translates), modern LLMs can summarize, translate, generate labels, and even code—all from the same interface."
      }
    ]
  },
  {
    id: "module-2",
    number: 2,
    title: "No-code AI Tools",
    shortDesc: "Mastering user-friendly AI platforms for digital archiving without writing a single line of code.",
    lessons: [
      {
        id: "m2-l1",
        title: "Platform Walkthrough & Archiving",
        youtubeId: "GRanx_4PTgU",
        description: "A complete guide on how to navigate, upload, edit postcards, generate creative assets, and configure settings on the Echoes of the Past platform.",
        transcript: {
          en: `So, this is the Echoes of the Past platform. Here you can see the previously uploaded postcard assets. You can delete them, you can download them as JSON, or you can edit them. By clicking edit, you can see some more information such as latitude, longitude, the title, and the short description which AI inferred from the uploaded pictures. And here you can generate additional content based on the postcard itself. So, for example, you can do a time capsule letter, which will generate a fictional story based on the historical context of the postcard.

You have the content, which, as you can see, has been customized based on the details of the postcard. Another example is the architectural render, so we'll try and generate an image related to that era. And of course, after generating the image, you can save it so it's kept under the main postcard space under the creative space.

So as well within the platform, you have the learn space. This is where you'll find the different modules which will provide some theoretical, academic understanding of how AI works, but also different features of the platform. And as well, within each module, you will have a short quiz to take part in.

So now, let's move and upload our first postcard by clicking add story. So we have two options. One is to upload using JSON. This is great if you need to bulk upload multiple postcards at once. And so we have a useful feature here called copy format guide for AI. So this is essentially a prompt which is copied straight to the clipboard which you can then use in your favorite chatbot, such as ChatGPT or Claude, with the idea that the AI can help you format the files in the correct way so it can be uploaded to the platform. But in our instance, since we're uploading a single picture, we can click upload image, locate a postcard, and then click analyze with AI vision. So this is where the AI will try and infer some historical context about the postcard as well as the potential location for that said postcard. So here we see AI has inferred some information. So we can click add to map and the postcard will appear here at the bottom of the space. And as well, we can click the map view, which gives us a geographic estimate of where the different postcards are located.

So essentially here we can start reimagining and adding new life into the postcard and working on the archiving process.

So finally, we can take a look at the settings page. So the settings page is where you configure the different tools which power the platform, from Supabase to different LLMs which are being used. But to facilitate installation, we have a setup guide which can be copied straight to your clipboard, which you can then paste into your favorite LLM to help you with the process of installing the platform or if you hit any hurdles. And finally, we've also implemented a useful chatbot which, once configured, you can ask questions about the project or even questions related to history.`,
          ro: `Aceasta este platforma Echoes of the Past. Aici puteți vedea elementele cărților poștale încărcate anterior. Le puteți șterge, le puteți descărca ca JSON sau le puteți edita. Făcând clic pe editare, puteți vedea mai multe informații, cum ar fi latitudinea, longitudinea, titlul și descrierea scurtă pe care IA le-a dedus din imaginile încărcate. Și aici puteți genera conținut suplimentar pe baza cărții poștale în sine. De exemplu, puteți crea o scrisoare de tip capsulă a timpului, care va genera o poveste fictivă bazată pe contextul istoric al cărții poștale.

Aveți conținutul, care, după cum puteți vedea, a fost personalizat pe baza detaliilor cărții poștale. Un alt exemplu este randarea arhitecturală, așa că vom încerca să generăm o imagine legată de acea epocă. Și, desigur, după generarea imaginii, o puteți salva astfel încât să fie păstrată în spațiul principal al cărții poștale sub spațiul creativ.

De asemenea, în cadrul platformei, aveți spațiul de învățare (learn). Aici veți găsi diferitele module care vor oferi o înțelegere teoretică, academică a modului în care funcționează IA, dar și diferite funcționalități ale platformei. Și, de asemenea, în cadrul fiecărui modul, veți avea un scurt chestionar la care să participați.

Acum, să trecem la încărcarea primei noastre cărți poștale făcând clic pe adăugare poveste (add story). Avem două opțiuni. Una este încărcarea folosind JSON. Acest lucru este excelent dacă trebuie să încărcați în masă mai multe cărți poștale deodată. Și avem o funcție utilă aici numită copiere ghid de formatare pentru IA (copy format guide for AI). Acesta este în esență un prompt care este copiat direct în clipboard, pe care îl puteți utiliza apoi în chatbotul preferat, cum ar fi ChatGPT sau Claude, cu ideea ca IA să vă ajute să formatați fișierele în mod corect pentru a fi încărcate pe platformă. În cazul nostru, deoarece încărcăm o singură imagine, putem face clic pe încărcare imagine (upload image), localizăm o carte poștală și apoi facem clic pe analiză cu IA vision (analyze with AI vision). Aici IA va încerca să deducă un context istoric despre cartea poștală, precum și locația potențială pentru respectiva carte poștală. Vedem că IA a dedus câteva informații. Putem face clic pe adăugare la hartă (add to map) și cartea poștală va apărea aici în partea de jos a spațiului. Și, de asemenea, putem face clic pe vizualizarea hărții (map view), ceea ce ne oferă o estimare geografică a locului în care se află diferitele cărți poștale.

Practic, aici putem începe să reimaginăm și să dăm o nouă viață cărții poștale, lucrând la procesul de arhivare.

În cele din urmă, putem arunca o privire la pagina de setări. Pagina de setări este locul în care configurați diferitele instrumente care alimentează platforma, de la Supabase la diferitele modele de limbaj (LLM) utilizate. Dar pentru a facilita instalarea, avem un ghid de configurare care poate fi copiat direct în clipboard, pe care îl puteți lipi apoi în LLM-ul preferat pentru a vă ajuta cu procesul de instalare a platformei sau dacă întâmpinați dificultăți. Și, în sfârșit, am implementat și un chatbot util care, odată configurat, vă permite să puneți întrebări despre proiect sau chiar întrebări legate de istorie.`,
          fr: `Voici la plateforme Echoes of the Past. Ici, vous pouvez voir les cartes postales précédemment téléchargées. Vous pouvez les supprimer, les télécharger au format JSON ou les modifier. En cliquant sur modifier, vous pouvez voir des informations supplémentaires telles que la latitude, la longitude, le titre et la description courte que l'IA a déduites des images téléchargées. Et ici, vous pouvez générer du contenu supplémentaire basé sur la carte postale elle-même. Par exemple, vous pouvez rédiger une lettre de capsule temporelle, qui générera une histoire fictive basée sur le contexte historique de la carte postale.

Vous disposez du contenu qui, comme vous pouvez le voir, a été personnalisé en fonction des détails de la carte postale. Un autre exemple est le rendu architectural, nous allons donc essayer de générer une image liée à cette époque. Et bien sûr, après avoir généré l'image, vous pouvez la sauvegarder afin qu'elle soit conservée dans l'espace principal de la carte postale sous l'espace créatif.

De plus, au sein de la plateforme, vous disposez de l'espace d'apprentissage (learn). C'est là que vous trouverez les différents modules qui vous apporteront une compréhension théorique et académique du fonctionnement de l'IA, mais aussi des différentes fonctionnalités de la plateforme. Et pour chaque module, vous aurez un court quiz auquel participer.

Maintenant, passons au téléchargement de notre première carte postale en cliquant sur ajouter une histoire (add story). Nous avons deux options. La première consiste à importer via un fichier JSON. C'est idéal si si vous devez importer plusieurs cartes postales en masse. Nous avons également une fonctionnalité très utile appelée copier le guide de formatage pour l'IA (copy format guide for AI). Il s'agit essentiellement d'une consigne (prompt) copiée directement dans le presse-papiers que vous pouvez ensuite utiliser dans votre chatbot préféré, comme ChatGPT ou Claude, afin que l'IA vous aide à formater les fichiers correctement pour leur intégration sur la plateforme. Mais dans notre cas, comme nous téléchargeons une seule image, nous pouvons cliquer sur charger une image (upload image), localiser une carte postale, puis cliquer sur analyser avec l'IA vision (analyze with AI vision). C'est ici que l'IA va essayer de déduire le contexte historique de la carte postale ainsi que sa localisation potentielle. Nous voyons ici que l'IA a déduit certaines informations. Nous pouvons cliquer sur ajouter à la carte (add to map) et la carte postale apparaîtra en bas de l'espace. Nous pouvons également cliquer sur la vue carte (map view), ce qui nous donne une estimation géographique de l'emplacement des différentes cartes postales.

Ainsi, nous pouvons commencer à réimaginer et à redonner vie aux cartes postales tout en travaillant sur le processus d'archivage.

Enfin, nous pouvons jeter un coup d'œil à la page des paramètres. C'est ici que vous configurez les différents outils qui alimentent la plateforme, de Supabase aux différents LLM utilisés. Pour faciliter l'installation, nous avons un guide de configuration qui peut être copié directement dans le presse-papiers, que vous pouvez ensuite coller dans votre LLM préféré pour vous aider lors de l'installation de la plateforme ou si vous rencontrez des obstacles. Enfin, nous avons également mis en œuvre un chatbot utile qui, une fois configuré, vous permet de poser des questions sur le projet ou sur l'histoire.`
        }
      }
    ],
    quiz: [
      {
        question: "How can multiple postcards be bulk uploaded to the Echoes of the Past platform?",
        options: [
          "By taking a live picture with a webcam",
          "By uploading a JSON file containing multiple postcards",
          "By sending an email to the support team",
          "By printing them out and mailing them"
        ],
        correctAnswer: 1,
        explanation: "The platform supports bulk uploading multiple postcards at once using a formatted JSON file."
      },
      {
        question: "What does the 'copy format guide for AI' button do?",
        options: [
          "It copies a pre-written prompt to your clipboard to help an LLM format your files",
          "It downloads a software program to format images",
          "It copies the website's source code",
          "It formats your computer's hard drive"
        ],
        correctAnswer: 0,
        explanation: "The 'copy format guide for AI' feature copies a prompt to the clipboard, which you can paste into ChatGPT or Claude to format your archival data correctly for uploading."
      },
      {
        question: "What is the purpose of the 'time capsule letter' feature on the platform?",
        options: [
          "To lock the postcard so no one else can edit it for 50 years",
          "To generate a fictional story based on the historical context inferred from the postcard",
          "To send a physical email to the postcard's original recipient",
          "To check if the postcard's location is safe from natural disasters"
        ],
        correctAnswer: 1,
        explanation: "The time capsule letter feature generates creative historical narratives or fictional stories based on the historical context and metadata of the postcard."
      },
      {
        question: "Where are the generated creative assets (like architectural renders) saved?",
        options: [
          "They are automatically deleted when you close the tab",
          "They are saved directly under the main postcard workspace in the creative space",
          "They are posted to a public social media page",
          "They are saved to your local desktop folder"
        ],
        correctAnswer: 1,
        explanation: "Once you generate creative assets (such as architectural renders or historical texts), you can save them so they remain attached to that specific postcard in its creative space."
      },
      {
        question: "What is the purpose of the setup guide button on the Settings page?",
        options: [
          "To book a call with a professional archivist",
          "To copy an interactive step-by-step setup prompt to guide an AI assistant in helping you install the platform",
          "To buy licenses for Google Maps and OpenAI",
          "To download the installation manuals in French and Romanian"
        ],
        correctAnswer: 1,
        explanation: "The setup guide button copies an interactive, step-by-step assistant prompt to your clipboard, which can be pasted into ChatGPT, Claude, or Gemini to guide you through platform installation and configuration."
      }
    ]
  },
  {
    id: "module-3",
    number: 3,
    title: "Computer Vision",
    shortDesc: "Understanding how AI analyzes images to recognize architectural styles and historical details.",
    lessons: [
      {
        id: "m3-l1",
        title: "Computer Vision for AI & Heritage",
        youtubeId: "I7mBKNlUn1g",
        description: "Learn how AI models analyze images at the pixel level to identify architectural clues, restore faded details, and fill in historical visual gaps.",
        transcript: {
          en: `Hello and welcome to the module on Computer Vision for AI and Heritage, as part of the Echoes of the Past project.

A photo or postcard can show a place, a person, or a moment from the past. But often, these old photos become faded, scratched, blurry, or stained. Yet, that photo still carries information and still has a story. That story is now hidden, and AI can help us uncover hidden clues, helping us understand the original story of that asset or postcard.

But how does computer vision differ from human vision? It starts with understanding pixels, which are essentially small colored squares. When we zoom in on a photograph or an image displayed on a computer, we can see these different pixels. Once the computer takes the pixels, it starts to understand what the lines, edges, and simple marks are, and what the shapes might be. From this, and using trained data, the AI is able to label these different objects displayed in the image.

One type of AI image model is the CNN, or Convolutional Neural Network, which looks at an image in stages. First, it sees the pixels, then it finds simple features like lines, then it builds those into bigger stages, and at the end, makes a guess about what is in the image. The AI builds an understanding one step at a time. There is a website for those who wish to get into the technical details called "CNN Explainer," where you can add your own picture to see what the AI is doing and how it identifies the most likely match through statistics.

AI can help us see things that are hard for the human eye to see, and then fill in those gaps to suggest the most likely content, pixels, and shapes within that space. An example of this is with Tesla's self-driving technology. On the left, you can see an image taken without any modifications from a camera, and on the right, you can see how AI uses trained data to fill in the gaps. You can see it can dramatically reduce the impact of extreme glare. Our platform can work in a similar way.

Beyond this, AI can also help us identify where the image was taken and during which era by looking at architectural clues. The models are trained on information relating to different eras of architecture or fashion, and the geographic details of those images, enabling them to infer that information.

But once again, you have to be aware that AI is not a foolproof process. While it can make very strong educated guesses about what the missing data is, that data may not be factually correct.

An example of this, taken from this postcard, can be seen by expanding the postcard and asking AI to fill in the gaps. By expanding and zooming out of that postcard, the AI filled in the information surrounding the postcard. We did two iterations with slightly different settings. At first glance, everything seems coherent in these two pictures, but when you zoom in on the details, for example, the houses on the first floor at the back have different architectures. Obviously, there is no easy way to verify which one is more accurate.

This is even more pronounced if we zoom backward here. We can clearly see an example of the AI misinterpreting the picture, moving it from a rural setting to an urban one and resulting in artifacts that do not reflect the original picture.

To conclude, one should always be aware that AI is essentially making educated guesses. It is not a foolproof system, so always have checks in place to verify accuracy as much as possible. Thank you.`,
          ro: `Bună ziua și bun venit la modulul de Computer Vision pentru IA și Patrimoniu, ca parte a proiectului Echoes of the Past.

O fotografie sau o carte poștală poate arăta un loc, o persoană sau un moment din trecut. Dar adesea, aceste fotografii vechi devin șterse, zgâriate, încețoșate sau pătate. Cu toate acestea, acea fotografie încă poartă informații și are o poveste. Acea poveste este acum ascunsă, iar IA ne poate ajuda să descoperim indicii ascunse, ajutându-ne să înțelegem povestea originală a acelui obiect sau a acelei cărți poștale.

Dar cum diferă viziunea computerizată (computer vision) de viziunea umană? Totul începe cu înțelegerea pixelilor, care sunt practic mici pătrate colorate. Când mărim o fotografie sau o imagine afișată pe un computer, putem vedea acești pixeli diferiți. Odată ce computerul preia pixelii, începe să înțeleagă ce sunt liniile, marginile și semnele simple și care ar putea fi formele. Din acestea, și folosind date de antrenare, IA este capabilă să eticheteze diferitele obiecte afișate în imagine.

Un tip de model de imagine IA este CNN, sau Rețeaua Neuronală Convoluțională, care analizează o imagine în etape. Mai întâi, vede pixelii, apoi găsește caracteristici simple, cum ar fi liniile, apoi le construiește în etape mai mari și, la sfârșit, face o presupunere despre ce se află în imagine. IA își construiește o înțelegere pas cu pas. Există un site web pentru cei care doresc să intre în detaliile tehnice numit „CNN Explainer”, unde puteți adăuga propria imagine pentru a vedea ce face IA și cum identifică cea mai probabilă potrivire prin intermediul statisticilor.

IA ne poate ajuta să vedem lucruri care sunt greu de văzut cu ochiul liber și apoi să completeze acele goluri pentru a sugera cel mai probabil conținut, pixeli și forme în acel spațiu. Un exemplu în acest sens este tehnologia de conducere autonomă de la Tesla. În stânga, puteți vedea o imagine realizată fără modificări de către o cameră, iar în dreapta, puteți vedea cum IA utilizează datele de antrenare pentru a încerca să completeze golurile. Puteți vedea cum poate reduce dramatic impactul strălucirii extreme a luminii. Platforma noastră poate funcționa într-un mod similar.

Dincolo de aceasta, IA ne poate ajuta, de asemenea, să identificăm unde a fost făcută imaginea și în ce epocă, analizând indicii arhitecturale. Modelele sunt antrenate pe informații referitoare la diferite epoci de arhitectură sau modă, precum și pe detaliile geografice ale acelor imagini, permițându-le să deducă acele informații.

Dar, încă o dată, trebuie să fiți conștienți de faptul că IA nu este un proces infailibil. Deși poate face presupuneri foarte bine argumentate despre datele care lipsesc, acele date pot să nu fie corecte din punct de vedere factual.

Un exemplu în acest sens, extras din această carte poștală, poate fi văzut prin extinderea cărții poștale și solicitarea IA de a completa golurile. Prin extinderea și micșorarea (zoom out) acelei cărți poștale, IA a completat informațiile din jurul ei. Am făcut două iterații cu setări ușor diferite. La prima vedere, totul pare coerent în aceste două imagini, dar când mărim detaliile, de exemplu, casele din spate au arhitecturi diferite. Evident, nu există o cale ușoară de a verifica care dintre ele este mai precisă.

Acest lucru este și mai pronunțat dacă micșorăm imaginea mai mult aici. Putem vedea clar un exemplu în care IA interpretează greșit imaginea, mutând-o dintr-un cadru rural într-unul urban și generând artefacte care nu reflectă imaginea originală.

În concluzie, ar trebui să fim întotdeauna conștienți de faptul că IA face în esență presupuneri educate. Nu este un sistem infailibil, așa că asigurați-vă întotdeauna că aveți verificări pentru a sugera o acuratețe cât mai mare posibilă. Vă mulțumesc.`,
          fr: `Bonjour et bienvenue dans le module sur la Vision par Ordinateur (Computer Vision) pour l'IA et le Patrimoine, dans le cadre du projet Echoes of the Past.

Une photo ou une carte postale peut montrer un lieu, une personne ou un moment du passé. Mais souvent, ces vieilles photos deviennent décolorées, rayées, floues ou tachées. Pourtant, cette photo contient toujours des informations et porte une histoire. Cette histoire est désormais cachée, et l'IA peut nous aider à découvrir des indices invisibles, nous aidant ainsi à comprendre l'histoire originale de cet objet ou de cette carte postale.

Mais en quoi la vision par ordinateur diffère-t-elle de la vision humaine ? Tout commence par la compréhension des pixels, qui sont essentiellement de petits carrés de couleur. Lorsque nous zoomons sur une photographie ou une image affichée sur un ordinateur, nous pouvons voir ces différents pixels. Une fois que l'ordinateur a saisi les pixels, il commence à comprendre ce que sont les lignes, les contours et les formes simples. À partir de là, et en utilisant des données d'entraînement, l'IA est capable d'identifier et d'étiqueter les différents objets présents dans l'image.

Un type de modèle d'image IA est le CNN, ou Réseau de Neurones Convolutif, qui analyse une image par étapes. D'abord, il voit les pixels, puis il trouve des caractéristiques simples comme des lignes, puis il les assemble dans des étapes plus complexes et, à la fin, il formule une hypothèse sur ce qui se trouve dans l'image. L'IA construit sa compréhension étape par étape. Il existe un site web pour ceux qui souhaitent entrer dans les détails techniques, appelé « CNN Explainer », où vous pouvez ajouter votre propre image pour voir ce que fait l'IA et comment elle identifie la correspondance la plus probable grâce aux statistiques.

L'IA peut nous aider à voir des choses difficiles à percevoir à l'œil nu, puis à combler ces lacunes pour suggérer le contenu, les pixels et les formes les plus probables dans cet espace. Un exemple de cela est la technologie de conduite autonome de Tesla. À gauche, vous pouvez voir une image prise sans aucune modification par une caméra, et à droite, vous pouvez voir comment l'IA utilise ses données d'entraînement pour essayer de combler les lacunes. On peut voir qu'elle peut réduire considérablement l'impact d'un éblouissement extrême. Notre plateforme peut fonctionner de manière similaire.

Au-delà de cela, l'IA peut également nous aider à identifier où l'image a été prise et à quelle époque, en recherchant des indices architecturaux. Les modèles sont entraînés sur des informations relatives aux différentes époques d'architecture ou de mode, ainsi qu'aux zones géographiques de ces images, ce qui leur permet d'en déduire ces informations.

Mais encore une fois, vous devez être conscient que l'IA n'est pas un processus infaillible. Bien qu'elle puisse faire des suppositions très plausibles sur les données manquantes, ces données peuvent ne pas être factuellement correctes.

Un exemple de cela, tiré de cette carte postale, peut être observé en étendant la carte postale et en demandant à l'IA de combler les espaces vides. En élargissant et en zoomant en arrière sur cette carte postale, l'IA a completé les informations autour de celle-ci. Nous avons fait deux itérations avec des paramètres légèrement différents. À première vue, tout semble cohérent dans ces deux images, mais lorsque l'on zoome sur les détails, par exemple, les maisons à l'arrière ont des architectures différentes. Évidemment, il n'y a pas de moyen simple de vérifier laquelle est la plus fidèle.

C'est encore plus prononcé si nous zoomons en arrière ici. Nous pouvons clairement voir un exemple où l'IA interprète mal l'image, passant d'un cadre rural à un cadre urbain, ce qui produit des artefacts qui ne reflètent pas l'image d'origine.

En conclusion, on doit toujours garder à l'esprit que l'IA fait essentiellement des suppositions basées sur des probabilités. Ce n'est pas un système infaillible, il faut donc toujours mettre en place des vérifications pour garantir la plus grande exactitude possible. Merci.`
        }
      }
    ],
    quiz: [
      {
        question: "How does computer vision start analyzing an image?",
        options: [
          "By translating the text written in the image",
          "By understanding pixels, which are small colored squares",
          "By searching the internet for similar captions",
          "By asking the user for a description of the photo"
        ],
        correctAnswer: 1,
        explanation: "Computer vision starts at the pixel level. Pixels are the small colored squares that make up an image, which the AI then analyzes to identify edges, lines, and shapes."
      },
      {
        question: "What does CNN stand for in the context of AI image models?",
        options: [
          "Computer Network Node",
          "Centralized Neural Network",
          "Convolutional Neural Network",
          "Creative Noise Normalizer"
        ],
        correctAnswer: 2,
        explanation: "CNN stands for Convolutional Neural Network. It is a class of deep neural networks commonly used for analyzing visual imagery in progressive stages."
      },
      {
        question: "How does a Convolutional Neural Network (CNN) build its understanding of an image?",
        options: [
          "It analyzes the entire image at once in a single step",
          "It processes the image in stages, starting from pixels, finding simple features (lines), and building up to shapes and objects",
          "It ignores the pixels and only looks at the filename",
          "It requires human input at each stage of the analysis"
        ],
        correctAnswer: 1,
        explanation: "A CNN looks at an image in stages: first it sees pixels, then simple features like lines, then larger shapes, and finally makes a statistical guess about the objects in the image."
      },
      {
        question: "What does the Tesla self-driving camera example demonstrate about AI vision?",
        options: [
          "AI can drive a car better than a human without any training",
          "AI can use trained data to fill in visual gaps and dramatically reduce the impact of extreme glare",
          "AI cannot operate in sunny conditions",
          "AI vision only works for video, not for static images"
        ],
        correctAnswer: 1,
        explanation: "The Tesla example shows that AI can take camera input with extreme glare and use its trained data to fill in the visual gaps, restoring visibility of the road."
      },
      {
        question: "Why should you be cautious when using AI to expand or fill in missing parts of a historical postcard?",
        options: [
          "The AI will delete the original postcard files",
          "The AI makes educated guesses which might not be factually correct and can introduce incorrect settings or artifacts",
          "The AI requires licensing fees for every expanded image",
          "The expanded parts will always be completely black"
        ],
        correctAnswer: 1,
        explanation: "AI vision models fill in details based on statistical probabilities and training data. Since this is an educated guess, the generated details may be historically inaccurate, build incorrect architectures, or misinterpret rural settings as urban ones."
      }
    ]
  },
  {
    id: "module-4",
    number: 4,
    title: "Natural Language Processing (NLP)",
    shortDesc: "Extracting narratives and transcribing handwritten messages from the past.",
    lessons: [
      {
        id: "m4-l1",
        title: "Reading the Handwritten Past",
        youtubeId: "llmzCjOx1oU",
        description: "Explore the challenges of reading cursive handwriting, how traditional OCR and AI Vision combine, and how Natural Language Processing (NLP) helps reconstruct historical text.",
        transcript: {
          en: `Hello and welcome to our fourth module: Reading the Handwritten Past.

In many postcards or historical documents, you will have observed that there is often cursive handwriting which is extremely hard to read and understand. A lot of grammar and linguistics have evolved over time, and the style of writing makes it simply hard to identify the letters in the text. The bigger problem is that this handwritten cursive text isn't searchable through a computer because it is not in a data-friendly format, and the computer is not able to identify what the letters within the images are.

This is where multiple techniques are possible. One of them is OCR, which means Optical Character Recognition. This technology has existed for a long time now—more than several decades. The way it works is that you input an image of a scanned text document, and the OCR usually applies image enhancement to make the letters more distinctive and the lines more visually identifiable. Then, it separates each letter and uses an algorithm to identify what each letter is, finally outputting a data-friendly text result which is both editable and searchable.

But handwriting poses a unique challenge. OCR is good at processing typed or clearly printed text documents from newspapers, letters, or books. However, it does not perform as well with handwriting, or cursive text in particular, since handwriting differs from individual to individual and also from era to era.

This is where AI can play a key role. While traditional OCR is good at reading plain, printed text, AI vision can also identify context and additional information, allowing it to go much further than traditional OCR. In fact, the best technique is often to employ OCR combined with AI vision to fill in the missing information and correct any mistakes the OCR might have made.

An example of this is NLP, which stands for Natural Language Processing. It helps the AI work out the meaning of the text, not just the individual letters. While OCR is designed to identify single letters, NLP can understand the wider context. For example, if you run a text through OCR and a word is missing, such as: "I [blank] to return soon", the NLP is able to analyze the surrounding context. Based on its training data, it knows that the most likely missing word is "home" or "hope" to form "I hope to return home soon."

NLP essentially helps with rough transcriptions by identifying and reading nearby clues within the wider text, document, or the user's objectives. This unlocks a range of possibilities, from transcriptions to making documents searchable, translating, or summarizing. On our platform, by transcribing the text of a postcard, we also unlock the possibility of using that text to generate new content, such as a comic book, a story, or a narration.

Once again, we would like to emphasize that while AI can help accelerate your work and make you more productive, it often makes mistakes or incorrect inferences. You always remain in charge and must validate the approach and results generated by the AI. Thank you.`,
          ro: `Bună ziua și bun venit la cel de-al patrulea modul: Citirea trecutului scris de mână.

În multe cărți poștale sau documente istorice, veți observa că există adesea scris de mână cursiv care este extrem de greu de citit și de înțeles. O mare parte din gramatică și lingvistică a evoluat de-a lungul timpului, iar stilul de scriere face pur și simplu dificilă identificarea literelor în text. Marea problemă este, de asemenea, că acest text scris de mână cursiv nu poate fi căutat pe computer deoarece nu este într-un format prietenos cu datele, iar computerul nu poate identifica literele din imagini.

Aici intervin mai multe tehnici posibile. Una dintre ele este OCR, care înseamnă Recunoașterea Optică a Caracterelor (Optical Character Recognition). Această tehnologie există de mult timp – de mai bine de câteva decenii. Modul în care funcționează este că introduceți o imagine a unui document text scanat, iar OCR-ul aplică de obicei o îmbunătățire a imaginii pentru a face literele mai distincte și liniile mai ușor de identificat vizual. Apoi, separă fiecare literă și folosește un algoritm pentru a identifica ce este fiecare literă, oferind în cele din urmă un rezultat text prietenos cu datele, care poate fi editat și căutat.

Dar scrisul de mână reprezintă o provocare unică. OCR-ul este bun la procesarea documentelor text dactilografiate sau tipărite clar din ziare, scrisori sau cărți. Cu toate acestea, nu funcționează la fel de bine cu scrisul de mână sau cu scrisul cursiv în special, deoarece scrisul de mână diferă de la o persoană la alta, dar și de la o epocă la alta.

Aici poate juca un rol cheie inteligența artificială. În timp ce OCR-ul tradițional este bun la citirea textului simplu și tipărit, viziunea artificială (AI vision) poate identifica, de asemenea, contextul și informațiile suplimentare, fiind capabilă să meargă mult mai departe decât poate face OCR-ul tradițional. De fapt, cea mai bună tehnică este adesea utilizarea OCR-ului combinat cu viziunea artificială pentru a completa informațiile lipsă și a corecta greșelile pe care le-ar fi putut face OCR-ul.

Un exemplu în acest sens este NLP, care înseamnă Procesarea Limbajului Natural (Natural Language Processing). Acesta ajută IA să înțeleagă sensul textului, nu doar literele individuale. În timp ce OCR-ul este conceput doar pentru a identifica litere individuale, NLP poate înțelege un context mai larg. De exemplu, dacă aveți un text trecut prin OCR în care lipsește un cuvânt, cum ar fi: „Sper să mă întorc [lipsă] curând”, NLP-ul poate analiza contextul înconjurător. Pe baza datelor sale de antrenare, ar ști că cel mai probabil cuvânt lipsă este „acasă” pentru a forma „Sper să mă întorc acasă curând”.

NLP-ul ajută în esență la transcrieri aproximative prin identificarea și citirea indiciilor din apropiere în cadrul textului mai larg, al documentului sau al obiectivelor utilizatorului. Acest lucru deblochează o serie de posibilități, de la transcrieri până la transformarea documentelor în formate căutabile, traducere sau rezumare. În contextul platformei noastre, prin transcrierea textului unei cărți poștale, deblocăm și posibilitatea de a folosi acel text pentru a genera conținut nou, cum ar fi o bandă desenată, o poveste sau o narațiune.

Încă o dată, dorim să subliniem că, deși IA poate ajuta la activitate și vă poate face mai productivi, aceasta face adesea greșeli sau deducții incorecte. Rămâneți întotdeauna responsabil și trebuie să validați abordarea și rezultatele generate de IA. Vă mulțumesc.`,
          fr: `Bonjour et bienvenue dans notre quatrième module : Lire le passé manuscrit.

Dans de nombreuses cartes postales ou documents historiques, vous aurez observé qu'il y a souvent de l'écriture cursive qui est extrêmement difficile à lire et à comprendre. La grammaire et la linguistique ont beaucoup évolué au fil du temps, et le style d'écriture rend tout simplement difficile l'identification des lettres dans le texte. Le problème majeur est également que ce texte manuscrit cursif n'est pas recherchable par ordinateur car il n'est pas dans un format exploitable pour les données, et l'ordinateur n'est pas capable d'identifier ce que sont les lettres dans les images.

C'est là que plusieurs techniques sont possibles. L'une d'elles est l'OCR, qui signifie Reconnaissance Optique de Caractères (Optical Character Recognition). Cette technologie existe depuis longtemps maintenant — plus de plusieurs décennies. Son fonctionnement est le suivant : vous soumettez l'image d'un document texte numérisé, et l'OCR applique généralement une amélioration d'image pour rendre les lettres plus distinctes et les lignes plus facilement identifiables visuellement. Ensuite, il sépare chaque lettre et utilise un algorithme pour identifier chaque lettre, afin de produire finalement un résultat textuel exploitable, modifiable et recherchable.

Mais l'écriture manuscrite pose un défi unique. L'OCR est efficace pour traiter des documents textuels tapés à la machine ou clairement imprimés provenant de journaux, de lettres ou de livres. Cependant, il ne fonctionne pas aussi bien avec l'écriture manuscrite, ou l'écriture cursive en particulier, car celle-ci diffère d'un individu à l'autre, mais aussi d'une époque à l'autre.

C'est là que l'IA peut jouer un rôle clé. Alors que l'OCR traditionnel est efficace pour lire du texte imprimé simple, la vision par ordinateur (AI vision) peut également identifier le contexte et des informations supplémentaires, ce qui lui permet d'aller beaucoup plus loin que l'OCR traditionnel. En fait, la meilleure technique consiste souvent à combiner l'OCR avec la vision par ordinateur pour combler les informations manquantes et corriger les erreurs que l'OCR aurait pu commettre.

Un exemple en est le NLP, qui signifie Traitement du Langage Naturel (Natural Language Processing). Il aide l'IA à comprendre le sens du texte, et pas seulement les lettres individuelles. Alors que l'OCR est simplement conçu pour identifier des lettres individuelles, le NLP peut comprendre un contexte plus large. Par exemple, si vous passez un texte par l'OCR et qu'un mot est manquant, comme : « J'espère rentrer [vide] bientôt », le NLP est capable d'analyser le contexte environnant. Grâce à ses données d'entraînement, il saura que le mot manquant le plus probable est « chez moi » ou « bientôt » (par exemple, « J'espère rentrer à la maison bientôt »).

Le NLP aide essentiellement à réaliser des transcriptions brutes en identifiant et en lisant les indices environnants dans le texte global, le document ou selon l'objectif de l'utilisateur. Cela ouvre de nombreuses possibilités, de la transcription à la recherche dans les documents, en passant par la traduction ou le résumé. Dans le cadre de notre plateforme, en transcrivant le texte d'une carte postale, nous débloquons également la possibilité d'utiliser ce texte pour générer de nouveaux contenus, comme une bande dessinée, une histoire ou une narration.

Une fois de plus, nous tenons à souligner que même si l'IA peut aider à accélérer votre travail et à vous rendre plus productif, elle commet souvent des erreurs ou des déductions erronées. Vous restez toujours aux commandes et devez valider l'approche et les résultats générés par l'IA. Merci.`
        }
      }
    ],
    quiz: [
      {
        question: "Why is traditional OCR (Optical Character Recognition) less effective at reading cursive handwriting on historical postcards?",
        options: [
          "Cursive text is always written in foreign languages that OCR doesn't support",
          "OCR only works on color images and cannot read black and white text",
          "Handwriting style differs significantly from individual to individual and from era to era",
          "Traditional OCR requires internet access, which historical postcards do not have"
        ],
        correctAnswer: 2,
        explanation: "Traditional OCR performs well on standardized, printed, or typed text (like newspapers or books) but struggles with cursive handwriting because writing styles are highly varied across different individuals and historical eras."
      },
      {
        question: "How does Natural Language Processing (NLP) differ from Optical Character Recognition (OCR) in text transcription?",
        options: [
          "OCR identifies individual characters and letters, while NLP analyzes the wider context to understand the meaning of the text",
          "NLP scans physical documents, while OCR only works on digital text files",
          "OCR is a type of AI vision, whereas NLP only works with audio and spoken voice",
          "NLP does not use any statistics or training data, unlike OCR"
        ],
        correctAnswer: 0,
        explanation: "While OCR focuses on identifying individual letters from an image, NLP goes beyond characters to analyze the meaning and surrounding context of the words."
      },
      {
        question: "In the example 'I [blank] to return soon', how does an NLP model help fill in the missing word?",
        options: [
          "By searching Google for the exact phrase to find the original sender's profile",
          "By analyzing nearby clues and utilizing its training data to guess the statistically most likely missing word (like 'hope' or 'home')",
          "By automatically correcting the spelling of all surrounding words",
          "By translating the entire sentence into another language first"
        ],
        correctAnswer: 1,
        explanation: "NLP models use their training on massive text datasets to predict the most likely missing word based on the surrounding context and sentence structure."
      },
      {
        question: "What is often considered the best approach to transcribing messy historical handwriting?",
        options: [
          "Using AI vision only and skipping OCR completely",
          "Manually re-typing the entire text without any assistance from technology",
          "Combining traditional OCR with AI vision and NLP to enhance characters, transcribe text, and correct errors contextually",
          "Translating the image directly without transcribing it first"
        ],
        correctAnswer: 2,
        explanation: "Combining OCR (to identify individual letters/words after image enhancement) with AI vision and NLP (to infer context and correct mistakes) provides the most robust and accurate results for historical documents."
      },
      {
        question: "Who is ultimately responsible for the accuracy of the transcribed historical narrative generated by AI?",
        options: [
          "The AI model itself since it is trained on massive datasets",
          "The computer program that runs the OCR scan",
          "The developer who configured the platform settings",
          "The human archivist or user, who must always review and validate the AI's inferences"
        ],
        correctAnswer: 3,
        explanation: "AI is an assistant that accelerates productivity but can make incorrect inferences or mistakes. The human archivist must always remain in charge, verifying the transcription against historical context and records."
      }
    ]
  },
  {
    id: "module-5",
    number: 5,
    title: "Case Studies",
    shortDesc: "Real-world success stories and inspiration for your own digital heritage projects.",
    lessons: [],
    quiz: []
  }
];

export const DEFAULT_SMART_TUTOR_CONTEXT = `
You are the "Smart Tutor" for the Echoes of the Past (EOP) platform, an Erasmus+ funded initiative. 
Your goal is to assist learners (youth, NEETs, and refugees) in understanding AI and its application in cultural heritage.

STRICT GUIDELINES:
1. Provide supportive, encouraging, and clear pedagogical guidance.
2. Use culturally relevant examples from Europe, Romania, and France.
3. Help users troubleshoot their AI configurations (Supabase, OpenAI, Gemini).
4. Explain technical concepts (Computer Vision, NLP, OCR) in simple, accessible terms.
5. If a user is stuck on a quiz, do not give them the answer immediately—guide them to the correct reasoning.
6. Maintain the mission of digital inclusion and heritage preservation.
`.trim();

export const MOOC_CURRICULUM_PROMPT = `
You are a content creator for the Echoes of the Past (EOP) platform. Help me develop the detailed pedagogical content (video scripts, tutorials, and quizzes) for our 5-module AI & Heritage MOOC.

CURRICULUM STRUCTURE:

Module 1: Introduction to AI & Heritage
- Hook: Dusty postcards "brought to life" by AI.
- Concepts: What is an LLM? Role of AI in history.
- Action: Explain the Erasmus+ vision of digital inclusion.
- Goal: Bridge the digital divide for youth and refugees.

Module 2: No-code AI Tools
- Hook: EOP platform demo.
- Concepts: Zero-deploy architecture, browser AI, privacy.
- Action: Step-by-step walkthrough of adding a postcard.
- Goal: Empower non-technical users to be digital archivists.

Module 3: Computer Vision (The Eye of AI)
- Hook: Zooming into blurry historical photos.
- Concepts: Pixels, patterns, object recognition.
- Action: Demonstrate how EOP analyzes architectural styles.
- Goal: Teach how AI "sees" history.

Module 4: Natural Language Processing (NLP)
- Hook: Reading a handwritten message from 1914.
- Concepts: OCR and sentiment analysis.
- Action: Converting handwriting into searchable text.
- Goal: Unlock secrets hidden in historical correspondence.

Module 5: Case Studies & Inspiration
- Hook: Success stories from other digital projects.
- Concepts: Community engagement, digital storytelling.
- Action: Before/After of a reconstructed historical site.
- Goal: Inspire users to start their own archives.

REQUIRED OUTPUT:
For whichever module I ask about, please provide:
1. A detailed 3-5 minute video script (including visual cues).
2. A step-by-step interactive tutorial text.
3. 5 multiple-choice quiz questions with explanations.
4. Translations in Romanian and French.

Let's start! Which module should we develop first?
`.trim();

