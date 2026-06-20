# OpenToli — Product Specification

## 1. Project Overview

**Project name:** OpenToli  
**Product type:** Web application, terminology dictionary, and community review platform  
**Primary direction:** English-to-Mongolian terminology for modern professional, technical, academic, legal, financial, medical, scientific, and everyday usage

OpenToli is a structured terminology platform where English headwords are translated, explained, discussed, reviewed, and approved in Mongolian.

It is not intended to begin as a complete general-purpose dictionary containing every ordinary English word. Its initial value will come from modern, professional, technical, academic, and context-sensitive terms whose Mongolian translations may be missing, inconsistent, overly literal, or disputed.

OpenToli combines:

- A searchable terminology dictionary
- A bilingual explanatory reference
- A structured editorial system
- Community translation suggestions
- Human review and approval
- An AI-first, source-grounded term preparation pipeline
- Context-specific translation guidance

AI-first means that AI prepares candidate terms, research packets, translation options,
examples, and review questions at scale. It does not mean AI-first publishing. Every
published recommendation must remain attributable to a human review decision.

## 2. Product Vision

OpenToli should become a trusted modern English-to-Mongolian terminology platform covering major knowledge domains.

The platform should help users answer:

- What is the best Mongolian translation of this English term?
- Does the translation change by industry or context?
- Which translation is preferred?
- Which alternatives are also used?
- Why was one translation recommended over another?
- How is the term used in a real sentence?
- Has the translation been reviewed by a human?
- What sources support the usage?

> OpenToli is a modern English-to-Mongolian terminology platform for technology, artificial intelligence, finance, law, medicine, science, business, education, media, and everyday professional language.

## 3. Initial Scope

OpenToli should begin as a terminology dictionary rather than a full English dictionary.

The first release should focus on terms that are:

- Modern
- Professional
- Technical
- Academic
- Context-sensitive
- Difficult to translate naturally
- Commonly used but inconsistently translated
- Important in public information and services
- Frequently encountered in software, finance, law, medicine, education, science, and media

Basic everyday words such as `dog`, `tree`, `eat`, or `sleep` are not a priority for the first release.

## 4. Primary Categories

1. Technology & Software
2. Artificial Intelligence & Data Science
3. Finance & Economics
4. Law & Government
5. Medicine & Health
6. Business & Management
7. Education & Research
8. Science & Engineering
9. Media, Marketing & Communication
10. Modern Everyday Terms

### 4.1 Technology & Software

Topics:

- Software development
- Web development
- Cloud computing
- Databases
- Cybersecurity
- DevOps
- Networking
- Mobile applications
- Operating systems
- Open-source software

Example headwords:

- API
- authentication
- authorization
- cache
- cloud computing
- database
- deployment
- encryption
- endpoint
- framework
- middleware
- migration
- repository
- runtime
- schema
- serverless
- session
- version control
- webhook

### 4.2 Artificial Intelligence & Data Science

Topics:

- Machine learning
- Generative AI
- Large language models
- Statistics
- Model evaluation
- Data engineering
- AI safety
- AI agents
- Natural language processing

Example headwords:

- artificial intelligence
- agent
- classification
- clustering
- deep learning
- embedding
- fine-tuning
- hallucination
- inference
- large language model
- machine learning
- model evaluation
- neural network
- overfitting
- prompt
- regression
- retrieval-augmented generation
- token
- training data

### 4.3 Finance & Economics

Topics:

- Banking
- Investing
- Personal finance
- Taxes
- Accounting
- Macroeconomics
- Insurance
- Credit
- Cryptocurrency

Example headwords:

- asset
- capital gain
- cash flow
- compound interest
- credit score
- dividend
- equity
- expense
- gross income
- inflation
- interest
- liability
- mortgage
- net income
- portfolio
- recession
- revenue
- tax deduction
- withholding

### 4.4 Law & Government

Topics:

- Immigration
- Contracts
- Regulation
- Courts
- Public administration
- Civic services
- Policy
- Privacy
- Compliance

Example headwords:

- adjudication
- agreement
- appeal
- applicant
- beneficiary
- compliance
- consent
- contract
- evidence
- hearing
- jurisdiction
- liability
- ordinance
- petition
- policy
- regulation
- statute
- waiver

### 4.5 Medicine & Health

Topics:

- Symptoms
- Diagnosis
- Treatment
- Medication
- Public health
- Mental health
- Preventive care
- Health insurance
- Medical procedures

Example headwords:

