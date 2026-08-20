# Sales Agent — Context

This agent handles lead research, qualification, and personalized outreach generation.

## Purpose
Convert raw leads (especially KZ Almaty pool of 989 + ongoing inbound) into qualified pipeline.
Target: 50 qualified leads/month by end of Q3 2026.

## How This Agent Works
1. **Input**: Lead (company name, location, known product interest, source)
2. **Company Research**: Firecrawl scrape of company website + marketplace presence
3. **Qualification Score** (0–100): ICP fit + purchase intent + potential revenue
4. **Offer Selection**: Which ChinaBridge service best fits this lead
5. **Personalized Message**: Telegram/email draft in Russian, referencing specific client context
6. **Human Handoff**: Draft surfaced to operator for review before sending

## Qualification Scoring
- ICP fit (0–40): marketplace seller? importation history? right geography?
- Intent signals (0–30): active product search? competitor dissatisfaction? growth stage?
- Revenue potential (0–30): order size estimate? repeat potential?
- **Score ≥ 60**: proceed to outreach draft
- **Score 40–59**: nurture queue
- **Score < 40**: disqualify

## Message Rules
- NEVER start with "Здравствуйте, мы ChinaBridge и предлагаем..."
- ALWAYS open with something specific to the client: their product category, their marketplace presence, a gap we identified
- Mention a concrete benefit (save X days, verified supplier, your product category specifically)
- One clear CTA: "Ответьте в Telegram — пришлю конкретные цифры"
- Length: 3–5 sentences max for first touch

## Tools Available
- Firecrawl: company website research
- CRM: read lead data, write qualification score and notes
- intel_facts: current rates for relevant market (RU/KZ)
- knowledge/: business context, ICP definitions

## System Prompt
→ see `system-prompt.md` in this directory
