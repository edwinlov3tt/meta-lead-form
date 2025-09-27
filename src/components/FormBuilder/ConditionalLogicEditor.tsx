import React, { useState } from 'react';
import { Plus, Minus, ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import {
  MCAnswer,
  LogicAction,
  LogicActionType,
  EndPage,
  SAMPLE_QUESTIONS
} from '@/types/conditionalLogic';
import { Qualifier } from '@/types/form';
import { useFormStore } from '@/stores/formStore';
import { generateId } from '@/utils/helpers';

// Logic Dropdown Component
interface LogicDropdownProps {
  answer: MCAnswer;
  onLogicChange: (logic: LogicAction | undefined) => void;
  otherQuestions: Qualifier[];
  endPages: EndPage[];
}

const LogicDropdown: React.FC<LogicDropdownProps> = ({
  answer,
  onLogicChange,
  otherQuestions,
  endPages
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getLogicDisplayText = (logic?: LogicAction) => {
    if (!logic) return 'Choose next step';

    switch (logic.type) {
      case 'GO_TO_QUESTION':
        const question = otherQuestions.find(q => q.id === logic.nextQuestionId);
        return question ? `Q${question.order + 1} ${question.question.substring(0, 30)}...` : 'Choose next step';
      case 'SUBMIT_FORM':
        const endPage = endPages.find(e => e.id === logic.endPageId);
        return endPage ? `End: ${endPage.name}` : 'Choose next step';
      case 'CLOSE_FORM':
        return 'Close form';
      default:
        return 'Choose next step';
    }
  };

  const handleOptionSelect = (type: LogicActionType, targetId?: string) => {
    const action: LogicAction = { type };

    if (type === 'GO_TO_QUESTION' && targetId) {
      action.nextQuestionId = targetId;
    } else if (type === 'SUBMIT_FORM' && targetId) {
      action.endPageId = targetId;
    }

    onLogicChange(action);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-surface-200 rounded-lg hover:bg-surface-50 min-w-[200px] text-left"
      >
        <span className="text-sm truncate flex-1">
          {getLogicDisplayText(answer.logic)}
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-surface-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {/* Go to Question option */}
            <div className="py-2 px-3 hover:bg-surface-50 rounded cursor-pointer">
              <div className="font-medium text-sm">Go to a question</div>
              <div className="text-xs text-surface-500 mt-1">Route to another question</div>
              {otherQuestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {otherQuestions.map(q => (
                    <button
                      key={q.id}
                      onClick={() => handleOptionSelect('GO_TO_QUESTION', q.id)}
                      className="block w-full text-left px-2 py-1 text-xs bg-surface-50 hover:bg-surface-100 rounded"
                    >
                      Q{q.order + 1}: {q.question.substring(0, 40)}...
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Form option */}
            <div className="py-2 px-3 hover:bg-surface-50 rounded cursor-pointer">
              <div className="font-medium text-sm">Submit form</div>
              <div className="text-xs text-surface-500 mt-1">End the form with thank you page</div>
              {endPages.length > 0 && (
                <div className="mt-2 space-y-1">
                  {endPages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => handleOptionSelect('SUBMIT_FORM', page.id)}
                      className="block w-full text-left px-2 py-1 text-xs bg-surface-50 hover:bg-surface-100 rounded"
                    >
                      {page.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Close Form option */}
            <button
              onClick={() => handleOptionSelect('CLOSE_FORM')}
              className="w-full py-2 px-3 hover:bg-surface-50 rounded cursor-pointer text-left"
            >
              <div className="font-medium text-sm">Close form</div>
              <div className="text-xs text-surface-500 mt-1">Exit without submitting</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface ConditionalLogicEditorProps {
  questionId: string;
  questionLabel: string;
  answers: MCAnswer[];
  conditionalLogicEnabled: boolean;
  onAnswersUpdate: (answers: MCAnswer[]) => void;
  onQuestionUpdate: (label: string) => void;
  onLogicToggle: (enabled: boolean) => void;
}

export const ConditionalLogicEditor: React.FC<ConditionalLogicEditorProps> = ({
  questionId,
  questionLabel,
  answers,
  conditionalLogicEnabled,
  onAnswersUpdate,
  onQuestionUpdate,
  onLogicToggle
}) => {
  const { activeForm } = useFormStore();
  const [applyToAll, setApplyToAll] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [sidePanelConfig, setSidePanelConfig] = useState<{
    answerId: string;
    actionType: LogicActionType;
  } | null>(null);

  const otherQuestions = activeForm?.qualifiers.filter(q => q.id !== questionId) || [];
  const endPages = activeForm?.endPages || [];

  const handleAddAnswer = (afterIndex?: number) => {
    const newAnswer: MCAnswer = {
      id: generateId(),
      label: '',
      order: afterIndex !== undefined ? afterIndex + 1 : answers.length,
    };

    const updatedAnswers = [...answers];
    if (afterIndex !== undefined) {
      updatedAnswers.splice(afterIndex + 1, 0, newAnswer);
    } else {
      updatedAnswers.push(newAnswer);
    }

    // Reorder
    updatedAnswers.forEach((ans, idx) => {
      ans.order = idx;
    });

    onAnswersUpdate(updatedAnswers);
  };

  const handleRemoveAnswer = (answerId: string) => {
    const updatedAnswers = answers.filter(a => a.id !== answerId);
    updatedAnswers.forEach((ans, idx) => {
      ans.order = idx;
    });
    onAnswersUpdate(updatedAnswers);
  };

  const handleAnswerUpdate = (answerId: string, label: string) => {
    const updatedAnswers = answers.map(a =>
      a.id === answerId ? { ...a, label } : a
    );
    onAnswersUpdate(updatedAnswers);
  };

  const handleLogicChange = (answerId: string, action: LogicAction | undefined) => {
    let updatedAnswers = answers.map(a =>
      a.id === answerId ? { ...a, logic: action } : a
    );

    // Apply to all below if checkbox is checked and this is the first answer
    if (applyToAll && answers[0]?.id === answerId && action) {
      let skipped = 0;
      updatedAnswers = updatedAnswers.map((a, idx) => {
        if (idx > 0 && !a.logic) {
          return { ...a, logic: action };
        } else if (idx > 0 && a.logic) {
          skipped++;
        }
        return a;
      });

      if (skipped > 0) {
        // Show toast notification (simplified for now)
      }
    }

    onAnswersUpdate(updatedAnswers);
  };

  const handleSampleQuestion = (sampleKey: keyof typeof SAMPLE_QUESTIONS) => {
    const sample = SAMPLE_QUESTIONS[sampleKey];
    onQuestionUpdate(sample.label);

    const newAnswers = sample.answers.map((label, idx) => ({
      id: generateId(),
      label,
      order: idx,
    }));

    onAnswersUpdate(newAnswers);
  };

  const openSidePanel = (answerId: string, actionType: LogicActionType) => {
    setSidePanelConfig({ answerId, actionType });
    setShowSidePanel(true);
  };

  const handleSelectTarget = (targetId: string) => {
    if (!sidePanelConfig) return;

    const action: LogicAction = {
      type: sidePanelConfig.actionType,
    };

    if (sidePanelConfig.actionType === 'GO_TO_QUESTION') {
      action.nextQuestionId = targetId;
    } else if (sidePanelConfig.actionType === 'SUBMIT_FORM') {
      action.endPageId = targetId;
    }

    handleLogicChange(sidePanelConfig.answerId, action);
    setShowSidePanel(false);
    setSidePanelConfig(null);
  };


  return (
    <div className="space-y-4">
      {/* Sample Questions */}
      <div className="space-y-2">
        <p className="text-sm text-surface-600">Sample questions</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(SAMPLE_QUESTIONS).map(key => (
            <button
              key={key}
              onClick={() => handleSampleQuestion(key as keyof typeof SAMPLE_QUESTIONS)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                key === 'habits' ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 hover:bg-surface-200'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Answers Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <h4 className="text-sm font-medium">Answers</h4>
          {conditionalLogicEnabled && <h4 className="text-sm font-medium ml-auto">Logic</h4>}
        </div>

        {answers.map((answer, idx) => (
          <div key={answer.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={answer.label}
                onChange={(e) => handleAnswerUpdate(answer.id, e.target.value)}
                className="flex-1 px-3 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder={`Answer ${idx + 1}`}
              />

              {conditionalLogicEnabled && (
                <LogicDropdown
                  answer={answer}
                  onLogicChange={(logic) => handleLogicChange(answer.id, logic)}
                  otherQuestions={otherQuestions}
                  endPages={endPages}
                />
              )}

              <button
                onClick={() => handleRemoveAnswer(answer.id)}
                className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
                disabled={answers.length <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleAddAnswer(idx)}
                className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Apply to all checkbox - only show under first answer when logic is enabled */}
            {conditionalLogicEnabled && idx === 0 && answers.length > 1 && (
              <div className="ml-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={applyToAll}
                    onChange={(e) => setApplyToAll(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-surface-600">
                    Apply this logic to all answers below
                  </span>
                </label>
              </div>
            )}
          </div>
        ))}

        {/* Add new answer button */}
        {answers.length === 0 && (
          <button
            onClick={() => handleAddAnswer()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add answer
          </button>
        )}
      </div>

      {/* Conditional Logic Toggle */}
      <div className="pt-4 border-t border-surface-200">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={conditionalLogicEnabled}
            onChange={(e) => onLogicToggle(e.target.checked)}
            className="rounded text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="font-medium">Enable Conditional Logic</span>
            <p className="text-sm text-surface-600">
              Route users to different questions based on their answers
            </p>
          </div>
        </label>

        {!conditionalLogicEnabled && (
          <p className="text-sm text-surface-500 mt-2 ml-7">
            Upload CSV to enable conditional logic (optional)
          </p>
        )}
      </div>
    </div>
  );
};