- acute
- chronic
- condition
- diagnosis
- dosage
- immune system
- infection
- inflammation
- prescription
- prevention
- risk factor
- screening
- side effect
- symptom
- treatment
- vaccine

### 4.6 Business & Management

Topics:

- Strategy
- Operations
- Project management
- Leadership
- Human resources
- Organizational behavior
- Startups
- Customer service
- Sales

Example headwords:

- accountability
- deliverable
- governance
- initiative
- key performance indicator
- leadership
- milestone
- operations
- organizational culture
- performance review
- resource allocation
- risk management
- roadmap
- stakeholder
- strategy
- workflow

### 4.7 Education & Research

Topics:

- Schools
- Universities
- Academic writing
- Research methods
- Assessment
- Credentials
- Publishing

Example headwords:

- abstract
- citation
- credit hour
- curriculum
- data collection
- degree
- dissertation
- GPA
- hypothesis
- literature review
- methodology
- peer review
- research question
- syllabus
- thesis
- transcript

### 4.8 Science & Engineering

Topics:

- Physics
- Chemistry
- Biology
- Environmental science
- Mechanical engineering
- Electrical engineering
- Civil engineering
- Systems engineering

Example headwords:

- acceleration
- circuit
- current
- density
- efficiency
- energy
- force
- mass
- measurement
- momentum
- prototype
- resistance
- simulation
- system
- velocity
- voltage

### 4.9 Media, Marketing & Communication

Topics:

- Journalism
- Advertising
- Social media
- Content creation
- Public relations
- Digital marketing
- News literacy

Example headwords:

- audience
- brand awareness
- campaign
- click-through rate
- content strategy
- conversion
- editorial
- engagement
- fact-checking
- headline
- impression
- misinformation
- newsletter
- reach
- search engine optimization
- source
- subscriber

### 4.10 Modern Everyday Terms

Topics:

- Online accounts
- Banking portals
- Applications and forms
- Insurance
- Subscriptions
- Consumer services
- Privacy and security
- Employment
- Rentals
- Healthcare portals

Example headwords:

- application
- appointment
- authorization
- cancellation
- confirmation
- consent
- deadline
- deposit
- identity
- membership
- notification
- preference
- profile
- refund
- requirement
- security
- settings
- subscription
- verification

## 5. Main Goal

The main goal is to create a reliable, searchable, and human-reviewed English-to-Mongolian terminology database.

Each term may include:

- English headword
- Part of speech
- Pronunciation, optional
- Recommended Mongolian translation
- Alternative Mongolian translations
- Context-specific translations
- English explanation
- Mongolian explanation
- Categories and subcategories
- Usage notes
- Example sentences
- Sources and references
- Discussion
- Review status
- Contributor history
- Revision history
- AI draft metadata

Example:

```text
Headword: stakeholder

Recommended Mongolian:
Оролцогч тал

Alternative translations:
Сонирхогч тал
Хамаарал бүхий тал

Categories:
Business & Management
Project Management

Context:
General organizational usage

Status:
Human Reviewed
```

## 6. Target Users

### 6.1 Public Users

- Search English headwords
- Search Mongolian translations
- Read explanations
- Browse categories
- View examples
- View sources
- View discussions
- View review status

### 6.2 Registered Contributors

- Submit new headwords
- Suggest Mongolian translations
- Suggest alternative translations
- Add examples
- Add sources
- Propose explanation changes
- Comment in discussions
- Vote on translation suggestions
- Edit their own draft submissions

### 6.3 Reviewers

- Review AI drafts
- Review contributor submissions
- Edit English and Mongolian explanations
- Approve examples
- Validate sources
- Recommend a preferred translation
- Mark content as reviewed
- Add reviewer notes

### 6.4 Moderators

- Approve or reject submissions
- Select the recommended translation
- Resolve disputes
- Manage discussions
- Hide inappropriate content
- Change term status
- Merge duplicate terms
- Archive obsolete terms

### 6.5 Language Experts

- Provide linguistic notes
- Approve terminology in specialized fields
- Mark preferred or formal usage
- Identify unnatural or overly literal translations
- Review spelling and grammar
- Add domain-specific guidance

### 6.6 Administrators

- Manage all content
- Manage users and roles
- Manage categories
- Configure AI features
- Configure system settings
- Manage imports and exports
- Delete or restore content
- Manage backups and integrations

## 7. Recommended Technology Stack

Preferred stack:

- Next.js App Router
- TypeScript
- Payload CMS
- PostgreSQL
- Tailwind CSS
- shadcn/ui
- Vercel or another Node.js-compatible host

