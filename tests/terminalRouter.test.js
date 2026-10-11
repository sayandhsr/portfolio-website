import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTerminalCommand, DIRECTIVE_RESPONSES, buildChatHistory } from '../src/components/terminalRouter.js';

test('Terminal Router: General knowledge and technical questions route strictly to REMOTE_AI', () => {
  const generalQueries = [
    'tell me about quantum computing',
    'what about python 3.12?',
    'how does a transformer model work',
    'how does backpropagation work',
    'history of computing',
    'history of the internet',
    'study of deep learning',
    'what is a prime number',
    'what is the time complexity of quicksort',
    'machine learning architecture',
    'which framework is best for vision?',
    'can you explain gradient descent?',
    'tell me about black holes',
    'why is gold expensive?',
    'how to write a rust macro',
    'write a python function to reverse a string',
    'how do computer networks work',
    'explain internal combustion engines',
    'what degree is a right angle'
  ];

  for (const query of generalQueries) {
    const res = classifyTerminalCommand(query);
    assert.equal(res.type, 'REMOTE_AI', `Expected "${query}" to route to REMOTE_AI, got "${res.type}"`);
  }
});

test('Terminal Router: Offline directives route strictly to their corresponding handler', () => {
  const directiveMap = [
    // Greetings
    ['hi', 'GREETING'],
    ['hello', 'GREETING'],
    ['hey', 'GREETING'],
    ['good morning', 'GREETING'],
    ['yo!', 'GREETING'],

    // Help
    ['help', 'HELP'],
    ['commands', 'HELP'],
    ['cat help', 'HELP'],
    ['man', 'HELP'],
    ['what can you do', 'HELP'],

    // Whois
    ['whois', 'WHOIS'],
    ['bio', 'WHOIS'],
    ['cat whois', 'WHOIS'],
    ['who is sayandh', 'WHOIS'],
    ['who are you', 'WHOIS'],
    ['tell me about yourself', 'WHOIS'],
    ['tell me about sayandh raj', 'WHOIS'],

    // Skills
    ['skills', 'SKILLS'],
    ['stack', 'SKILLS'],
    ['techstack', 'SKILLS'],
    ['cat skills', 'SKILLS'],
    ['what are your skills', 'SKILLS'],
    ['what is your stack', 'SKILLS'],

    // Projects
    ['projects', 'PROJECTS'],
    ['portfolio', 'PROJECTS'],
    ['show projects', 'PROJECTS'],
    ['what did you build', 'PROJECTS'],
    ['kill switch', 'KILL_SWITCH'],
    ['unsullied code', 'UNSULLIED'],

    // Experience
    ['experience', 'EXPERIENCE'],
    ['work experience', 'EXPERIENCE'],
    ['cat experience', 'EXPERIENCE'],
    ['where did you work', 'EXPERIENCE'],

    // Badges
    ['badges', 'BADGES'],
    ['credly', 'BADGES'],
    ['show badges', 'BADGES'],
    ['cat badges', 'BADGES'],

    // Education
    ['education', 'EDUCATION'],
    ['cat education', 'EDUCATION'],
    ['where did you study', 'EDUCATION'],
    ['what is your degree', 'EDUCATION'],

    // Contact
    ['contact', 'CONTACT'],
    ['email', 'CONTACT'],
    ['how to contact you', 'CONTACT'],
    ['show contact', 'CONTACT'],

    // Clock
    ['time', 'DATE_TIME'],
    ['clock', 'DATE_TIME'],
    ['what is the time', 'DATE_TIME'],

    // Control
    ['clear', 'CLEAR'],
    ['cls', 'CLEAR'],
    ['audio', 'AUDIO'],
    ['mute', 'AUDIO'],
    ['tip', 'MATCHA'],
    ['gameboy', 'GAMEBOY'],
    ['games', 'GAMEBOY'],
    ['exit', 'EXIT']
  ];

  for (const [query, expected] of directiveMap) {
    const res = classifyTerminalCommand(query);
    assert.equal(res.type, expected, `Expected "${query}" to route to "${expected}", got "${res.type}"`);
  }
});

test('Terminal Router: Directive responses have non-empty valid content', () => {
  const requiredTypes = [
    'GREETING',
    'HELP',
    'WHOIS',
    'SKILLS',
    'PROJECTS',
    'KILL_SWITCH',
    'UNSULLIED',
    'EXPERIENCE',
    'BADGES',
    'EDUCATION',
    'CONTACT',
    'MATCHA'
  ];

  for (const type of requiredTypes) {
    assert.ok(DIRECTIVE_RESPONSES[type], `DIRECTIVE_RESPONSES[${type}] must be defined`);
    assert.ok(DIRECTIVE_RESPONSES[type].length > 10, `DIRECTIVE_RESPONSES[${type}] must not be empty`);
  }

  // Ensure education explicitly mentions institutions & industrial partners
  assert.ok(DIRECTIVE_RESPONSES.EDUCATION.includes('Kerala University of Digital Sciences'));
  assert.ok(DIRECTIVE_RESPONSES.EDUCATION.includes('Yenepoya'));
  assert.ok(DIRECTIVE_RESPONSES.EDUCATION.includes('IBM'));
  assert.ok(DIRECTIVE_RESPONSES.EDUCATION.includes('TCS iON'));
});

test('Terminal Router: buildChatHistory constructs valid multi-turn payloads for Gemini and OpenRouter', () => {
  const mockMessages = [
    { sender: 'system', text: 'system online. spurce.ai neural backend linked.' },
    { sender: 'user', text: 'who is the father of nation?' },
    { sender: 'ai', text: 'Mahatma Gandhi\n\n[via spurce.ai]' },
    { sender: 'system', text: 'audio hardware: ONLINE' }
  ];

  const { geminiContents, openRouterHistory } = buildChatHistory(mockMessages, 'full name?');

  // 1. Gemini payload structure
  assert.equal(geminiContents.length, 3, 'Gemini contents should contain 3 turns');
  assert.equal(geminiContents[0].role, 'user');
  assert.equal(geminiContents[0].parts[0].text, 'who is the father of nation?');
  assert.equal(geminiContents[1].role, 'model');
  assert.equal(geminiContents[1].parts[0].text, 'Mahatma Gandhi', 'Should strip [via spurce.ai] footer');
  assert.equal(geminiContents[2].role, 'user');
  assert.equal(geminiContents[2].parts[0].text, 'full name?');

  // 2. OpenRouter payload structure
  assert.equal(openRouterHistory.length, 3, 'OpenRouter history should contain 3 messages');
  assert.equal(openRouterHistory[0].role, 'user');
  assert.equal(openRouterHistory[0].content, 'who is the father of nation?');
  assert.equal(openRouterHistory[1].role, 'assistant');
  assert.equal(openRouterHistory[1].content, 'Mahatma Gandhi');
  assert.equal(openRouterHistory[2].role, 'user');
  assert.equal(openRouterHistory[2].content, 'full name?');
});

