# How to Update Q/A Knowledge Base

## Overview

Your bot uses a simple Q/A system stored in `qa_knowledge.json`. Each entry has:
- `question`: What users might ask
- `answer`: What the bot responds

## Structure

```json
[
  {
    "question": "Example question?",
    "answer": "Detailed answer here"
  }
]
```

## Adding New Q/A Pairs

1. Open `qa_knowledge.json`
2. Add a new entry to the array
3. Save the file
4. That's it! No need to restart or retrain

## Tips for Good Q/A Pairs

### Questions
- Use natural language as users would ask
- Include variations: "Qu'est-ce que...?" "Comment...?" "Pourquoi...?"
- Keep it short (under 50 words)

### Answers
- Be comprehensive but concise
- Include relevant links
- Add specific details users would want
- Use actionable language

## Example

```json
{
  "question": "Où acheter un bracelet?",
  "answer": "Commandez votre bracelet HealthLink sur WhatsApp: https://wa.me/243892615790. Prix: 3-10$. Créez ensuite votre compte gratuit sur https://gethealth.link/register."
}
```

## How It Works

The bot uses TF-IDF (Term Frequency-Inverse Document Frequency) with cosine similarity to match user queries to your Q/A pairs:

1. User sends: "Comment commander?"
2. Bot computes similarity scores with all questions
3. Bot finds best match (score > 0.15 threshold)
4. Bot returns the corresponding answer

## Adjusting the Threshold

Edit `semantic_search.py` line 59:

```python
if best_score > 0.15:  # Lower = more permissive, Higher = stricter
```

Recommended values:
- 0.10 - Very permissive, may return false matches
- 0.15 - Balanced (default)
- 0.25 - Strict, only very similar matches

## Common Questions to Add

Consider adding Q/A for:
- Product features
- Troubleshooting
- Order information
- Contact details
- Pricing
- How-to guides
- Policies (return, privacy, etc.)

## Testing

After adding Q/A pairs, test them:

```bash
python semantic_search.py "Your test question here"
```

## No Model Downloads Needed!

Unlike previous approach, this system:
- ✅ No large model downloads
- ✅ Fast startup (< 1 second)
- ✅ Easy to update (just edit JSON)
- ✅ Low memory usage (~50MB)
- ✅ Works offline