Optional additions:

- OpenAI API for structured AI term drafts
- Meilisearch or Typesense for advanced search
- PostgreSQL full-text search for the MVP
- S3-compatible storage for media and audio
- Resend for email
- Redis-compatible service for rate limiting and caching
- Background jobs for batch term generation

## 8. System Architecture

### 8.1 Payload CMS

Payload should provide:

- Admin dashboard
- Authentication
- User management
- Role-based access control
- Structured collections
- Drafts
- Versions
- Revision history
- Field validation
- Media management
- REST or GraphQL APIs
- Editorial workflows
- Hooks for AI generation and review

### 8.2 Next.js Public Application

Next.js should provide:

- Homepage
- Search
- Term pages
- Category pages
- Discussion interface
- Contributor dashboard
- Submission forms
- Review queue
- Public user profiles, optional
- SEO pages
- API integrations

### 8.3 PostgreSQL

PostgreSQL should store:

- Terms
- Translations
- Categories
- Contexts
- Examples
- Sources
- Comments
- Votes
- Users
- Reviews
- AI drafts
- Audit history

### 8.4 Search

MVP:

- PostgreSQL full-text search
- Prefix matching
- Exact headword matching
- Mongolian translation matching
- Category filters

Later:

- Meilisearch or Typesense
- Typo tolerance
- Autocomplete
- Search ranking
- Synonyms
- Related terms
- Mongolian Cyrillic normalization

## 9. Core Public Pages

### 9.1 Homepage

Include:

- Logo and product name
- Primary search bar
- Short product explanation
- Main categories
- Recently reviewed terms
- Recently added terms
- Frequently searched terms
- Terms needing discussion
- Contribution call-to-action

Hero text:

> Find clear Mongolian translations for modern English terminology.

Supporting text:

> Explore human-reviewed terminology across technology, AI, finance, law, medicine, science, business, education, media, and modern everyday life.

Search placeholder:

```text
Search an English term or Mongolian translation...
```

### 9.2 Search Results Page

URL:

```text
/search?q=authentication
```

Each result should display:

- English headword
- Recommended Mongolian translation
- Short explanation
- Category
- Context
- Review badge
- Number of alternatives
- Number of discussions

Search filters:

- Category
- Subcategory
- Context
- Review status
- Translation type
- Part of speech
- Recently updated
- Most discussed

### 9.3 Term Detail Page

URL:

```text
/terms/authentication
```

Required sections:

- English headword
- Pronunciation, optional
- Part of speech
- Review badge
- Categories
- Recommended Mongolian translation
- Alternative translations
- Context-specific translations
- English explanation
- Mongolian explanation
- Usage notes
- Examples
- Related terms
- Sources
- Contributor and reviewer notes
- Discussion
- Revision history
- Suggest improvement action

### 9.4 Category Page

Example URLs:

```text
/categories/technology-software
/categories/ai-data-science
/categories/finance-economics
```

Include:

- Category name
- Bilingual category description
- Subcategories
- Term list
- Search within category
- Filters
- Newly added terms
- Most discussed terms
- Terms needing review

### 9.5 Submit Term Page

URL:

```text
/submit
```

Fields:

- English headword
- Category
- Subcategory
- Context
- Suggested Mongolian translation
- Alternative translations
- English explanation
- Mongolian explanation
- English example
- Mongolian example
- Reason for suggestion
- Source links
- Notes

New submissions begin with:

```text
Status: Draft
Review status: Needs Review
```

### 9.6 Contributor Dashboard

Show:

- My submitted terms
- My translation suggestions
- My comments
- My votes
- Draft submissions
- Review outcomes
- Requested changes
- Saved terms

### 9.7 Review Queue

Show:

- AI-generated drafts
- Contributor submissions
- Translation suggestions
- Explanation changes
- New examples
- New sources
- Duplicate warnings
- Flagged discussions

## 10. Main Data Model

### 10.1 Terms Collection

Fields:

- `id`
- `headword_en`
- `slug`
- `part_of_speech`
- `pronunciation`
- `short_definition_en`
- `explanation_en`
- `explanation_mn`
- `usage_note_en`
- `usage_note_mn`
- `status`
- `review_status`
- `categories`
- `contexts`
- `recommended_translation`
- `related_terms`
- `created_by`
- `reviewed_by`
- `approved_by`
- `created_at`
- `updated_at`
- `published_at`

Term status options:

- `draft`
- `needs_discussion`
- `needs_review`
- `reviewed`
- `approved`
- `published`
- `archived`

