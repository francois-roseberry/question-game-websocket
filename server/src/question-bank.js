class QuestionBank {
  constructor(questions) {
    this._questions = questions;
    this._index = 0;
  }

  static read(data) {
    return new QuestionBank(JSON.parse(data));
  }

  currentQuestion() {
    return {
      index: this._index,
      question: this._questions[this._index].question,
      answer: this._questions[this._index].answer
    };
  }

  nextQuestion() {
    this._index++;
  }

  isCompleted() {
    return this._index === this._questions.length;
  }

  size() {
    return this._questions.length;
  }
}

exports.QuestionBank = QuestionBank;
