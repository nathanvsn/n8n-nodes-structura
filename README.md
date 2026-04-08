# n8n-nodes-structura

![Structura](https://img.shields.io/badge/Structura-Document%20to%20JSON-6C3AED?style=for-the-badge)
![n8n](https://img.shields.io/badge/n8n-Community%20Node-FF6D5A?style=for-the-badge)

**Transform any document into structured JSON with AI.**

This is an [n8n](https://n8n.io/) community node that integrates with [Structura](https://structura.com.br) — an intelligent document processing platform that converts PDFs, invoices, bank statements, contracts, and more into structured data (JSON, Excel, Markdown) using OCR + AI with 99.8% accuracy.

## Features

- **Document to JSON** — Upload any PDF or image, get structured JSON back
- **Custom Schema** — Define exactly which fields to extract using JSON Schema
- **Multiple Output Formats** — JSON, Markdown, Text, or Spreadsheet
- **3 Processing Modes** — Fast, Balanced, Accurate
- **Auto-Wait** — Automatically polls until extraction is complete
- **AI Agent Compatible** — `usableAsTool: true` for n8n AI workflows

## Operations

| Operation | Description |
|-----------|-------------|
| **Extract Document** | Upload a document and extract structured data |
| **Get Document** | Check status and retrieve extraction results |
| **List Documents** | List all processed documents with filters |
| **Download Result** | Download the extracted result as a file |
| **Get Credits** | Check your current credit balance |

## Installation

### Community Node (recommended)

1. Go to **Settings** > **Community Nodes** in your n8n instance
2. Click **Install a community node**
3. Enter `n8n-nodes-structura`
4. Click **Install**

### Manual

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-structura
# Restart n8n
```

## Setup

1. Create a free account at [structura.com.br](https://structura.com.br)
2. Go to **Dashboard** > **Integrations** > **API Keys**
3. Create a new API key (starts with `sk_`)
4. In n8n, add **Structura API** credentials with your key

## Usage Examples

### Example 1: Invoice to JSON

```
[Read PDF] → [Structura: Extract Document] → [Your ERP/Spreadsheet]
```

**Schema example for invoices:**

```json
{
  "type": "object",
  "properties": {
    "empresa": { "type": "string", "description": "Company name" },
    "cnpj": { "type": "string", "description": "CNPJ number" },
    "valor_total": { "type": "number", "description": "Total value" },
    "data_emissao": { "type": "string", "description": "Issue date" },
    "itens": {
      "type": "array",
      "description": "Line items",
      "items": {
        "type": "object",
        "properties": {
          "descricao": { "type": "string", "description": "Item description" },
          "quantidade": { "type": "number", "description": "Quantity" },
          "valor_unitario": { "type": "number", "description": "Unit price" }
        }
      }
    }
  }
}
```

### Example 2: Bank Statement to Spreadsheet

```
[Email Trigger] → [Structura: Extract Document] → [Google Sheets]
```

### Example 3: Contract Analysis

```
[Webhook] → [Structura: Extract Document] → [IF clause found] → [Slack Notification]
```

## Pricing

| Plan | Credits/month | Price |
|------|--------------|-------|
| Free | 30 | R$ 0 |
| Starter | 600 | R$ 69,90 |
| Pro | 1,200 | R$ 119,90 |

1 credit = 1 page. [Full pricing →](https://structura.com.br/pricing)

## Support

- [Structura Docs](https://structura.com.br/docs)
- [API Reference](https://api.structura.com.br/docs)
- [GitHub Issues](https://github.com/structura-ai/n8n-nodes-structura/issues)

## License

MIT