Review status options:

- `not_reviewed`
- `ai_draft`
- `community_reviewed`
- `human_reviewed`
- `expert_reviewed`

### 10.2 Translations Collection

Fields:

- `id`
- `term_id`
- `translation_mn`
- `translation_type`
- `context`
- `register`
- `explanation_en`
- `explanation_mn`
- `usage_note`
- `status`
- `review_status`
- `vote_score`
- `created_by`
- `reviewed_by`
- `created_at`
- `updated_at`

Translation type options:

- `recommended`
- `alternative`
- `context_specific`
- `formal`
- `informal`
- `literal`
- `rejected`
- `deprecated`

Register options:

- `general`
- `formal`
- `informal`
- `technical`
- `academic`
- `legal`
- `medical`
- `business`

### 10.3 Categories Collection

Fields:

- `id`
- `name_en`
- `name_mn`
- `slug`
- `description_en`
- `description_mn`
- `parent_category`
- `display_order`
- `is_active`
- `created_at`
- `updated_at`

### 10.4 Contexts Collection

Fields:

- `id`
- `name_en`
- `name_mn`
- `slug`
- `description_en`
- `description_mn`
- `category`
- `created_at`
- `updated_at`

### 10.5 Examples Collection

Fields:

- `id`
- `term_id`
- `translation_id`
- `example_en`
- `example_mn`
- `context`
- `source`
- `created_by`
- `status`
- `review_status`
- `created_at`
- `updated_at`

### 10.6 Sources Collection

Fields:

- `id`
- `term_id`
- `translation_id`
- `title`
- `publisher`
- `author`
- `url`
- `publication_date`
- `accessed_date`
- `source_type`
- `license_note`
- `excerpt_note`
- `created_by`
- `created_at`

Source types:

- `government`
- `standards_body`
- `official_documentation`
- `academic`
- `dictionary`
- `textbook`
- `professional_usage`
- `news`
- `community_discussion`
- `other`

### 10.7 Comments Collection

Fields:

- `id`
- `term_id`
- `translation_id`
- `parent_comment_id`
- `user_id`
- `body`
- `comment_type`
- `status`
- `created_at`
- `updated_at`
- `deleted_at`

Comment types:

- `general`
- `translation_suggestion`
- `usage_question`
- `source_note`
- `review_note`
- `moderator_note`

### 10.8 Votes Collection

Fields:

- `id`
- `translation_id`
- `user_id`
- `vote_type`
- `created_at`

Vote options:

- `upvote`
- `downvote`

Constraints:

- One active vote per user per translation
- Vote counts do not automatically determine the recommended translation

### 10.9 Reviews Collection

Fields:

- `id`
- `term_id`
- `translation_id`
- `reviewer_id`
- `review_type`
- `decision`
- `notes`
- `created_at`

Review types:

- `linguistic`
- `technical`
- `editorial`
- `source_validation`
- `final_approval`

Decision options:

- `approved`
- `changes_requested`
- `rejected`

### 10.10 AI Drafts Collection

Fields:

- `id`
- `term_id`
- `input_headword`
- `input_category`
- `input_context`
- `source_ids`
- `research_payload`
- `generated_payload`
- `critique_payload`
- `schema_version`
- `model_provider`
- `model_name`
- `prompt_version`
- `confidence_dimensions`
- `risk_level`
- `review_route`
- `status`
- `generated_by`
- `reviewed_by`
- `review_outcome`
- `accepted_fields`
- `modified_fields`
- `rejection_reasons`
- `created_at`
- `updated_at`

Confidence dimensions should be stored separately for concept understanding,
translation naturalness, domain accuracy, source support, and ambiguity.

Risk levels:

- `low`
- `medium`
- `high`

Review routes:

- `fast_review`
- `language_review`
- `domain_review`
- `community_discussion`
- `duplicate_review`
- `blocked`

AI draft status options:

- `generated`
- `editing`
- `needs_review`
- `accepted`
- `partially_accepted`
- `rejected`

### 10.11 Users Collection

Fields:

- `id`
- `name`
- `email`
- `role`
- `bio`
- `areas_of_expertise`
- `avatar`
- `is_active`
- `created_at`
- `updated_at`

Role options:

- `reader`
- `contributor`
- `reviewer`
- `language_expert`
- `moderator`
- `admin`

## 11. Permissions

### Public Users

Can read, search, browse categories, view discussions, sources, and revision summaries.

### Contributors

Can submit terms, suggest translations, add examples and sources, comment, vote, and edit their own drafts.

