// database/seed.js
// Run once to populate the database: node database/seed.js

const { initDB, dbGet, dbRun, dbAll } = require('./db');

async function seed() {
  await initDB();
  console.log('🌱 Starting database seeding...');

  // ── MONSTERS ──────────────────────────────────────────────────────────────
  const monsters = [
    { name: 'Syntax Slime',       category: 'programming_basics', hp: 60,  level_required: 1, image_emoji: '🟢', xp_reward: 40,  coin_reward: 15, description: 'A gooey creature born from syntax errors. Easy to beat for beginners!' },
    { name: 'Logic Goblin',       category: 'programming_basics', hp: 100, level_required: 2, image_emoji: '👺', xp_reward: 70,  coin_reward: 25, description: 'Loves to confuse with faulty logic. Watch out for trick questions!' },
    { name: 'Array Serpent',      category: 'arrays',             hp: 80,  level_required: 1, image_emoji: '🐍', xp_reward: 55,  coin_reward: 20, description: 'An index-jumping serpent. Off-by-one errors give it power!' },
    { name: 'Matrix Hydra',       category: 'arrays',             hp: 140, level_required: 3, image_emoji: '🐉', xp_reward: 100, coin_reward: 40, description: 'A multi-dimensional beast. Only 2D array masters can defeat it!' },
    { name: 'Regex Wraith',       category: 'strings',            hp: 70,  level_required: 1, image_emoji: '👻', xp_reward: 50,  coin_reward: 18, description: 'Haunts you with pattern matching nightmares!' },
    { name: 'Palindrome Phantom', category: 'strings',            hp: 110, level_required: 3, image_emoji: '🌀', xp_reward: 80,  coin_reward: 30, description: 'Reads the same forwards and backwards. Tricky!' },
    { name: 'Inheritance Imp',    category: 'oop',                hp: 90,  level_required: 2, image_emoji: '👿', xp_reward: 65,  coin_reward: 22, description: 'Abuses the inheritance chain. Know your super classes!' },
    { name: 'Polymorphic Beast',  category: 'oop',                hp: 150, level_required: 4, image_emoji: '🦄', xp_reward: 110, coin_reward: 45, description: 'Changes its form! Understanding polymorphism is the only way.' },
    { name: 'SQL Specter',        category: 'dbms',               hp: 85,  level_required: 2, image_emoji: '💀', xp_reward: 60,  coin_reward: 22, description: 'Feeds on wrong JOIN queries. Get your SQL right!' },
    { name: 'Deadlock Demon',     category: 'dbms',               hp: 160, level_required: 5, image_emoji: '🔒', xp_reward: 120, coin_reward: 50, description: 'Locks everything! Only concurrency experts escape.' },
    { name: 'Process Phantom',    category: 'os',                 hp: 95,  level_required: 2, image_emoji: '⚙️', xp_reward: 68,  coin_reward: 25, description: 'Haunts your process table. Know your scheduling algorithms!' },
    { name: 'Deadlock Dragon',    category: 'os',                 hp: 170, level_required: 5, image_emoji: '🐲', xp_reward: 130, coin_reward: 55, description: 'The king of circular waits. Only the most skilled can break the cycle.' },
    { name: 'Math Minotaur',      category: 'aptitude',           hp: 75,  level_required: 1, image_emoji: '🐮', xp_reward: 52,  coin_reward: 18, description: 'Tests your number crunching. No calculators allowed!' },
    { name: 'Logic Lich',         category: 'aptitude',           hp: 120, level_required: 3, image_emoji: '🧟', xp_reward: 90,  coin_reward: 35, description: 'An undead master of puzzles. Think carefully before answering!' },
  ];

  const existingMonsters = dbAll('SELECT id FROM monsters', []);
  if (existingMonsters.length === 0) {
    for (const m of monsters) {
      dbRun(
        'INSERT INTO monsters (name, category, hp, level_required, image_emoji, xp_reward, coin_reward, description) VALUES (?,?,?,?,?,?,?,?)',
        [m.name, m.category, m.hp, m.level_required, m.image_emoji, m.xp_reward, m.coin_reward, m.description]
      );
    }
    console.log(`✅ Seeded ${monsters.length} monsters`);
  } else {
    console.log(`ℹ️  Monsters already seeded (${existingMonsters.length} found), skipping`);
  }

  // ── ACHIEVEMENTS ──────────────────────────────────────────────────────────
  const achievements = [
    { name: 'First Blood',    description: 'Win your first battle',                icon: '⚔️',  condition_type: 'monsters_defeated', condition_value: 1   },
    { name: 'Monster Hunter', description: 'Defeat 10 monsters',                   icon: '🏹',  condition_type: 'monsters_defeated', condition_value: 10  },
    { name: 'Dragon Slayer',  description: 'Defeat 50 monsters',                   icon: '🐉',  condition_type: 'monsters_defeated', condition_value: 50  },
    { name: 'Scholar',        description: 'Answer 50 questions correctly',        icon: '📚',  condition_type: 'correct_answers',   condition_value: 50  },
    { name: 'Genius',         description: 'Answer 200 questions correctly',       icon: '🧠',  condition_type: 'correct_answers',   condition_value: 200 },
    { name: 'Hot Streak',     description: 'Get 5 correct answers in a row',       icon: '🔥',  condition_type: 'best_streak',       condition_value: 5   },
    { name: 'Unstoppable',    description: 'Get 15 correct answers in a row',      icon: '⚡',  condition_type: 'best_streak',       condition_value: 15  },
    { name: 'Veteran',        description: 'Play 20 battles',                      icon: '🎖️', condition_type: 'total_battles',     condition_value: 20  },
    { name: 'Level 10',       description: 'Reach player level 10',               icon: '🌟',  condition_type: 'level',             condition_value: 10  },
    { name: 'Rich Warrior',   description: 'Accumulate 500 coins',                icon: '💰',  condition_type: 'coins',             condition_value: 500 },
  ];

  const existingAchievements = dbAll('SELECT id FROM achievements', []);
  if (existingAchievements.length === 0) {
    for (const a of achievements) {
      dbRun(
        'INSERT INTO achievements (name, description, icon, condition_type, condition_value) VALUES (?,?,?,?,?)',
        [a.name, a.description, a.icon, a.condition_type, a.condition_value]
      );
    }
    console.log(`✅ Seeded ${achievements.length} achievements`);
  } else {
    console.log(`ℹ️  Achievements already seeded, skipping`);
  }

  // ── QUESTIONS ─────────────────────────────────────────────────────────────
  const questions = [
    // PROGRAMMING BASICS
    { category: 'programming_basics', difficulty: 'easy',   xp_reward: 10, question_text: 'What does the acronym "CPU" stand for?', option_a: 'Central Processing Unit', option_b: 'Core Program Utility', option_c: 'Central Program Unit', option_d: 'Computer Processing Unit', correct_option: 'a', explanation: 'CPU stands for Central Processing Unit — the "brain" of the computer that executes instructions.' },
    { category: 'programming_basics', difficulty: 'easy',   xp_reward: 10, question_text: 'Which of the following is NOT a programming language?', option_a: 'Java', option_b: 'Python', option_c: 'HTML', option_d: 'Cobra', correct_option: 'c', explanation: 'HTML is a markup language, not a programming language — it describes structure, not logic.' },
    { category: 'programming_basics', difficulty: 'easy',   xp_reward: 10, question_text: 'What is a variable?', option_a: 'A fixed constant value', option_b: 'A named storage location in memory', option_c: 'A type of loop', option_d: 'A function parameter', correct_option: 'b', explanation: 'A variable is a named container that stores a value in memory which can change during program execution.' },
    { category: 'programming_basics', difficulty: 'medium', xp_reward: 20, question_text: 'What is the time complexity of a linear search algorithm?', option_a: 'O(1)', option_b: 'O(log n)', option_c: 'O(n)', option_d: 'O(n²)', correct_option: 'c', explanation: 'Linear search checks each element one by one — in the worst case it visits all n elements: O(n).' },
    { category: 'programming_basics', difficulty: 'medium', xp_reward: 20, question_text: 'Which data structure uses LIFO (Last In, First Out) principle?', option_a: 'Queue', option_b: 'Stack', option_c: 'Linked List', option_d: 'Tree', correct_option: 'b', explanation: 'A Stack follows LIFO — the last element pushed is the first one popped.' },
    { category: 'programming_basics', difficulty: 'hard',   xp_reward: 30, question_text: 'What is the difference between a compiler and an interpreter?', option_a: 'A compiler runs code line by line; interpreter translates all at once', option_b: 'A compiler translates the whole program before execution; interpreter translates and executes line by line', option_c: 'Both do the same thing', option_d: 'Compiler is faster at runtime always', correct_option: 'b', explanation: 'Compilers translate entire source code to machine code before execution. Interpreters translate and execute line-by-line.' },
    // ARRAYS
    { category: 'arrays', difficulty: 'easy',   xp_reward: 10, question_text: 'What is the index of the first element in an array?', option_a: '1', option_b: '-1', option_c: '0', option_d: 'Depends on array size', correct_option: 'c', explanation: 'In most languages (C, Java, Python), arrays are 0-indexed — the first element is at index 0.' },
    { category: 'arrays', difficulty: 'easy',   xp_reward: 10, question_text: 'What is the time complexity of accessing an element by index in an array?', option_a: 'O(n)', option_b: 'O(log n)', option_c: 'O(n²)', option_d: 'O(1)', correct_option: 'd', explanation: 'Array access by index is O(1) — constant time — because elements are in contiguous memory.' },
    { category: 'arrays', difficulty: 'medium', xp_reward: 20, question_text: 'What does "two-pointer technique" in arrays typically solve?', option_a: 'Sorting arrays', option_b: 'Finding pairs with a target sum efficiently', option_c: 'Reversing an array', option_d: 'Finding duplicate elements', correct_option: 'b', explanation: 'Two-pointer uses two indices moving toward each other to find pairs efficiently — reduces O(n²) to O(n).' },
    { category: 'arrays', difficulty: 'medium', xp_reward: 20, question_text: 'What is the worst-case time complexity of Bubble Sort?', option_a: 'O(n log n)', option_b: 'O(n)', option_c: 'O(n²)', option_d: 'O(log n)', correct_option: 'c', explanation: 'Bubble Sort compares adjacent elements repeatedly. Worst case (reverse sorted): O(n²) comparisons.' },
    { category: 'arrays', difficulty: 'hard',   xp_reward: 30, question_text: "What is Kadane's Algorithm used for?", option_a: 'Sorting in O(n log n)', option_b: 'Finding the maximum subarray sum', option_c: 'Binary search in rotated arrays', option_d: 'Merging two sorted arrays', correct_option: 'b', explanation: "Kadane's Algorithm finds the contiguous subarray with maximum sum in O(n) time using a running maximum." },
    { category: 'arrays', difficulty: 'hard',   xp_reward: 30, question_text: 'What is the time complexity of Merge Sort?', option_a: 'O(n²)', option_b: 'O(n)', option_c: 'O(n log n)', option_d: 'O(log n)', correct_option: 'c', explanation: 'Merge Sort: log n levels of division, O(n) merging at each level = O(n log n). Stable sort.' },
    // STRINGS
    { category: 'strings', difficulty: 'easy',   xp_reward: 10, question_text: 'What function returns the length of a string in Python?', option_a: 'str.count()', option_b: 'len()', option_c: 'str.size()', option_d: 'str.length()', correct_option: 'b', explanation: 'In Python, len("hello") returns 5. In Java you use .length(), but Python uses the built-in len().' },
    { category: 'strings', difficulty: 'easy',   xp_reward: 10, question_text: 'What is a palindrome?', option_a: 'A string with all unique characters', option_b: 'A string that reads the same forwards and backwards', option_c: 'A string with no vowels', option_d: 'A string with alternating case', correct_option: 'b', explanation: '"racecar" and "madam" are palindromes — they read the same forwards and backwards.' },
    { category: 'strings', difficulty: 'medium', xp_reward: 20, question_text: 'What is the time complexity of checking if two strings are anagrams using sorting?', option_a: 'O(n)', option_b: 'O(n²)', option_c: 'O(n log n)', option_d: 'O(1)', correct_option: 'c', explanation: 'Sort both strings O(n log n), then compare. Using a frequency map reduces it to O(n).' },
    { category: 'strings', difficulty: 'hard',   xp_reward: 30, question_text: 'What is the output of: "hello"[::-1] in Python?', option_a: '"hello"', option_b: '"olleh"', option_c: '"h"', option_d: 'Error', correct_option: 'b', explanation: '[::-1] is a Python slice that steps backwards, reversing the string. "hello"[::-1] = "olleh".' },
    // OOP
    { category: 'oop', difficulty: 'easy',   xp_reward: 10, question_text: 'What does OOP stand for?', option_a: 'Object-Oriented Programming', option_b: 'Open Object Platform', option_c: 'Ordered Object Process', option_d: 'Operational Output Protocol', correct_option: 'a', explanation: 'OOP = Object-Oriented Programming — a paradigm based on objects that bundle data and behavior.' },
    { category: 'oop', difficulty: 'easy',   xp_reward: 10, question_text: 'Which OOP concept allows a class to inherit properties from another class?', option_a: 'Encapsulation', option_b: 'Polymorphism', option_c: 'Inheritance', option_d: 'Abstraction', correct_option: 'c', explanation: 'Inheritance lets a child class reuse and extend properties/methods of a parent class (e.g., Dog extends Animal).' },
    { category: 'oop', difficulty: 'medium', xp_reward: 20, question_text: 'What is method overriding?', option_a: 'Defining multiple methods with the same name but different parameters', option_b: 'A child class providing a specific implementation for a parent class method', option_c: 'Calling a parent method from a child class', option_d: 'Making a method private', correct_option: 'b', explanation: 'Method overriding: a subclass redefines a parent method to change or extend its behavior.' },
    { category: 'oop', difficulty: 'hard',   xp_reward: 30, question_text: 'What is the SOLID principle "D" (Dependency Inversion)?', option_a: 'High-level modules should not depend on low-level modules; both should depend on abstractions', option_b: 'A class should have only one reason to change', option_c: 'Classes should be open for extension but closed for modification', option_d: 'Objects of a superclass should be replaceable with subclass objects', correct_option: 'a', explanation: 'DIP: depend on interfaces/abstractions, not concrete implementations. Makes code more modular and testable.' },
    // DBMS
    { category: 'dbms', difficulty: 'easy',   xp_reward: 10, question_text: 'What does SQL stand for?', option_a: 'Structured Query Language', option_b: 'Simple Query Logic', option_c: 'System Query Layer', option_d: 'Secure Query Language', correct_option: 'a', explanation: 'SQL = Structured Query Language — the standard language for managing relational databases.' },
    { category: 'dbms', difficulty: 'easy',   xp_reward: 10, question_text: 'Which SQL command is used to retrieve data from a table?', option_a: 'INSERT', option_b: 'UPDATE', option_c: 'SELECT', option_d: 'FETCH', correct_option: 'c', explanation: 'SELECT retrieves data. Example: SELECT * FROM users; returns all rows from the users table.' },
    { category: 'dbms', difficulty: 'medium', xp_reward: 20, question_text: 'What is a PRIMARY KEY?', option_a: 'A key that can have duplicate values', option_b: 'A unique identifier for each row that cannot be NULL', option_c: 'A foreign key reference', option_d: 'A key used only for indexing', correct_option: 'b', explanation: 'A PRIMARY KEY uniquely identifies each record in a table. It must be unique and cannot be NULL.' },
    { category: 'dbms', difficulty: 'hard',   xp_reward: 30, question_text: 'What does ACID stand for in database transactions?', option_a: 'Accuracy, Consistency, Isolation, Durability', option_b: 'Atomicity, Consistency, Isolation, Durability', option_c: 'Atomicity, Completeness, Integrity, Durability', option_d: 'Accuracy, Completeness, Isolation, Dependency', correct_option: 'b', explanation: 'ACID: Atomicity (all or nothing), Consistency (valid state), Isolation (no interference), Durability (committed = permanent).' },
    // OS
    { category: 'os', difficulty: 'easy',   xp_reward: 10, question_text: 'What is an operating system?', option_a: 'A programming language', option_b: 'System software that manages hardware and provides services for applications', option_c: 'A type of database', option_d: 'An internet browser', correct_option: 'b', explanation: 'An OS (Windows, Linux, macOS) manages CPU, memory, storage, and I/O as an intermediary between hardware and software.' },
    { category: 'os', difficulty: 'easy',   xp_reward: 10, question_text: 'What is a process?', option_a: 'A program stored on disk', option_b: 'An instance of a program in execution', option_c: 'A type of memory', option_d: 'A CPU instruction', correct_option: 'b', explanation: 'A process is a program in execution with its own memory space, CPU state, and resources.' },
    { category: 'os', difficulty: 'medium', xp_reward: 20, question_text: 'What is a deadlock?', option_a: 'When two processes compete for CPU time', option_b: 'When a process runs out of memory', option_c: 'A situation where two or more processes wait for each other indefinitely', option_d: 'When the OS crashes', correct_option: 'c', explanation: 'Deadlock: Process A holds Resource 1 and waits for Resource 2; Process B holds Resource 2 and waits for Resource 1. Circular wait!' },
    { category: 'os', difficulty: 'hard',   xp_reward: 30, question_text: 'What is the difference between a thread and a process?', option_a: 'No difference', option_b: 'A thread is heavier than a process', option_c: 'A process is independent with its own memory; a thread is lightweight and shares process memory', option_d: 'A process exists only in user space', correct_option: 'c', explanation: 'Processes: independent memory. Threads within a process share memory, making communication easier but needing synchronization.' },
    // APTITUDE
    { category: 'aptitude', difficulty: 'easy',   xp_reward: 10, question_text: 'If a train travels 60 km in 1 hour, how far will it travel in 2.5 hours?', option_a: '100 km', option_b: '120 km', option_c: '150 km', option_d: '180 km', correct_option: 'c', explanation: 'Distance = Speed × Time = 60 × 2.5 = 150 km.' },
    { category: 'aptitude', difficulty: 'easy',   xp_reward: 10, question_text: 'What is 15% of 200?', option_a: '25', option_b: '30', option_c: '35', option_d: '40', correct_option: 'b', explanation: '15% of 200 = (15/100) × 200 = 30.' },
    { category: 'aptitude', difficulty: 'medium', xp_reward: 20, question_text: 'A can do a work in 10 days, B can do it in 15 days. How many days to finish together?', option_a: '4 days', option_b: '5 days', option_c: '6 days', option_d: '8 days', correct_option: 'c', explanation: "A's rate = 1/10, B's rate = 1/15. Combined = 1/10 + 1/15 = 5/30 = 1/6. So 6 days." },
    { category: 'aptitude', difficulty: 'hard',   xp_reward: 30, question_text: 'A clock shows 3:15. What is the angle between the hour and minute hands?', option_a: '0°', option_b: '7.5°', option_c: '15°', option_d: '22.5°', correct_option: 'b', explanation: 'Minute hand at 15 min = 90°. Hour hand at 3:15 = 3×30 + 15×0.5 = 97.5°. Angle = 97.5 - 90 = 7.5°.' },
  ];

  const existingQuestions = dbAll('SELECT id FROM questions', []);
  if (existingQuestions.length === 0) {
    for (const q of questions) {
      dbRun(
        'INSERT INTO questions (category, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, xp_reward) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [q.category, q.difficulty, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.explanation, q.xp_reward]
      );
    }
    console.log(`✅ Seeded ${questions.length} questions`);
  } else {
    console.log(`ℹ️  Questions already seeded (${existingQuestions.length} found), skipping`);
  }

  console.log('\n🎮 Seeding complete! Run "npm run dev" to start the server.');
}

seed().catch(console.error);
