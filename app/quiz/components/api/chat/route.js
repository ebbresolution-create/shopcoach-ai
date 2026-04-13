import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from '../../lib/prompts';

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

export async function POST(request) {
    try {
          const { mode, message, conversationHistory, stream } = await request.json();

          if (!message) {
                  return new Response(
                            JSON.stringify({ error: 'Message is required' }),
                            { status: 400, headers: { 'Content-Type': 'application/json' } }
                          );
                }

          const systemPrompt = getSystemPrompt(mode);

          // Build messages array with conversation history
          const messages = [
                  ...(conversationHistory || []),
                  {
                            role: 'user',
                            content: message,
                          },
                ];

          // Handle streaming vs non-streaming
          if (stream) {
                  return handleStream(systemPrompt, messages);
                } else {
                  return handleNonStream(systemPrompt, messages);
                }
        } catch (error) {
          console.error('Chat API error:', error);
          return new Response(
                  JSON.stringify({
                            error: 'Failed to process chat request',
                            details: error.message,
                          }),
                  { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
        }
  }

async function handleNonStream(systemPrompt, messages) {
    const response = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: systemPrompt,
          messages: messages,
        });

    const assistantMessage = response.content[0].text;

    return new Response(
          JSON.stringify({
                  content: assistantMessage,
                  usage: {
                            input_tokens: response.usage.input_tokens,
                            output_tokens: response.usage.output_tokens,
                          },
                }),
          {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' },
                }
        );
  }

async function handleStream(systemPrompt, messages) {
    const stream = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: systemPrompt,
          messages: messages,
          stream: true,
        });

    // Create a readable stream that sends SSE formatted events
    const readable = new ReadableStream({
          async start(controller) {
                  try {
                            for await (const event of stream) {
                                        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                                                      const text = event.delta.text;
                                                      controller.enqueue(
                                                                      new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
                                                                    );
                                                    } else if (event.type === 'message_stop') {
                                                      controller.enqueue(
                                                                      new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`)
                                                                    );
                                                      controller.close();
                                                    }
                                      }
                          } catch (error) {
                            controller.error(error);
                          }
                },
        });

    return new Response(readable, {
          status: 200,
          headers: {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive',
                },
        });
  }
