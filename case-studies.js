export const caseStudies = {
  hamigenz: {
    title: 'hamiGenZ', category: 'Document AI',
    summary: 'A Nepal-focused document-understanding platform that turns complex public information into clearer explanations supported by source evidence.',
    problem: 'Public-service information appears in complex notices, forms, and scanned documents. The project explores how people can retrieve and understand that information with citations and clearer language.',
    approach: 'The published project describes a local-first document pipeline, bilingual OCR, a structured Open Knowledge Format knowledge base, query routing, and evidence-grounded responses. It separates source evidence from generated explanation.',
    architecture: 'The repository documents a Next.js interface, FastAPI service, OCR/document pipeline, OKF knowledge layer, embeddings and FAISS retrieval, and a local Ollama runtime with a verification layer.',
    outcome: 'A public code repository and live project link are available. The repository describes the system components; no independent accuracy or adoption benchmark is claimed here.',
    limitation: 'No independently measured OCR accuracy, answer-quality benchmark, or user study is reported in this portfolio. The project should be assessed against its linked source and its supported documents.',
    technologies: ['Next.js', 'FastAPI', 'OCR', 'OKF v0.2', 'FAISS', 'Ollama'],
    repo: 'https://github.com/omwe77/hamiGenz', demo: 'https://hami-genz.vercel.app'
  },
  arena: {
    title: 'Arena_Core', category: 'Web simulation',
    summary: 'A browser-based football tournament simulator and match centre with reproducible outcomes and competition flows.',
    problem: 'The project explores how tournament formats and match outcomes can be simulated and inspected in an interactive browser experience.',
    approach: 'The project README describes a Poisson goal model and seeded Mulberry32 random generator, with competition-stage progression and an interactive match centre.',
    architecture: 'Built with native HTML, CSS, and JavaScript. The documented interface includes tournament views, fixture details, a tactical pitch, simulation commentary, and historical archive data.',
    outcome: 'The public repository and Azure-hosted demo are available. Runs can be reproduced from a configured seed; no claim is made that simulated results predict real matches.',
    limitation: 'Results depend on the model ratings and assumptions. They are simulations, not forecasts or verified sports analytics. See the repository for the model description and tests.',
    technologies: ['JavaScript', 'Poisson model', 'Mulberry32', 'HTML', 'CSS', 'Playwright'],
    repo: 'https://github.com/omwe77/Arena_Core', demo: 'https://lemon-ocean-06aede400.5.azurestaticapps.net'
  },
  subscription: {
    title: 'AI Subscription Management', category: 'Desktop software',
    summary: 'A Java Swing coursework application modelling AI subscription tiers, token consumption, and team-seat allocation.',
    problem: 'The coursework project explores how subscription plans can represent token quotas for an individual tier and bounded seats for a team tier.',
    approach: 'The application lets users configure Personal and Pro plans, estimate prompt token consumption, top up and enforce quotas, and add, remove, or search team members.',
    architecture: 'An abstract AIModel base class is extended by PersonalPlan and ProPlan. A Java Swing and AWT event-driven GUI renders plan cards and a JTable. Plan configurations are saved and loaded with standard JDK file I/O; the README specifies JDK 17+ and no third-party dependencies.',
    outcome: 'The repository marks the academic coursework deliverable complete and documents the GUI, plan operations, input validation, and file persistence. It reports no user, performance, or production metrics.',
    limitation: 'Token counts use whitespace estimates rather than a BPE tokenizer. The application targets local desktop use and has no headless server API.',
    technologies: ['Java 17+', 'Swing', 'AWT', 'OOP', 'File I/O'],
    repo: 'https://github.com/omwe77/ai-subscription-management-system'
  },
  ecomart: {
    title: 'EcoMart', category: 'Web prototype',
    summary: 'A static academic e-commerce prototype with product browsing, category filtering, client-side cart behavior, and responsive pages.',
    problem: 'The coursework project explores a shopping journey for a fictional eco-friendly product catalogue and is explicitly not a live store.',
    approach: 'The site documents a multi-page storefront with product search and category filters, product details, cart quantity controls, simulated checkout, and validated inquiry forms.',
    architecture: 'A zero-dependency HTML5, CSS3, and vanilla JavaScript site. Separate scripts handle cart state, catalog data, product filtering, and the hero rotator. Browser localStorage persists the client-side cart; the project also includes planning wireframes.',
    outcome: 'The repository describes the academic prototype as complete and documents its pages and client-side interactions. It reports no sales or user research results.',
    limitation: 'There is no backend, database, authentication, payment gateway, or real transaction processing. Cart and form behavior runs in the browser.',
    technologies: ['HTML5', 'CSS3', 'Vanilla JavaScript', 'localStorage'],
    repo: 'https://github.com/omwe77/eco-friendly-awareness-mart-website'
  },
  medstore: {
    title: 'MedStore', category: 'Management system',
    summary: 'A modular Python console application for pharmacy inventory tracking, transactional sales billing, restocking, and formatted invoices.',
    problem: 'The coursework project explores how a small pharmacy can keep inventory and sales records in a simple console workflow.',
    approach: 'The public repository describes separate modules for inventory persistence, sales, restocking, search, display, and validated input handling.',
    architecture: 'Python standard library CLI with comma-delimited local file persistence. Sales update stock and generate invoices; restocking updates inventory and produces notes.',
    outcome: 'The repository documents completed coursework functionality and a Python syntax-check command. No commercial or production deployment is claimed.',
    limitation: 'The README identifies local file storage and single-terminal operation; it has no multi-process locking or database-backed persistence.',
    technologies: ['Python', 'CLI', 'File I/O', 'Validation'],
    repo: 'https://github.com/omwe77/pharmacy-inventory-management-system'
  },
  spam: {
    title: 'Spam Email Classifier', category: 'Machine learning',
    summary: 'An introductory Python and scikit-learn text classification exercise using bag-of-words features and Multinomial Naive Bayes.',
    problem: 'The project explores classifying a message as spam or ham as a foundational supervised-learning exercise.',
    approach: 'CountVectorizer converts message text to token counts, which are passed to a MultinomialNB model for classification and console inference.',
    architecture: 'The repository documents a small Python script, requirements file, and scikit-learn pipeline using inline sample messages and labels. The README describes the vectorizer-to-model flow.',
    outcome: 'The repository marks this as a completed proof of concept and includes an example console prediction. It reports no measured accuracy or real-world filtering results.',
    limitation: 'Training uses synthetic inline samples and has no train/test split, cross-validation, or benchmark evaluation. Generalization to real email is therefore unestablished.',
    technologies: ['Python 3.10+', 'scikit-learn', 'CountVectorizer', 'MultinomialNB'],
    repo: 'https://github.com/omwe77/spam-email-classifier'
  }
};

export function renderCaseStudy(template, slug, origin) {
  const project = caseStudies[slug];
  if (!project) return null;
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const replacements = {
    title: project.title,
    category: project.category,
    summary: project.summary,
    problem: project.problem,
    approach: project.approach,
    architecture: project.architecture,
    outcome: project.outcome,
    limitation: project.limitation,
    technologies: project.technologies.map((technology) => `<span>${escapeHtml(technology)}</span>`).join(''),
    repo: project.repo,
    canonical: `${origin}/projects/${slug}/`,
    ogImage: `${origin}/og-image.svg`,
    demoLink: project.demo ? ` <a href="${escapeHtml(project.demo)}" target="_blank" rel="noopener">Open live demo ↗</a>` : ''
  };
  let html = template;
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(`{{${key}}}`, key === 'technologies' || key === 'demoLink' ? value : escapeHtml(value));
  }
  return html;
}
