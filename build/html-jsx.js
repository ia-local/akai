const fs = require('fs');
const Groq = require('groq-sdk');
// Initialize the SDKs with API keys
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const introduction = `
  ## Comment construire un site Web ('html/owf','css/json','js/json'[norme web sementique W3C (Web RDFlib)]) WOOw amusant 🔮**
 nous travaillons actuellement sur une interfaces de réponses format HTML, permettant d'intégrer visuellement et graphiquement des EFFETS WOW
`;
const ObjectifsSmart = `
Développez les objectifs SMART pour le cycle de mise à jo
- S pour spécifique : Le contrat doit permettre l'enregistrement et la monetisation des compétences professionnelles tous les X cyles.
- M pour mesurable : Le nombre de compétences certifiées et mises à jour doit être suivi.
- A pour atteignable : Utiliser la blockchain Ethereum pour assurer que les transactions de mise à jour sont immuables.
- R pour réaliste : Le projet doit être réalisable avec les ressources disponibles, y compris les outils de développement blockchain.
- T pour temporel : Le cycle de mise à jour doit être respecté tous les 28 jours (2 419 200 secondes).
`
const devOps = '"[]"';
const howto_typescypt = '"[]"';
const dev = `"${devOps}+#${introduction} if ${ObjectifsSmart} fi."`;
// Define the prompts and roles for each model

const promptingReadme = {
  context: "Utilizing GANs for data refinement emoji intéligent /mode Campagne.",
  role: "assistant",
  tasks: ["Data Generation", "Dynamic Modeling"],
  expectedOutcome: "Improved and adaptable data sets."
};

const promptingHTML = {
  context: "tu seras en charge de la Syntaxe, Itération et génération de contenu .html de notre module",
  role: "system",
  tasks: ["Text Generation","HTML", "Context Understanding"],
  expectedOutcome: "High-quality, coherent text output."
};
const promptingJSX = {
  context: "tu seras en charge de la Syntaxe, Itération et génération de contenu .html de notre module",
  role: "system",
  tasks: ["Text Generation","HTML", "Context Understanding"],
  expectedOutcome: "High-quality, coherent text output."
};

const typeScrypt = {
  HTML: {
      description: 'Génération de texte cohérent et contextuel',
      prompt: {
          header: "Améliorer la génération de texte en utilisant EXO.",
          main: "système",
          footer: ["Génération de texte", "Compréhension contextuelle"],
          aside: "Un texte de haute qualité et cohérent."
      }
  },
  CSS: {
      description: "Amélioration des données par le biais de GANs",
      promptGemini: {
          context: "Utilisation de GANs pour le raffinement des données  CTF emoji /mode Campagne.",
          role: "assistant",
          taches: ["Génération de données", "Modélisation dynamique"],
          résultatAttendu: "Des ensembles de données améliorés et adaptables."
    }
  },
  JSON: {
      description: "Amélioration des données par le biais de GANs",
      promptGemini: {
          context: "Utilisation de GANs pour le raffinement des données  CTF emoji /mode Campagne.",
          role: "assistant",
          taches: ["Génération de données", "Modélisation dynamique"],
          résultatAttendu: "Des ensembles de données améliorés et adaptables."
  }},
  SCSS: {
       description: "Amélioration des données par le biais de GANs",
       promptGemini: {
           context: "Utilisation de GANs pour le raffinement des données  CTF emoji /mode Campagne.",
           role: "assistant",
           taches: ["Génération de données", "Modélisation dynamique"],
           résultatAttendu: "Des ensembles de données améliorés et adaptables."
  }},
  SVG: {
      description: "Amélioration des données par le biais de GANs",
      promptGemini: {
          context: "Utilisation de GANs pour le raffinement des données  CTF emoji /mode Campagne.",
          role: "assistant",
          taches: ["Génération de données", "Modélisation dynamique"],
          résultatAttendu: "Des ensembles de données améliorés et adaptables."
  }},
  JS: {
      description: "Amélioration des données par le biais de GANs",
      promptGemini: {
          context: "Utilisation de GANs pour le raffinement des données  CTF emoji /mode Campagne.",
          role: "assistant",
          taches: ["Génération de données", "Modélisation dynamique"],
          résultatAttendu: "Des ensembles de données améliorés et adaptables."
  }},
  MD: {
     description: "Amélioration des données par le biais de GANs",
     promptGemini: {
         context: "Utilisation de GANs pour le raffinement des données  CTF emoji /mode Campagne.",
         role: "assistant",
         taches: ["Génération de données", "Modélisation dynamique"],
         résultatAttendu: "Des ensembles de données améliorés et adaptables."
  }},
  SOL: {
    description: "Amélioration des données par le biais de GANs",
    promptGemini: {
        context: "Utilisation de GANs pour le raffinement des données  CTF emoji /mode Campagne.",
        role: "assistant",
        taches: ["Génération de données", "Modélisation dynamique"],
        résultatAttendu: "Des ensembles de données améliorés et adaptables."
  }}
};

