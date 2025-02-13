class GerundInfinitiveGame {
  constructor() {
    this.questions = [];
    this.score = 0;
    this.currentLevel = 1;
    this.originalQuestions = [];
  }

  async loadQuestions() {
    try {
      const SHEET_URL = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://docs.google.com/spreadsheets/d/e/2PACX-1vSbt7-FWr5-NCyLfpSAK_zxdk5WubuCzTsFO7v014yZY1zpSxUzkCKkv49SIKn5XsmDCQMzlGLtWdbV/pub?gid=0&single=true&output=csv');
      
      console.log('Fetching from URL:', SHEET_URL);
      const response = await fetch(SHEET_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      console.log('Raw CSV data:', csvText.substring(0, 500)); // Show first 500 chars of data
      
      this.questions = csvText.split('\n')
        .slice(1) // Skip header row
        .map(row => {
          const [sentence, rule, correctAnswer, wrongAnswer] = row.split(',').map(cell => cell?.trim() || '');
          console.log('Parsed row:', { sentence, rule, correctAnswer, wrongAnswer }); // Debug log
          
          if (sentence && rule && correctAnswer && wrongAnswer) {
            const questionSentence = sentence.replace(correctAnswer, '_____');
            return {
              sentence: questionSentence,
              originalSentence: sentence,
              correctAnswer: correctAnswer,
              wrongAnswer: wrongAnswer,
              rule: rule
            };
          }
          return null;
        })
        .filter(q => q !== null);
      
      this.originalQuestions = [...this.questions];
      
      console.log('Loaded questions with rules:', 
        [...new Set(this.questions.map(q => q.rule))]);
    } catch (error) {
      console.error('Error loading questions:', error);
      // Fallback questions
      this.questions = [
        { 
          sentence: "_____ (run) energizes the body and mind.", 
          originalSentence: "Running energizes the body and mind.",
          correctAnswer: "gerund",
          wrongAnswer: "infinitive",
          rule: "Gerund as Subject"
        }
      ];
    }
  }

  findMainVerb(sentence) {
    const commonVerbs = ['enjoy', 'want', 'like', 'love', 'prefer', 'plan', 'hope', 'need', 'try', 'start'];
    for (let verb of commonVerbs) {
      if (sentence.toLowerCase().includes(verb)) {
        return verb;
      }
    }
    return '';
  }

  resetGame() {
    this.score = 0;
    this.currentLevel = 1;
    this.shuffleQuestions();
  }

  shuffleQuestions() {
    for (let i = this.questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
    }
  }

  getNextQuestion() {
    if (this.currentLevel > this.questions.length) {
      return {
        gameOver: true,
        finalScore: this.score,
        totalQuestions: this.questions.length
      };
    }

    return {
      ...this.questions[this.currentLevel - 1],
      questionNumber: this.currentLevel,
      totalQuestions: this.questions.length,
      currentScore: this.score
    };
  }

  getAnswerOptions() {
    const currentQuestion = this.questions[this.currentLevel - 1];
    if (!currentQuestion) {
      console.error('No current question found in getAnswerOptions');
      return {
        firstButton: 'Error',
        secondButton: 'Error'
      };
    }

    // Randomly decide which button gets the correct answer
    const isFirstButtonCorrect = Math.random() < 0.5;
    
    return {
      firstButton: isFirstButtonCorrect ? currentQuestion.correctAnswer : currentQuestion.wrongAnswer,
      secondButton: isFirstButtonCorrect ? currentQuestion.wrongAnswer : currentQuestion.correctAnswer,
      correctButton: isFirstButtonCorrect ? 'first' : 'second'
    };
  }

  checkAnswer(answer) {
    try {
      const currentQuestion = this.questions[this.currentLevel - 1];
      if (!currentQuestion) {
        console.error('No current question found');
        return {
          isCorrect: false,
          feedback: 'Error: No question found'
        };
      }

      // For "Verb + Gerund OR Infinitive" rule, always mark as correct
      const isCorrect = currentQuestion.rule === "Verb + Gerund OR Infinitive" ? true : 
                       answer === currentQuestion.correctAnswer;

      console.log('Rule:', currentQuestion.rule); // Debug log
      console.log('Answer given:', answer); // Debug log
      console.log('Is OR rule:', currentQuestion.rule === "Verb + Gerund OR Infinitive"); // Debug log
      console.log('Is correct:', isCorrect); // Debug log
      
      if (isCorrect) {
        this.score += 1;
      }
      this.currentLevel += 1;

      // Create sentence with bold correct answer
      const sentenceWithBold = currentQuestion.originalSentence.replace(
        currentQuestion.correctAnswer,
        `**${currentQuestion.correctAnswer}**`
      );

      let feedback;
      if (currentQuestion.rule === "Verb + Gerund OR Infinitive") {
        feedback = `✅ Both forms are correct for this verb!\n\n${sentenceWithBold}\n\n**Rule:** ${currentQuestion.rule}`;
      } else {
        feedback = isCorrect 
          ? `✅ ${sentenceWithBold}\n\n**Rule:** ${currentQuestion.rule}` 
          : `❌ ${sentenceWithBold}\n\n**Rule:** ${currentQuestion.rule}`;
      }

      return { isCorrect, feedback };
    } catch (error) {
      console.error('Error in checkAnswer:', error);
      return {
        isCorrect: false,
        feedback: 'Error checking answer'
      };
    }
  }

  submitAnswer(answer) {
    const result = this.checkAnswer(answer);
    
    return {
      ...result,
      nextQuestion: this.getNextQuestion()
    };
  }

  startGame(mode) {
    this.score = 0;
    this.currentLevel = 1;
    
    this.questions = [...this.originalQuestions];
    
    if (mode === 'verbsOnly') {
        console.log('Total questions before filtering:', this.questions.length);
        
        this.questions = this.questions.filter(q => {
            const isVerbRule = q.rule.toLowerCase().includes('verb');
            if (isVerbRule) {
                console.log('Including question with rule:', q.rule);
            }
            return isVerbRule;
        });
        
        // Count questions per rule type
        const ruleCounts = this.questions.reduce((acc, q) => {
            acc[q.rule] = (acc[q.rule] || 0) + 1;
            return acc;
        }, {});
        
        console.log('Questions per rule:', ruleCounts);
        console.log(`Total verb-only questions loaded: ${this.questions.length}`);
    }
    
    this.shuffleQuestions();
    return this.getNextQuestion();
  }
}

const game = new GerundInfinitiveGame();
const firstQuestion = game.startGame();

// When player submits an answer:
const result = game.submitAnswer("enjoy");
if (result.isCorrect) {
  console.log("Correct!", result.feedback);
  if (result.nextQuestion.gameOver) {
    console.log(`Game Over! Final score: ${result.nextQuestion.finalScore}/${result.nextQuestion.totalQuestions}`);
  } else {
    console.log("Next question:", result.nextQuestion);
  }
} else {
  console.log("Incorrect!", result.feedback);
}
