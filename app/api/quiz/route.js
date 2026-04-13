import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ADAPTIVE_SYSTEM_PROMPT = 'You are ShopCoach AI Creator Profiler. Based on the creator quiz answers, generate 3-5 follow-up questions that dig deeper into their specific situation. Each question should have 3-4 multiple choice options. Return ONLY valid JSON in this format: { "questions": [{ "id": "q6", "question": "...", "options": ["...", "...", "..."] }] }. Make questions specific to THEIR answers. If they said they are in beauty, ask about beauty subcategories. If they said they are a beginner, ask about their specific struggles.';

const RESULTS_SYSTEM_PROMPT = 'You are ShopCoach AI Creator DNA Profiler. Based on ALL quiz answers, generate a comprehensive Creator DNA Profile. Return ONLY valid JSON: { "creatorType": { "name": "The [Archetype Name]", "emoji": "relevant emoji", "description": "2-3 sentences about their creator archetype" }, "scores": { "hookStrength": 1-100, "contentConsistency": 1-100, "productIntuition": 1-100, "conversionPotential": 1-100, "nicheFit": 1-100 }, "topNiche": { "primary": "...", "secondary": "...", "avoid": "..." }, "contentStyle": { "bestFormats": ["format1", "format2", "format3"], "filmingStyle": "...", "personalityFit": "..." }, "productMatches": [{ "category": "...", "whyItFits": "...", "commissionRange": "X-Y%", "difficulty": "Easy/Medium/Hard" }], "weekOnePlan": { "day1": "specific action", "day2": "specific action", "day3": "specific action" }, "earningPotential": { "month1": "$X-$Y", "month3": "$X-$Y", "month6": "$X-$Y" }, "coachAdvice": "2-3 sentences of direct ShopCoach-style advice tailored to THIS specific creator" }. Be specific and use their actual answers.';

export async function POST(request) {
  try {
    const { answers, phase } = await request.json();

    if (!answers || !Array.isArray(answers)) {
      return Response.json({ success: false, error: 'Missing or invalid answers array' }, { status: 400 });
    }

    if (!phase || !['adaptive', 'results'].includes(phase)) {
      return Response.json({ success: false, error: 'Missing or invalid phase' }, { status: 400 });
    }

    let userMessage = '';

    if (phase === 'adaptive') {
      const answersText = answers.map((item, i) => 'Q' + (i + 1) + ': ' + item.question + '\nA: ' + item.answer).join('\n\n');
      userMessage = 'Here are the creator quiz answers:\n\n' + answersText + '\n\nNow generate 3-5 personalized follow-up questions based on these answers.';
    } else if (phase === 'results') {
      const answersText = answers.map((item, i) => 'Q' + (i + 1) + ': ' + item.question + '\nA: ' + item.answer).join('\n\n');
      userMessage = 'Here are ALL the creator quiz answers:\n\n' + answersText + '\n\nNow generate a comprehensive Creator DNA Profile based on these complete answers.';
    }

    const systemPrompt = phase === 'adaptive' ? ADAPTIVE_SYSTEM_PROMPT : RESULTS_SYSTEM_PROMPT;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let parsedJSON;
    let isParsed = true;

    try {
      parsedJSON = JSON.parse(responseText);
    } catch (parseError) {
      isParsed = false;
      parsedJSON = responseText;
    }

    if (isParsed) {
      return Response.json({ success: true, data: parsedJSON });
    } else {
      return Response.json({ success: false, error: 'Failed to parse Claude response as JSON', rawText: parsedJSON });
    }
  } catch (error) {
    console.error('Quiz API error:', error);
    return Response.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
