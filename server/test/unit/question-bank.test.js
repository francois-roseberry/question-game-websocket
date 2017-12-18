const expect = require('chai').expect;

const QuestionBank = require('../../src/question-bank').QuestionBank;

describe('Question bank', () => {
  let bank;

  beforeEach(() => {
    bank = new QuestionBank([
      { question: '1 + 1', answer: '2' },
      { question: '2 + 2', answer: '4' }
    ]);
  });

  it('has a size', () => {
    expect(bank.size()).to.eql(2);
  });

  describe('initially', () => {
    it('is positionned on the first question', () => {
      expect(bank.currentQuestion().index).to.eql(0);
      expect(bank.currentQuestion().question).to.eql('1 + 1');
      expect(bank.currentQuestion().answer).to.eql('2');
    });

    it('is not completed', () => {
      expect(bank.isCompleted()).to.eql(false);
    });
  });

  describe('after moving to the next question', () => {
    beforeEach(() => {
      bank.nextQuestion();
    });

    it('is positionned on the second question', () => {
      expect(bank.currentQuestion().index).to.eql(1);
      expect(bank.currentQuestion().question).to.eql('2 + 2');
      expect(bank.currentQuestion().answer).to.eql('4');
    });

    it('is not completed', () => {
      expect(bank.isCompleted()).to.eql(false);
    });
  });

  describe('after moving past the last question', () => {
    beforeEach(() => {
      bank.nextQuestion();
      bank.nextQuestion();
    });

    it('is completed', () => {
      expect(bank.isCompleted()).to.eql(true);
    });
  });
});