### Reviewers

Can review submissions, edit explanations, approve examples, validate sources, request changes, and mark content as human reviewed.

### Language Experts

Can perform linguistic review, mark preferred terminology, add language notes, and mark content as expert reviewed.

### Moderators

Can approve or reject submissions, choose recommended translations, merge duplicates, manage comments, archive terms, and change workflow status.

### Administrators

Can manage all content, users, roles, categories, contexts, AI tools, imports, exports, and system settings.

## 12. Editorial Workflow

```text
Candidate Headword
↓
AI Draft or Contributor Draft
↓
Needs Review
↓
Needs Discussion, when uncertain
↓
Human Reviewed
↓
Expert Reviewed, when applicable
↓
Approved
↓
Published
```

Possible outcomes:

- Approved without changes
- Approved with edits
- Needs additional sources
- Needs domain expert
- Needs community discussion
- Rejected
- Merged with duplicate
- Archived

## 13. AI-Assisted Term Building

AI should be used as a drafting and research assistant, not as the final authority.

The initial corpus should use an AI-first preparation workflow. AI should do the
high-volume work of extracting, researching, drafting, comparing, and organizing
terms so that humans can spend their time making focused editorial decisions.

AI generation should be source-first. Candidate terms should normally originate
from an identified glossary, standard, official document, or other trusted source.
Open-ended term generation may be used for discovery, but those candidates must be
linked to supporting sources before they can advance to publication review.

### 13.1 AI Can Generate

- Candidate Mongolian translations
- Alternative translations
- Context-specific translations
- English explanation
- Mongolian explanation
- Category suggestions
- Context suggestions
- Example sentences
- Related terms
- Search keywords
- Initial confidence estimate
- Questions for reviewers
- Discussion summaries
- Duplicate-term suggestions

### 13.2 AI Must Not

- Automatically publish terms
- Mark its own output as expert reviewed
- Invent official terminology without warning
- Copy copyrighted definitions in full
- Treat confidence scores as proof of correctness
- Replace human linguistic or technical review

### 13.3 AI Draft Workflow

```text
Trusted source or manually entered headword
↓
Candidate extraction and source capture
↓
Normalization and duplicate detection
↓
AI research packet
↓
AI generates multiple translation candidates and explanations
↓
Independent AI critique pass
↓
System validates structured output and assigns risk-based review route
↓
Draft and full provenance are saved to AI Drafts
↓
Human language or domain review
↓
Moderator or expert approval, when required
↓
Term is published
```

The research packet should include:

- Canonical English meaning
- Part of speech and acronym expansion, when applicable
- Domain-specific meanings
- Commonly confused or related terms
- Existing Mongolian usage found in supplied sources
- Ambiguities and questions for reviewers

The generation pass should produce:

- A recommended natural Mongolian candidate
- Established professional or official forms, when found
- Context-specific alternatives
- Borrowed or transliterated forms in actual use
- Literal forms when useful for comparison
- Misleading or rejected candidates with reasons

The independent critique pass should check semantic accuracy, natural Mongolian,
literal-translation artifacts, terminology conflicts, unsupported claims, source
quality, and the type of human expertise required. Critique output must be retained
separately from the generated draft.

### 13.4 Structured AI Output

```json
{
  "headword_en": "authentication",
  "part_of_speech": "noun",
  "recommended_translation_mn": "нэвтрэлтийг баталгаажуулах",
  "alternative_translations": [
    {
      "translation_mn": "танин баталгаажуулалт",
      "context": "technical",
      "usage_note": "Used in some formal technical writing."
    }
  ],
  "explanation_en": "The process of verifying the identity of a user, system, or device.",
  "explanation_mn": "Хэрэглэгч, систем эсвэл төхөөрөмжийн хэн болохыг шалгаж баталгаажуулах үйл явц.",
  "categories": [
    "Technology & Software",
    "Cybersecurity"
  ],
  "contexts": [
    "software",
    "security"
  ],
  "examples": [
    {
      "example_en": "The application requires two-factor authentication.",
      "example_mn": "Уг аппликейшн хоёр шатлалт танин баталгаажуулалт шаарддаг."
    }
  ],
  "confidence_dimensions": {
    "concept_understanding": "high",
    "translation_naturalness": "medium",
    "domain_accuracy": "medium",
    "source_support": "medium",
    "ambiguity": "low"
  },
  "risk_level": "medium",
  "review_route": "language_review",
  "human_review_required": true
}
```

### 13.5 AI Review Routing

