import { LessonContent } from '../types/lesson';

export const sampleLessons: LessonContent[] = [
  {
    id: 'grammar-present-simple',
    title: 'Present Simple Tense',
    level: 'beginner',
    topic: 'Basic Grammar',
    skill: 'grammar',
    estimatedTime: 15,
    body: `The present simple tense is used to describe habits, routines, facts, and general truths. It's one of the most important tenses in English.

**Formation:**
- Positive: Subject + base verb (+ s/es for he/she/it)
- Negative: Subject + don't/doesn't + base verb
- Question: Do/Does + subject + base verb?

**When to use:**
- Daily routines: "I wake up at 7 AM"
- Facts: "The sun rises in the east"
- Habits: "She drinks coffee every morning"`,
    wordList: [
      {
        word: 'habit',
        definition: 'something you do regularly',
        pronunciation: '/ˈhæbɪt/',
        partOfSpeech: 'noun',
        example: 'Reading before bed is a good habit.'
      },
      {
        word: 'routine',
        definition: 'a regular way of doing things',
        pronunciation: '/ruːˈtiːn/',
        partOfSpeech: 'noun',
        example: 'My morning routine includes exercise.'
      },
      {
        word: 'frequently',
        definition: 'often; many times',
        pronunciation: '/ˈfriːkwəntli/',
        partOfSpeech: 'adverb',
        example: 'I frequently visit my grandmother.'
      }
    ],
    examples: [
      {
        correct: 'She works at a hospital.',
        incorrect: 'She work at a hospital.',
        explanation: 'Use "works" (with -s) for third person singular (he/she/it).'
      },
      {
        correct: 'They don\'t like spicy food.',
        incorrect: 'They doesn\'t like spicy food.',
        explanation: 'Use "don\'t" with plural subjects (they, we) and "doesn\'t" with singular third person (he/she/it).'
      },
      {
        correct: 'Do you speak English?',
        incorrect: 'Does you speak English?',
        explanation: 'Use "Do" with you, I, we, they. Use "Does" with he, she, it.'
      }
    ],
    exercises: [
      {
        id: 'ex1',
        type: 'multiple-choice',
        question: 'Choose the correct form: "She _____ to work every day."',
        options: ['go', 'goes', 'going', 'went'],
        correctAnswer: 1,
        explanation: 'Use "goes" because the subject is "she" (third person singular).',
        points: 10
      },
      {
        id: 'ex2',
        type: 'fill-blank',
        question: 'Complete: "I _____ (not/like) coffee."',
        correctAnswer: "don't like",
        explanation: 'Use "don\'t like" for negative present simple with "I".',
        points: 10
      },
      {
        id: 'ex3',
        type: 'true-false',
        question: 'True or False: "He don\'t work on Sundays" is correct.',
        correctAnswer: false,
        explanation: 'Incorrect. It should be "He doesn\'t work on Sundays" (doesn\'t for third person singular).',
        points: 10
      }
    ]
  },
  {
    id: 'vocabulary-family',
    title: 'Family Members',
    level: 'beginner',
    topic: 'Family & Relationships',
    skill: 'vocabulary',
    estimatedTime: 12,
    body: `Learning family vocabulary is essential for basic conversations. These words help you talk about your relatives and understand family relationships.

**Immediate Family:**
- Parents: mother/mom, father/dad
- Children: son, daughter
- Siblings: brother, sister

**Extended Family:**
- Grandparents: grandmother/grandma, grandfather/grandpa
- Aunts and uncles: aunt, uncle
- Cousins: cousin (male/female)

**In-laws (after marriage):**
- Mother-in-law, father-in-law, sister-in-law, brother-in-law`,
    wordList: [
      {
        word: 'sibling',
        definition: 'a brother or sister',
        pronunciation: '/ˈsɪblɪŋ/',
        partOfSpeech: 'noun',
        example: 'I have two siblings - one brother and one sister.'
      },
      {
        word: 'relative',
        definition: 'a family member',
        pronunciation: '/ˈrelətɪv/',
        partOfSpeech: 'noun',
        example: 'All my relatives came to the wedding.'
      },
      {
        word: 'generation',
        definition: 'people born around the same time in a family',
        pronunciation: '/ˌdʒenəˈreɪʃən/',
        partOfSpeech: 'noun',
        example: 'Three generations live in our house: grandparents, parents, and children.'
      },
      {
        word: 'nephew',
        definition: 'the son of your brother or sister',
        pronunciation: '/ˈnefjuː/',
        partOfSpeech: 'noun',
        example: 'My nephew is five years old.'
      },
      {
        word: 'niece',
        definition: 'the daughter of your brother or sister',
        pronunciation: '/niːs/',
        partOfSpeech: 'noun',
        example: 'My niece loves to draw pictures.'
      }
    ],
    examples: [
      {
        correct: 'My mother is a teacher.',
        incorrect: 'My mother are a teacher.',
        explanation: 'Use "is" with singular subjects like "mother".'
      },
      {
        correct: 'I have three brothers.',
        incorrect: 'I have three brother.',
        explanation: 'Use plural form "brothers" when talking about more than one.'
      }
    ],
    exercises: [
      {
        id: 'ex1',
        type: 'multiple-choice',
        question: 'What do you call your father\'s brother?',
        options: ['cousin', 'uncle', 'nephew', 'brother-in-law'],
        correctAnswer: 1,
        explanation: 'Your father\'s brother is your uncle.',
        points: 10
      },
      {
        id: 'ex2',
        type: 'fill-blank',
        question: 'My sister\'s daughter is my _____.',
        correctAnswer: 'niece',
        explanation: 'Your sister\'s daughter is your niece.',
        points: 10
      },
      {
        id: 'ex3',
        type: 'multiple-choice',
        question: 'Which word means "a brother or sister"?',
        options: ['relative', 'sibling', 'cousin', 'in-law'],
        correctAnswer: 1,
        explanation: 'A sibling is a brother or sister.',
        points: 10
      }
    ]
  },
  {
    id: 'pronunciation-th-sounds',
    title: 'The TH Sounds',
    level: 'beginner',
    topic: 'Pronunciation',
    skill: 'pronunciation',
    estimatedTime: 18,
    body: `The "th" sound is one of the most challenging sounds for English learners. There are actually two different "th" sounds in English:

**Voiced TH /ð/ (vocal cords vibrate):**
- Found in: the, this, that, they, there, brother
- Tip: Put your tongue between your teeth and make a buzzing sound

**Voiceless TH /θ/ (no vocal cord vibration):**
- Found in: think, thank, three, month, math
- Tip: Put your tongue between your teeth and blow air gently

**Practice Tips:**
1. Look in a mirror - you should see your tongue tip
2. Start slowly, then increase speed
3. Practice with minimal pairs (thin/sin, think/sink)`,
    wordList: [
      {
        word: 'think',
        definition: 'to use your mind to consider something',
        pronunciation: '/θɪŋk/',
        partOfSpeech: 'verb',
        example: 'I think this lesson is helpful.'
      },
      {
        word: 'three',
        definition: 'the number 3',
        pronunciation: '/θriː/',
        partOfSpeech: 'number',
        example: 'I have three cats.'
      },
      {
        word: 'brother',
        definition: 'a male sibling',
        pronunciation: '/ˈbrʌðər/',
        partOfSpeech: 'noun',
        example: 'My brother is older than me.'
      },
      {
        word: 'weather',
        definition: 'the condition of the atmosphere',
        pronunciation: '/ˈweðər/',
        partOfSpeech: 'noun',
        example: 'The weather is nice today.'
      }
    ],
    examples: [
      {
        correct: 'I think /θɪŋk/ about you.',
        incorrect: 'I sink /sɪŋk/ about you.',
        explanation: 'Put your tongue between your teeth for the "th" sound in "think".'
      },
      {
        correct: 'This /ðɪs/ is my book.',
        incorrect: 'Dis /dɪs/ is my book.',
        explanation: 'The "th" in "this" is voiced - your vocal cords should vibrate.'
      }
    ],
    exercises: [
      {
        id: 'ex1',
        type: 'multiple-choice',
        question: 'Which word has the voiceless TH sound /θ/?',
        options: ['the', 'think', 'brother', 'weather'],
        correctAnswer: 1,
        explanation: '"Think" has the voiceless /θ/ sound. The others have the voiced /ð/ sound.',
        points: 10
      },
      {
        id: 'ex2',
        type: 'true-false',
        question: 'True or False: In "three", your vocal cords should vibrate when making the TH sound.',
        correctAnswer: false,
        explanation: 'False. "Three" has the voiceless /θ/ sound - no vocal cord vibration.',
        points: 10
      },
      {
        id: 'ex3',
        type: 'multiple-choice',
        question: 'What should you do to make the TH sound correctly?',
        options: ['Keep tongue behind teeth', 'Put tongue between teeth', 'Touch tongue to roof of mouth', 'Keep mouth closed'],
        correctAnswer: 1,
        explanation: 'Put your tongue between your teeth to make the TH sound correctly.',
        points: 10
      }
    ]
  }
];