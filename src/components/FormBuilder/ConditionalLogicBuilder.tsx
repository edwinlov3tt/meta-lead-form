import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Download, X } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';

interface ConditionalQuestion {
  id: string;
  question: string;
  answers: string[];
  nextQuestions: { [answer: string]: string }; // answer -> next question id
}

interface ConditionalLogicBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questions: ConditionalQuestion[]) => void;
}

export const ConditionalLogicBuilder: React.FC<ConditionalLogicBuilderProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [questions, setQuestions] = useState<ConditionalQuestion[]>([
    {
      id: '1',
      question: '',
      answers: ['', ''],
      nextQuestions: {}
    }
  ]);

  const addQuestion = () => {
    const newId = (questions.length + 1).toString();
    setQuestions([...questions, {
      id: newId,
      question: '',
      answers: ['', ''],
      nextQuestions: {}
    }]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: string, value: unknown) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const addAnswer = (questionId: string) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? { ...q, answers: [...q.answers, ''] }
        : q
    ));
  };

  const removeAnswer = (questionId: string, answerIndex: number) => {
    setQuestions(questions.map(q =>
      q.id === questionId && q.answers.length > 2
        ? {
            ...q,
            answers: q.answers.filter((_, idx) => idx !== answerIndex),
            nextQuestions: Object.fromEntries(
              Object.entries(q.nextQuestions).filter(([answer]) =>
                answer !== q.answers[answerIndex]
              )
            )
          }
        : q
    ));
  };

  const updateAnswer = (questionId: string, answerIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newAnswers = [...q.answers];
        const oldAnswer = newAnswers[answerIndex];
        newAnswers[answerIndex] = value;

        // Update nextQuestions mapping if answer text changed
        const newNextQuestions = { ...q.nextQuestions };
        if (oldAnswer && newNextQuestions[oldAnswer]) {
          newNextQuestions[value] = newNextQuestions[oldAnswer];
          delete newNextQuestions[oldAnswer];
        }

        return { ...q, answers: newAnswers, nextQuestions: newNextQuestions };
      }
      return q;
    }));
  };

  const setNextQuestion = (questionId: string, answer: string, nextQuestionId: string) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? {
            ...q,
            nextQuestions: {
              ...q.nextQuestions,
              [answer]: nextQuestionId === 'end' ? 'end' : nextQuestionId
            }
          }
        : q
    ));
  };

  const generateCSV = () => {
    let csv = 'Question,Answer,Next Question\n';

    questions.forEach(question => {
      if (question.question.trim()) {
        question.answers.forEach(answer => {
          if (answer.trim()) {
            const nextQuestion = question.nextQuestions[answer] || 'end';
            const nextQuestionText = nextQuestion === 'end'
              ? 'End'
              : questions.find(q => q.id === nextQuestion)?.question || 'End';
            csv += `"${question.question}","${answer}","${nextQuestionText}"\n`;
          }
        });
      }
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conditional-logic.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    onSave(questions);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Conditional Logic Builder" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-surface-900">Build Conditional Questions</h4>
            <p className="text-sm text-surface-600 mt-1">
              Create a question flow where answers determine the next question shown to users.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {questions.map((question, index) => (
            <Card key={question.id} className="p-4">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-surface-400 cursor-move" />
                  <span className="font-medium text-surface-900">
                    Question {index + 1}
                  </span>
                </div>
                <Button
                  onClick={() => removeQuestion(question.id)}
                  variant="ghost"
                  size="icon"
                  disabled={questions.length === 1}
                  title="Remove question"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>

              {/* Question Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Question Text
                </label>
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                  className="form-input w-full"
                  placeholder="Enter your question..."
                />
              </div>

              {/* Answers */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-surface-700">
                  Answer Options & Logic
                </label>

                {question.answers.map((answer, answerIndex) => (
                  <div key={answerIndex} className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => updateAnswer(question.id, answerIndex, e.target.value)}
                        className="form-input w-full mb-2"
                        placeholder={`Answer option ${answerIndex + 1}`}
                      />

                      {/* Next Question Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-surface-600">Then show:</span>
                        <select
                          value={question.nextQuestions[answer] || 'end'}
                          onChange={(e) => setNextQuestion(question.id, answer, e.target.value)}
                          className="form-select text-xs flex-1"
                          disabled={!answer.trim()}
                        >
                          <option value="end">End form</option>
                          {questions
                            .filter(q => q.id !== question.id)
                            .map(q => (
                              <option key={q.id} value={q.id}>
                                Question {questions.findIndex(qu => qu.id === q.id) + 1}: {q.question || 'Untitled'}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button
                        onClick={() => removeAnswer(question.id, answerIndex)}
                        variant="outline"
                        size="icon"
                        disabled={question.answers.length <= 2}
                        title="Remove answer"
                        className="h-8 w-8"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      {answerIndex === question.answers.length - 1 && (
                        <Button
                          onClick={() => addAnswer(question.id)}
                          variant="outline"
                          size="icon"
                          title="Add answer"
                          className="h-8 w-8"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Add Question Button */}
        <Button onClick={addQuestion} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Conditional Logic
          </Button>
        </div>
      </div>
    </Modal>
  );
};