AI drafts should be routed according to evidence, ambiguity, and domain risk:

- Fast review for clear, established, well-sourced terminology
- Language review when the concept is clear but Mongolian wording is uncertain
- Domain review for medical, legal, financial, scientific, or specialized terms
- Community discussion when multiple translations are defensible
- Duplicate review when an existing term may cover the same concept
- Blocked when evidence is insufficient or the source meaning is unclear

Medical, legal, financial, and other high-risk terms must not use a reduced review
path. AI confidence must never bypass a required human or expert review.

### 13.6 Publication Requirements for AI Drafts

An AI-prepared term may be published only when:

- A human has selected or edited the recommended translation
- Required English and Mongolian explanations have been reviewed
- Important or disputed claims have supporting sources
- No unresolved duplicate warning remains
- Required domain or language-expert review is complete
- AI provider, model, prompt version, schema version, and source inputs are retained

The system should record which generated fields were accepted, modified, or rejected
and the reasons for rejection. This data should improve prompts and review routing,
not automate approval.

### 13.7 AI Quality Evaluation

Maintain a fixed evaluation set of 50 to 100 expert-reviewed terms spanning clear,
ambiguous, and domain-sensitive terminology. Prompt, model, and schema changes should
be evaluated against this set before being used for new production batches.

Track:

- Draft acceptance rate by model and prompt version
- Human edit rate by field
- Common rejection reasons
- Reviewer disagreement
- Quality by category and risk level
- Duplicate-detection accuracy
- Cost and processing time per review-ready and published term

## 14. Headword Collection Strategy

Headwords should come from real, high-value sources such as:

- Government glossaries
- Standards organizations
- Official software documentation
- Financial regulators
- Medical and public-health references
- University resources
- Scientific institutions
- Public forms
- Product documentation
- Industry glossaries
- Professional guides

Recommended source groups:

### Technology & Software

- MDN Web Docs Glossary
- GitHub Glossary
- Microsoft Learn
- AWS documentation and glossaries
- Google Cloud glossary
- Kubernetes glossary
- PostgreSQL documentation
- NIST cybersecurity glossary
- CISA cybersecurity glossary

### Artificial Intelligence & Data Science

- NIST AI publications
- Google machine learning glossary
- Microsoft AI documentation
- OpenAI documentation
- TensorFlow documentation
- scikit-learn documentation
- Research-paper keywords and glossaries

### Finance & Economics

- CFPB glossary
- Investor.gov glossary
- SEC glossary
- FINRA terminology
- Federal Reserve educational resources
- IRS forms and publications
- World Bank glossary
- IMF terminology

### Law & Government

- USCIS materials
- Cornell Legal Information Institute
- Federal Register materials
- USA.gov
- Digital.gov
- State and city government forms
- Court and administrative resources

### Medicine & Health

- MedlinePlus
- CDC glossaries
- NIH resources
- FDA consumer information
- WHO terminology
- Public-health materials

### Education & Research

- Department of Education resources
- University catalogs
- Academic writing guides
- Research-method glossaries
- Library and citation resources

### Science & Engineering

- NASA glossaries
- NOAA glossaries
- NSF materials
- National laboratory resources
- Engineering standards and open educational materials

### Media & Communication

- Journalism glossaries
- Public media resources
- Advertising platform glossaries
- Marketing documentation
- News-literacy resources

## 15. Term Ingestion Workflow

```text
Select source and category
↓
Extract candidate headwords
↓
Remove duplicates and irrelevant terms
↓
Store source metadata
↓
Generate AI research packet
↓
Generate multiple translation candidates
↓
Run independent AI critique
↓
Validate output and assign review route
↓
Human review
↓
Add examples and context
↓
Approve and publish
```

Imports should be processed as traceable batches. A batch should retain its source,
extraction settings, prompt and model versions, validation failures, duplicate results,
and review outcomes. Importing a batch must never publish its terms automatically.

Initial import format:

```csv
headword_en,category,subcategory,context,source_title,source_url,status
authentication,Technology & Software,Cybersecurity,security,NIST Glossary,https://example.org,needs_ai_draft
equity,Finance & Economics,Investing,finance,Investor Glossary,https://example.org,needs_ai_draft
diagnosis,Medicine & Health,Clinical Care,medical,MedlinePlus,https://example.org,needs_ai_draft
```

## 16. Initial Content Target

Before producing the full candidate database, run a calibration batch of approximately
50 Technology & Software terms. Include both straightforward and ambiguous terms such
as `agent`, `token`, `session`, and `repository`. Review all calibration terms, analyze
human corrections, and revise prompts, schemas, and routing rules before larger runs.