// Function to execute and compare GROque and Gemini outputs
async function executeAndMatchAIModels() {

  const match = {README: null,HTML: null,JSX: null }; // Initialize match results

  try {

    // Execute prompt --readme content generation task
    console.log("Starting Groq-html content generation task...");
    const ReadmeCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: JSON.stringify(NetWork) },
        { role: "assistant", content: JSON.stringify(dev) },
        { role: "user", content: JSON.stringify(promptingReadme) },
        { role: "system", content: `const match = {README: null, GROQ: null, Gemini: null,HTML: null,CSS: null,CSS: null,JS: null,JSON: null,SVG: null,DRAWIO: null,SOL: null  }; // Initialize match results` },
        { role: "assistant", content: ` ta réponse Doit intégralement être rédigé au format [.md], respectant les normes du Web sémantique W3C` }
      ],
      model: "gemma2-9b-it",
      temperature: 0.7
    });

    const ReadmeContent = ReadmeCompletion.choices[0]?.message?.content;
    const ReadmeFilePath = `data/readme_${Date.now()}.md`;
    fs.writeFileSync(ReadmeFilePath, ReadmeContent || "No content generated.");
    console.log(`groq content saved to ${ReadmeFilePath}`);
    match.README = ReadmeContent ? "Success" : "Failure";

    // Execute promp --html content generation task
    console.log("Starting Groq-html content generation task...");
    const HTMLCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: JSON.stringify(NetWork) },
        { role: "assistant", content: JSON.stringify(dev) },
        { role: "system", content: `const match = {README: null, GROQ: null, Gemini: null,HTML: null,CSS: null,CSS: null,JS: null,JSON: null,SVG: null,DRAWIO: null,SOL: null  ; // Initialize match results` },
        { role: "assistant", content: ` ta réponse Doit intégralement être rédigé au format [.html], respectant les normes du Web sémantique W3C` },
        { role: "user", content: JSON.stringify(promptingHTML) }
      ],
      model: "gemma2-9b-it",
      temperature: 0.7
    });

    const HTMLContent = HTMLCompletion.choices[0]?.message?.content;
    const HTMLFilePath = `src/html/HTML_output_${Date.now()}.html`;
    fs.writeFileSync(HTMLFilePath, HTMLContent || "No content generated.");
    console.log(`groq content saved to ${HTMLFilePath}`);
    match.HTML = HTMLContent ? "Success" : "Failure";

    
    // Execute prompt --jsx content generation task
    console.log("Starting Groq-JS content generation task...");
    const JSXCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: JSON.stringify(NetWork) },
        { role: "assistant", content: JSON.stringify(dev) },
        { role: "system", content: `const match = {README: null, GROQ: null, Gemini: null,HTML: null,CSS: null,CSS: null,JS: null,JSON: null,SVG: null,DRAWIO: null,SOL: null  }; // Initialize match results` },
        { role: "assistant", content: ` ta réponse Doit intégralement être rédigé au format [.js], respectant les normes du Web sémantique W3C` },
        { role: "user", content: JSON.stringify(promptingJSX) }
      ],
      model: "gemma2-9b-it",
      temperature: 0.7
    });
    
    const JSXContent = JSXCompletion.choices[0]?.message?.content;
    const JSXFilePath = `src/js/JSX_output_${Date.now()}.jsx`;
    fs.writeFileSync(JSXFilePath, JSXContent || "No content generated.");
    console.log(`groq content saved to ${JSXFilePath}`);
    match.JSX = JSXContent ? "Success" : "Failure";


  } catch (error) {
    console.error("Error during AI model execution:", error);
  }

  // Log the match results
  console.log("Match Results:");
  console.log(`Documentation Generation: ${match.README}`);
  console.log(`HTML Generation: ${match.HTML}`);
  console.log(`JS Generation: ${match.JSX}`);

  return match;
}

// Main function to initiate the match and log results
async function main() {
  const matchResults = await executeAndMatchAIModels();
  console.log("Final Match Results:", matchResults);
}

main().catch(console.error);