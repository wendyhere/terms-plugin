# **Content Governance MVP: Terminology**  

**Version:** 3.0 (MVP Focus) | **Owner:** Wendy M., IAPP AIGP | **Status:** Draft

# tldr

We’re developing a language system that supports both human and AI-assisted content creation and governance across the product lifecycle. This PRD covers our first step. 

# Overview 

We need to make product terminology consistent, scalable, and easy to apply across teams.

Today, teams need to make routine content decisions without easy access to approved terms. In practice, this means you either spend time searching for the right language or proceed without guidance, leading to inconsistent terminology, workflow friction, and increased review overhead for UX content designers.

By meeting people where they are instead, in the design canvas (which is Figma for now), these decisions become more accessible if not faster, while allowing UX content designers to focus on higher-impact work (e.g., risk mitigation and protecting the brand).

We'll accomplish this while keeping our future-state in mind: a technology-agnostic content infrastructure that benefits from content as a reusable asset across design and development workflows.

This document focuses on our first step: an MVP Figma proof-of-concept terminology plugin. 

# Problems to solve

Accessing approved terminology is currently slow, fragmented, and dependent on manual communication. While this affects multiple stakeholders, the impact is particularly visible in UX content design workflows.

Three core problems drive the need for this MVP.

| The issue  | Why it's a problem | What this looks like in practice |
| :---- | :---- | :---- |
| 1\. Terminology lookup introduces workflow friction | Looking up approved terms requires leaving the current design workflow and navigating multiple resources. While each instance may only take a few minutes, the cumulative time cost across a week or sprint is significant. This friction also discourages teams from consulting the terminology list in the first place, increasing the likelihood of inconsistent language. | Today, terminology lives in a separate static Figma file. The typical workflow looks like: Leave the design canvas Locate and open the terminology style guide Find the relevant page containing the terminology table Search or manually scroll for the correct term Return to the design file and apply the terminology If the correct term cannot be found, the fallback workflow is: Send a message in Slack Wait for a response from the content team Resolve follow-up questions Return to the design canvas These additional steps create unnecessary interruptions in the design workflow. |
| 2\. Over-reliance on manual content consultation | Because terminology is not easily discoverable in the design workflow, teams often rely on one-off consultations with UX content designers for routine terminology decisions. This creates avoidable review overhead and limits the time UX content designers can spend on higher-impact work. | Common examples include: Designers leaving comments in Figma asking for terminology guidance Slack messages requesting confirmation of product terms Ad-hoc reviews to validate low-risk terminology choices While these interactions are valuable for complex decisions, they are inefficient for routine terminology questions. |
| 3\. Low visibility of terminology across cross-functional teams | The current terminology resource is not integrated into the broader design system and is not widely known outside the content design team. This limits adoption across teams that rely on consistent product language. | Designers may not know the terminology list exists Marketing teams may create alternative names for the same features Product documentation and UI labels may diverge from approved terminology This lack of visibility makes it difficult to maintain consistent product language across the organization. |

# Requirements and Features

| \# | Title (User Story) | Description | Priority | Notes |
| ----- | ----- | ----- | ----- | ----- |
| 1 | Search terminology in Figma | Users can search approved terminology directly within the Figma plugin. | P0 | Core MVP capability |
| 2 | View approved term details  | Users can see preferred terms, don’t use terms, definition, and guidance. | P0 | Helps teams understand correct usage and terms to avoid or never use  |
| 3 | Insert or copy term | Users can quickly copy or insert approved terminology into designs. | P1 | Reduces workflow interruption |
| 4 | Browse terminology list | Users can browse the full list of approved terms. | P1 | Supports discovery |
| 5 | Basic usage analytics | Track searches and term usage to understand adoption. | P2 | Useful for validating MVP |

# About the data 

The current terminology list exists as a static table within a Figma file maintained by the UX content design team. This format makes it difficult to search, integrate with tools, or reuse across workflows.