After calibration, generate candidates in batches of 100 to 200 so quality and cost can
be measured between batches.

Recommended first milestone:

- 200 Technology & Software terms
- 200 AI & Data Science terms
- 150 Finance & Economics terms
- 150 Law & Government terms
- 150 Medicine & Health terms
- 100 Business & Management terms
- 100 Education & Research terms
- 100 Science & Engineering terms
- 75 Media & Communication terms
- 75 Modern Everyday terms

Total initial candidate database:

```text
1,300 terms
```

Suggested launch requirement:

- At least 300 human-reviewed terms
- At least 100 additional terms marked as AI Draft or Needs Review
- At least 5 active primary categories
- Sources attached to important or disputed terms

## 17. Search Requirements

MVP search:

- Exact English headword search
- Prefix search
- Mongolian translation search
- Explanation-text search
- Category filter
- Context filter
- Review-status filter

Search ranking priority:

1. Exact English headword
2. Exact Mongolian translation
3. English prefix
4. Mongolian prefix
5. Alternative translation
6. Related term
7. Explanation text

Later features:

- Typo tolerance
- Autocomplete
- Synonyms
- Related-term suggestions
- Acronym expansion
- Mongolian Cyrillic normalization
- Search analytics
- Query suggestions
- Domain-aware ranking

## 18. MVP Feature List

### Public Features

- Homepage
- Search
- Search results
- Term detail page
- Category pages
- Related terms
- Review badges
- Responsive layout
- SEO metadata

### Admin and Editorial Features

- Payload admin
- Create and edit terms
- Create and edit translations
- Create and edit categories
- Create and edit contexts
- Add examples
- Add sources
- Draft and publish workflow
- Version history
- Review queue

### Contributor Features

- Registration and login
- Submit a headword
- Suggest a translation
- Suggest an explanation
- Add examples
- Add sources
- Comment
- Vote

### AI Features

- Generate source-grounded research packets
- Generate multiple translation candidates
- Run an independent AI critique
- Assign risk-based review routes
- Regenerate individual fields
- Suggest categories
- Suggest context-specific meanings
- Suggest examples
- Detect likely duplicates
- Save source, prompt, model, and schema metadata
- Measure acceptance, edits, and rejection reasons
- Require human review

## 19. Features Deferred Until Later

- Native mobile application
- Browser extension
- Gamification
- Complex reputation system
- Public write API
- Automated bulk publishing
- Fully automatic translation approval
- Traditional Mongolian script
- Pronunciation audio
- Advanced notification workflows
- Complex social features
- Paid memberships
- Marketplace features

## 20. Project Phases

### Phase 1 — Foundation

- Next.js application
- Payload CMS
- PostgreSQL
- User roles
- Categories
- Contexts
- Terms
- Translations
- Examples
- Sources
- Public search
- Term pages
- Admin CRUD

### Phase 2 — Initial Content

- Source registry
- CSV headword import
- AI research-packet generation
- Multiple-candidate translation generation
- Independent AI critique
- Risk-based review routing
- Prompt, model, schema, and source provenance
- AI quality evaluation set
- Duplicate detection
- 50-term calibration batch
- Initial 1,300 candidates
- First 300 reviewed entries

### Phase 3 — Community

- Public registration
- Term submissions
- Translation suggestions
- Comments
- Votes
- Contributor dashboard
- Moderation queue

### Phase 4 — Quality and Review

- Reviewer workflow
- Language expert workflow
- Source validation
- Review records
- Revision summaries
- Merge and archive tools
- Expert-reviewed badge

### Phase 5 — Advanced AI

- Discussion summaries
- Translation comparison
- Batch draft generation
- Category classification
- Cross-source evidence comparison
- Advanced conflict detection
- Automated evaluation reporting

### Phase 6 — Search and Scale

- Meilisearch or Typesense
- Autocomplete
- Synonyms
- Search analytics
- Related terms
- Import and export
- Public read API
- Performance improvements

## 21. UI and Brand Direction

The design should feel:

- Modern
- Clean
- Trustworthy
- Academic but approachable
- Community-driven
- Search-focused
- Bilingual
- Highly readable

Recommended visual style:

- White or light neutral background
- Navy or deep blue primary accent
- Sky-blue secondary accent
- Soft gray borders
- Large central search bar
- Clear status badges
- Generous spacing
- Readable Mongolian Cyrillic typography
- Minimal decorative elements

## 22. Navigation

