import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for adaptive phase (generating follow-up questions)
const ADAPTIVE_SYSTEM_PROMPT = `You are ShopCoach AI's Creator Profiler. Based on the creator's quiz answers, generate 3-5 follow-up questions that dig deeper into their specific situation. Each question should have 3-4 multiple choice options. Return ONLY valid JSON in this format: { "questions": [{ "id": "q6", "question": "...", "options": ["...", "...", "..."] }] }. Make questions specific to THEIR answers — not generic. If they said they're in beauty, ask about beauty subcategories. If they said they're a beginner, ask about their specific struggles. Be the coach who listens, then asks the question that unlocks everything.`;

// System prompt for results phase (generating Creator DNA Profile)
const RESULTS_SYSTEM_PROMPT = `You are ShopCoach AI's Creator DNA Profiler — the most advanced TikTok Shop affiliate assessment in the world. Based on ALL quiz answers, generate a comprehensive Creator DNA Profile. Return ONLY valid JSON:
{
  "creatorType": { "name": "The [Archetype Name]", "emoji": "relevant emoji", "description": "2-3 sentences about their creator archetype" },
    "scores": { "hookStrength": 1-100, "contentConsistency": 1-100, "productIntuition": 1-100, "conversionPotential": 1-100, "nicheFit": 1-100 },
      "topNiche": { "primary": "...", "secondary": "...", "avoid": "..." },
        "contentStyle": { "bestFormats": ["format1", "format2", "format3"], "filmingStyle": "...", "personalityFit": "..." },
          "productMatches": [{ "category": "...", "whyItFits": "...", "commissionRange": "X-Y%", "difficulty": "Easy/Medium/Hard" }, ...3 products],
            "weekOnePlan": { "day1": "specific action", "day2": "specific action", "day3": "specific action" },
              "earningPotential": { "month1": "$X-$Y", "month3": "$X-$Y", "month6": "$X-$Y" },
                "coachAdvice": "2-3 sentences of direct, blunt ShopCoach-style advice tailored to THIS specific creator"
                }
                Be specific. Use their actual answers to make this feel personal — not generic. If they said they hate being on camera, recommend faceless formats. If they're in fitness, recommend specific supplement categories. This profile should feel like a coach who GETS them.`;

export async function POST(request) {
    try {
          const { answers, phase } = await request.json();

      // Validate inputs
      if (!answers || !Array.isArray(answers)) {
              return Response.json(
                { success: false, error: 'Missing or invalid answers array' },
                { status: 400 }
                      );
      }

      if (!phase || !['adaptive', 'results'].includes(phase)) {
              return Response.json(
                { success: false, error: 'Missing or invalid phase (must be "adaptive" or "results")' },
                { status: 400 }
                      );
      }

      // Build the user message based on phase
      let userMessage = '';

      if (phase === 'adaptive') {
              // For adaptive phase, format the core 5 answers as context
            const answersText = answers
                .map((item, i) => `Q${i + 1}: ${item.question}\nA: ${item.answer}`)
                .join('\n\n');

            userMessage = `Here are the creator's core quiz answers:\n\n${answersText}\n\nNow generate 3-5 personalized follow-up questions based on these answers.`;
      } else if (phase === 'results') {
              // For results phase, format all answers (core + adaptive)
            const answersText = answers
                .map((item, i) => `Q${i + 1}: ${item.question}\nA: ${item.answer}`)
                .join('\n\n');

            userMessage = `Here are ALL the creator's quiz answers:\n\n${answersText}\n\nNow generate a comprehensive Creator DNA Profile based on these complete answers.`;
      }

      // Call Claude API
      const systemPrompt = phase === 'adaptive' ? ADAPTIVE_SYSTEM_PROMPT : RESULTS_SYSTEM_PROMPT;

      const message = await client.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 2048,
              system: systemPrompt,
              messages: [
                {
                            role: 'user',
                            content: userMessage,
                },
                      ],
      });

      // Extract text response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      // Try to parse JSON
      let parsedJSON;
          let isParsed = true;

      try {
              parsedJSON = JSON.parse(responseText);
      } catch (parseError) {
              isParsed = false;
              parsedJSON = responseText;
      }

      // Return response
      if (isParsed) {
              return Response.json({
                        success: true,
                        data: parsedJSON,
              });
      } else {
              return Response.json({
                        success: false,
                        error: 'Failed to parse Claude response as JSON',
                        rawText: parsedJSON,
              });
      }
    } catch (error) {
          console.error('Quiz API error:', error);

      return Response.json(
        {
                  success: false,
                  error: error.message || 'Internal server error',
        },
        { status: 500 }
            );
    }
}