For the MVP, the terminology dataset will be extracted and stored outside of Figma in a structured format that can be accessed by the plugin.

## Dataset size

The MVP will assume that the dataset remains relatively small and manageable within the plugin environment. Future scaling considerations (e.g., dozens of entries) are out of scope for the MVP.

The initial dataset contains approximately 25 approved terms.

## Data (terminology) schema 

See [Appendix C](#appendix-c:-terminology-schema-sample-entries) for sample entries 

For an MVP that powers a plugin and future AI tools, the schema should:

1. Support search  
2. Support synonyms / variants  
3. Support avoid or banned terms  
4. Provide guidance in one flexible field  
5. Stay simple enough for humans to maintain

### Schema 

***Note*** “Don't use” words follow the same schema as all of the other terms to keep the schema simple and consistent. Note the guidance in usage (i.e., “don't use” and explain why). 

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| term | string | Yes | The approved product term. |
| definition | string | Yes | Short explanation of what the term means. |
| usage | string | Yes | Guidance on when and how to use the term. Includes notes related to accessibility, legal, localization, or edge cases. |
| context  | array of strings from a [pre-defined list](#context-list:) | No | Indicates where the term is typically used in the product (for example: navigation, settings, error messages, account management). |
| variants | array of strings | No | Acceptable alternative forms or grammatical variants of the term. |
| dont | array of strings | No | Terms we avoid using in favor of the approved term. |
| caution | array of strings | No | Terms that may be used in limited contexts but require careful consideration. |
| notes | string | No | Optional additional context or examples. |

### Context list:  {#context-list:}

Only the context category name will appear in the Figma plugin and JSON file. Terms may have more than one category.   

1. Navigation — Wayfinding, menus, tabs, headers, and breadcrumbs.

2. Actions — Buttons, links, CTAs, and trigger-based commands.

3. Inputs — Form labels, placeholders, tooltips, and helper text.

4. Feedback — Success messages, status indicators, and loading states.

5. Errors — Validation, system failures, and troubleshooting guides.

6. Onboarding — Tutorials, welcome screens, and feature tours.

7. Account — Profiles, settings, billing, and authentication.

8. Marketing — Upsells, banners, promotions, and paywalls.

9. Legal — Regulatory, privacy, compliance, AI transparency, and disclaimers.

10. System — Permissions, connectivity, API, and technical states.
 


## Data source 

For the MVP, terminology entries will be stored in a repository using a structured format that can be converted into JSON for plugin use.

This approach allows the dataset to remain easily editable by content designers while also supporting future integrations, automation, and AI-assisted tools.

Potential options explored:

| Option | Description | Tradeoffs |
| :---- | :---- | :---- |
| **✓ WINNER**  GitHub  | Terminology stored as structured data in a repository.  | Best for version control and integration with tools. See Appendix B for considerations of Markdown, JSON or YAML.  |
| Spreadsheet (CSV, Word, or Google Sheets) | Terminology maintained in a spreadsheet and exported for plugin use | Easier for non-technical editing, but weaker version control, Word or Sheets isn’t tool/tech agnostic, and doesn’t scale well.   |
| Static JSON bundled with plugin | Dataset included directly in plugin code | Simplest implementation but requires redeploying plugin for updates |

# Success Criteria

The MVP focuses specifically on terminology discoverability and accessibility in the design workflow.

## Primary

* Reduction in time spent searching for approved terminology  
* Reduction in routine terminology questions directed to UX content designers  
* Increased usage of approved terminology in design files

## Secondary

* Increased awareness of the terminology list across teams  
* Increased consistency in product terminology across surfaces  
* Early validation of terminology as a reusable content asset

## What Success Is Not

* Replacing UX content design review entirely  
* Solving all content governance problems  
* Supporting every content resource (voice, style, microcopy guidance) in the MVP

# Constraints

The MVP will operate within the Figma plugin environment, which introduces several limitations. These constraints require the terminology dataset to remain lightweight and fast to query.

* Limited complexity compared to full applications  
* Restricted runtime environment  
* Plugin performance constraints when loading datasets

# Definition of Done

The MVP is complete when:

* The Figma plugin allows users to search and view approved terminology  
* Terminology data is integrated into the plugin  
* Designers can access terminology without leaving the design canvas  
* The plugin can be tested with internal product teams

---

# **Appendix**

# Appendix A: Open Questions

1. Should we maintain the list in Excel or GitHub (e.g., Markdown file)   
2. How can we ensure the source of truth for terminology updates?  
3. Is it possible that we could allow both inline insertion of terms and copy/paste?  
4. In lieu of baseline metrics, what are other ways we can measure success?   
5. What analytics are required to measure adoption?

# Appendix B: Markdown, JSON or YAML considerations 

Sample terminology dataset used for validation and testing. 

## Option 1 — JSON (Best for systems)

| Pros  | Cons  |
| :---- | :---- |
| ✅ Best for plugins✅ Easy for APIs later  ✅ Easy for AI tools✅ Easy search/filter logic | ❌ Harder for content designers to edit❌ Not very readable❌ Requires PR workflow comfort |

###### \[

  {

    "term": "Workspace",

    "definition": "A shared environment where users collaborate on projects.",

    "usage\_guidance": "Use when referring to the main collaboration space.",

    "notes": "Avoid using 'Project space'."

  },

  {

    "term": "Member",

    "definition": "A user who belongs to a workspace.",

    "usage\_guidance": "Use instead of 'user' when referring to workspace participants."

  }

\]