Primary navigation:

- Logo
- Search
- Categories
- New Terms
- Discussions
- Contribute
- About
- Login/Profile

Contributor navigation:

- My Submissions
- My Suggestions
- Saved Terms
- My Comments
- Review Results
- Profile

Admin navigation:

- Terms
- Translations
- Categories
- Contexts
- Examples
- Sources
- AI Drafts
- Reviews
- Comments
- Users
- Import
- Settings

## 23. Status and Trust Badges

- AI Draft
- Needs Review
- Needs Discussion
- Community Reviewed
- Human Reviewed
- Expert Reviewed
- Approved
- Published
- Archived
- Disputed

The UI must clearly distinguish AI-generated content from human-reviewed content.

## 24. Non-Functional Requirements

### 24.1 Performance

- Cache public term pages
- Optimize category queries
- Paginate large result sets
- Use database indexes for headwords and translations
- Avoid loading full discussion threads by default
- Maintain fast search response times

### 24.2 SEO

Each public term page should include:

- Unique title
- Meta description
- Canonical URL
- Open Graph metadata
- Structured data where appropriate
- Search-engine-friendly slug
- Internal links to related terms

Example title:

```text
Authentication in Mongolian | OpenToli
```

### 24.3 Accessibility

- Keyboard navigation
- Semantic HTML
- Visible focus states
- Good color contrast
- Screen-reader labels
- Responsive text
- Accessible forms and validation
- Language attributes for English and Mongolian content

### 24.4 Security

- Role-based access control
- Server-side validation
- Rate limiting
- Spam protection
- Safe rendering of user content
- Secure AI API keys
- Audit logs
- Restricted destructive actions
- File-upload validation
- Session and CSRF protections supported by the stack

### 24.5 Data Quality

- Unique normalized headword rules
- Duplicate detection
- Required sources for disputed terms
- Human review requirement for publication
- Version history
- Reviewer attribution
- Clear AI provenance

### 24.6 Backup and Portability

- Automated database backups
- CSV and JSON exports
- Source metadata export
- Version history retention
- Media backup
- Restore procedure documentation

## 25. Example Codex / Claude Code Prompt

```text
Build the MVP of a project called OpenToli.

OpenToli is a modern English-to-Mongolian terminology dictionary and community review platform.

Primary categories:
- Technology & Software
- Artificial Intelligence & Data Science
- Finance & Economics
- Law & Government
- Medicine & Health
- Business & Management
- Education & Research
- Science & Engineering
- Media, Marketing & Communication
- Modern Everyday Terms

Tech stack:
- Next.js App Router
- TypeScript
- Payload CMS
- PostgreSQL
- Tailwind CSS
- shadcn/ui

Core collections:
- Terms
- Translations
- Categories
- Contexts
- Examples
- Sources
- Comments
- Votes
- Reviews
- AI Drafts
- Users

Requirements:
- English headwords
- Recommended and alternative Mongolian translations
- Context-specific translations
- English and Mongolian explanations
- Categories and contexts
- Examples
- Sources
- Review statuses
- Draft and publishing workflow
- Version history
- Role-based access control
- AI-generated content must be labeled and require human review

Build public pages:
- homepage with central search
- search results
- term detail
- category page
- contribution form

Use Payload for:
- admin dashboard
- auth
- roles
- collections
- drafts
- versions
- access control
- review workflow

Use a clean, modern, bilingual UI.

Do not build:
- mobile app
- gamification
- complex reputation
- traditional Mongolian script
- automated publishing

Focus on a stable and well-structured MVP.
```

## 26. Final Direction

```text
OpenToli
=
Custom Next.js public application
+
Payload CMS editorial foundation
+
PostgreSQL terminology database
+
AI-assisted drafting
+
Human and expert review
```

Payload provides:

- Admin panel
- Authentication
- Roles
- Drafts
- Versions
- Structured collections
- APIs
- Media support
- Editorial workflow

The custom Next.js application provides:

- Public dictionary experience
- Search
- Category browsing
- Context-specific terminology
- Community discussion
- Voting
- Contribution workflow
- Mongolian-specific user experience

AI provides:

- Candidate headwords
- Draft translations
- Draft explanations
- Context suggestions
- Example sentences
- Duplicate detection
- Discussion summaries

Humans provide:

- Natural Mongolian wording
- Context verification
- Source validation
- Technical accuracy
- Final approval
- Trust

The first major content milestone should be approximately 1,300 candidate terms across the ten main categories, with at least 300 human-reviewed entries available at launch.