## Option 2 — Markdown (Best for content teams)

* Pros: Easy for read, Works well in GitHub, Good for style guide integration  
* Cons: Harder for plugins to parse, less structured 

###### \#\# Workspace

###### \*\*Definition\*\*  

###### A shared environment where users collaborate on projects.

###### \*\*Usage guidance\*\*  

###### Use when referring to the main collaboration space.

###### \*\*Notes\*\*  

###### Avoid using "Project space".

###### \---

###### \#\# Member

###### \*\*Definition\*\*  

###### A user who belongs to a workspace.

###### \*\*Usage guidance\*\*  

###### Use instead of "user" when referring to workspace participants.

## Winner?? Option 3 — Use Markdown with frontmatter.

###### \---

###### term: Workspace

###### status: approved

###### \---

###### 

###### \*\*Definition\*\*  

###### A shared environment where users collaborate on projects.

###### 

###### \*\*Usage guidance\*\*  

###### Use when referring to the main collaboration space.

###### 

###### \*\*Notes\*\*  

###### Avoid using "Project space".

# Appendix C: Terminology schema sample entries  {#appendix-c:-terminology-schema-sample-entries}

In json 

###### \[

######   {

######     "term": "Workspace",

######     "definition": "A shared environment where users collaborate on projects.",

######     "usage": "Use when referring to the primary collaboration space within the product.",

######     "variants": \["workspaces"\],

######     "dont": \["team space", "project space"\],

######     "caution": \["environment"\],

######     "notes": ""

######   },

######   {

######     "term": "Member",

######     "definition": "A person who belongs to a workspace.",

######     "usage": "Use when referring to people who belong to a workspace or team.",

######     "context": \["account\_management", "permissions"\],

######     "variants": \["members"\],

######     "dont": \["user", "participant"\],

######     "caution": \[\],

######     "notes": "Use 'user' only in general documentation contexts."

######   },

######   {

######     "term": "oops",

######     "definition": "Informal expression used to acknowledge a mistake.",

######     "usage": "Do not use in product UI. Use clear and neutral language in error messages.",

######     "context": \["error\_messages"\],

######     "variants": \["oops\!"\],

######     "dont": \[\],

######     "caution": \[\],

######     "notes": "Avoid casual or playful language in error states."

######   }

###### \]

###### 

