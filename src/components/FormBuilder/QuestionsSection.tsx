import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Minus, Calendar, DollarSign, Clock, List, Activity, GraduationCap } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useFormStore } from '@/stores/formStore';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { ConditionalLogicBuilder } from './ConditionalLogicBuilder';
import { SAMPLE_QUESTIONS } from '@/types/conditionalLogic';
import { AddIconButton, RemoveIconButton, DeleteIconButton, DragHandleButton } from '@/components/UI/MetaIconButton';
import { LogicPill } from '@/components/UI/LogicPill';
import { Qualifier } from '@/types/form';

// Extended qualifier type that includes UI-specific properties
interface ExtendedQualifier extends Qualifier {
  conditionalLogicEnabled?: boolean;
}

// Conditional Logic Section Component
interface ConditionalLogicSectionProps {
  qualifier: ExtendedQualifier;
  onUpdateQuestion: (id: string, field: keyof ExtendedQualifier, value: unknown) => void;
  onAddOption: (questionId: string) => void;
  onRemoveOption: (questionId: string, optionIndex: number) => void;
  onUpdateOption: (questionId: string, optionIndex: number, value: string) => void;
}

const ConditionalLogicSection: React.FC<ConditionalLogicSectionProps> = ({
  qualifier,
  onUpdateQuestion,
  onAddOption,
  onRemoveOption,
  onUpdateOption
}) => {
  const conditionalLogicEnabled = qualifier.conditionalLogicEnabled || false;

  const handleSampleQuestion = (sampleKey: keyof typeof SAMPLE_QUESTIONS) => {
    const sample = SAMPLE_QUESTIONS[sampleKey];
    onUpdateQuestion(qualifier.id, 'question', sample.label);
    onUpdateQuestion(qualifier.id, 'options', sample.answers);
  };

  const handleSampleQuestionDoubleClick = (sampleKey: keyof typeof SAMPLE_QUESTIONS) => {
    // Clear the question when double-clicked
    onUpdateQuestion(qualifier.id, 'question', '');
    onUpdateQuestion(qualifier.id, 'options', ['', '', '']);
  };

  const isQuestionActive = (sampleKey: keyof typeof SAMPLE_QUESTIONS) => {
    const sample = SAMPLE_QUESTIONS[sampleKey];
    return qualifier.question === sample.label;
  };

  const getSampleQuestionIcon = (key: string) => {
    switch (key) {
      case 'budget': return <DollarSign className="w-3 h-3" />;
      case 'timeline': return <Clock className="w-3 h-3" />;
      case 'needs': return <List className="w-3 h-3" />;
      case 'habits': return <Activity className="w-3 h-3" />;
      case 'education': return <GraduationCap className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-sp-4">
      {/* Answers Section Header */}
      <div>
        <h4 className="text-16 font-semibold text-text-primary">Answers</h4>
        <p className="text-12 text-text-secondary">
          Route users to different questions based on their answers
        </p>
      </div>

      {/* Sample Questions with icons */}
      <div className="space-y-sp-2">
        <p className="text-14 font-medium text-text-primary">Sample questions</p>
        <div className="flex flex-wrap gap-sp-2">
          {Object.keys(SAMPLE_QUESTIONS).map(key => (
            <button
              key={key}
              onClick={() => handleSampleQuestion(key as keyof typeof SAMPLE_QUESTIONS)}
              onDoubleClick={() => handleSampleQuestionDoubleClick(key as keyof typeof SAMPLE_QUESTIONS)}
              className={`h-7 px-sp-3 rounded-pill text-12 font-semibold border transition-all duration-200 inline-flex items-center gap-1.5 ${
                isQuestionActive(key as keyof typeof SAMPLE_QUESTIONS)
                  ? 'bg-[#E7F3FF] text-primary border-primary'
                  : 'bg-surface border-border text-text-primary hover:bg-canvas'
              }`}
            >
              {getSampleQuestionIcon(key)}
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Answer Rows - tightened to 40px height */}
      <div className="space-y-sp-2">
        {qualifier.options?.map((option: string, idx: number) => (
          <div key={idx}>
            <div className="meta-drag-layout h-10 items-center">
              <div className="meta-drag-handle">
                <DragHandleButton />
              </div>
              <input
                type="text"
                value={option}
                onChange={(e) => onUpdateOption(qualifier.id, idx, e.target.value)}
                className="flex-1 h-10 px-sp-3 border border-border rounded-md bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors duration-200"
                placeholder={`Answer ${idx + 1}`}
              />
              {conditionalLogicEnabled && (
                <LogicPill
                  action={null}
                />
              )}
              <RemoveIconButton
                onClick={() => onRemoveOption(qualifier.id, idx)}
                disabled={qualifier.options?.length <= 1}
              />
              <AddIconButton
                onClick={() => onAddOption(qualifier.id)}
              />
            </div>
            {/* Apply to all checkbox - only show under Answer 1 when logic is enabled */}
            {conditionalLogicEnabled && idx === 0 && qualifier.options?.length > 1 && (
              <div className="ml-10 mt-sp-2">
                <label className="flex items-center gap-sp-2">
                  <input
                    type="checkbox"
                    className="meta-checkbox"
                  />
                  <span className="text-12 text-text-secondary">
                    Apply this logic to all answers below
                  </span>
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new answer button */}
      {(!qualifier.options || qualifier.options.length === 0) && (
        <button
          onClick={() => onAddOption(qualifier.id)}
          className="flex items-center gap-sp-2 px-sp-3 py-sp-2 text-14 text-primary hover:bg-[#E7F3FF] rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add answer
        </button>
      )}
    </div>
  );
};

export const QuestionsSection: React.FC = () => {
  const { activeForm, addQualifier, updateQualifier, removeQualifier, reorderQualifiers } = useFormStore();
  const [isConditionalModalOpen, setIsConditionalModalOpen] = useState(false);

  if (!activeForm) return null;

  // Check if there's already an appointment request question
  const hasAppointmentRequest = activeForm.qualifiers.some(q => q.type === 'appointment_request');

  const handleAddQuestion = () => {
    if (activeForm.qualifiers.length >= 3) {
      alert('Maximum 3 screening questions allowed');
      return;
    }

    addQualifier({
      question: '',
      type: 'multiple_choice',
      options: ['', '', ''],
      required: true,
      allowMultipleResponses: false
    });
  };

  const handleUpdateQuestion = (id: string, field: keyof ExtendedQualifier, value: unknown) => {
    updateQualifier(id, { [field]: value });
  };

  const handleAddOption = (questionId: string) => {
    const question = activeForm.qualifiers.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options, ''];
      updateQualifier(questionId, { options: newOptions });
    }
  };

  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    const question = activeForm.qualifiers.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 1) {
      const newOptions = question.options.filter((_, idx) => idx !== optionIndex);
      updateQualifier(questionId, { options: newOptions });
    }
  };

  const handleUpdateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = activeForm.qualifiers.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQualifier(questionId, { options: newOptions });
    }
  };

  const handleConditionalLogicSave = (conditionalQuestions: ExtendedQualifier[]) => {
    // Here we would integrate with the form store to save conditional logic
  };

  const handleQuestionDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(activeForm.qualifiers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values to match new positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    reorderQualifiers(updatedItems);
  };

  const handleOptionDragEnd = (result: DropResult, questionId: string) => {
    if (!result.destination) return;

    const question = activeForm.qualifiers.find(q => q.id === questionId);
    if (!question || !question.options) return;

    const items = Array.from(question.options);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    updateQualifier(questionId, { options: items });
  };

  return (
    <section className="meta-card-grid">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-surface-900">
          Questions
          <span className="text-sm text-surface-500 font-normal ml-2">• Optional</span>
        </h3>
      </div>

      <p className="text-sm text-surface-600">
        Add questions to your form to better understand your leads.
      </p>

      <DragDropContext onDragEnd={handleQuestionDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="meta-card-grid"
            >
              {activeForm.qualifiers.map((qualifier, index) => (
                <Draggable key={qualifier.id} draggableId={qualifier.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`meta-card-padding relative transition-shadow ${
                        snapshot.isDragging ? 'shadow-elevated ring-2 ring-primary' : ''
                      }`}
                    >
                      {/* Question Header */}
                      <div className="meta-drag-layout mb-sp-4">
                        <div className="meta-drag-handle" {...provided.dragHandleProps}>
                          <DragHandleButton />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-sp-3">
                            <span className="font-medium text-surface-900">
                              {qualifier.type === 'multiple_choice' ? 'Multiple choice' :
                               qualifier.type === 'appointment_request' ? 'Appointment request' : 'Short answer'}
                            </span>
                            {qualifier.type === 'multiple_choice' && (
                              <label className="flex items-center gap-2 text-sm ml-sp-3">
                                <input
                                  type="checkbox"
                                  checked={qualifier.conditionalLogicEnabled || false}
                                  onChange={(e) => handleUpdateQuestion(qualifier.id, 'conditionalLogicEnabled', e.target.checked)}
                                  className="rounded text-primary-600 focus:ring-primary-500"
                                />
                                Conditional Logic
                              </label>
                            )}
                            <div className="ml-auto flex items-center">
                              <label className={`flex items-center gap-2 text-sm ${
                                qualifier.type === 'multiple_choice' && qualifier.conditionalLogicEnabled ? 'opacity-50 cursor-not-allowed' : ''
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={!qualifier.required}
                                  onChange={(e) => !qualifier.conditionalLogicEnabled && handleUpdateQuestion(qualifier.id, 'required', !e.target.checked)}
                                  disabled={qualifier.type === 'multiple_choice' && qualifier.conditionalLogicEnabled}
                                  className="rounded text-primary-600 focus:ring-primary-500"
                                />
                                Optional
                              </label>
                              <div className="w-px h-4 bg-border mx-sp-3"></div>
                              <DeleteIconButton
                                onClick={() => removeQualifier(qualifier.id)}
                                title="Remove question"
                              />
                            </div>
                          </div>

                          {/* Question Text */}
                          <div className="mb-sp-4">
                            <label className="meta-label">
                              {qualifier.type === 'appointment_request' ? 'Question' : `Question ${index + 1}`}
                              {qualifier.type === 'appointment_request' && (
                                <span className="text-xs text-surface-500 ml-2">
                                  {qualifier.question.length}/80
                                </span>
                              )}
                            </label>
                            <input
                              type="text"
                              value={qualifier.question}
                              onChange={(e) => handleUpdateQuestion(qualifier.id, 'question', e.target.value)}
                              maxLength={qualifier.type === 'appointment_request' ? 80 : undefined}
                              className="meta-input w-full"
                              placeholder={qualifier.type === 'appointment_request' ?
                                "When would you like to schedule a consultation?" :
                                "Example: How soon are you looking to buy?"}
                            />
                            {qualifier.type === 'multiple_choice' && qualifier.conditionalLogicEnabled && (
                              <p className="text-12 text-text-secondary mt-1">
                                Optional is disabled when Conditional Logic is on.
                              </p>
                            )}
                          </div>

                          {/* Question Type Toggle */}
                          <div className="mb-sp-4">
                            <div className="flex gap-sp-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuestion(qualifier.id, 'type', 'multiple_choice')}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                  qualifier.type === 'multiple_choice'
                                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                                    : 'bg-white text-surface-600 border border-surface-300 hover:bg-surface-50'
                                }`}
                              >
                                Multiple Choice
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuestion(qualifier.id, 'type', 'short_text')}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                  qualifier.type === 'short_text'
                                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                                    : 'bg-white text-surface-600 border border-surface-300 hover:bg-surface-50'
                                }`}
                              >
                                Short Answer
                              </button>
                              <button
                                type="button"
                                onClick={() => !hasAppointmentRequest && handleUpdateQuestion(qualifier.id, 'type', 'appointment_request')}
                                disabled={hasAppointmentRequest && qualifier.type !== 'appointment_request'}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                  qualifier.type === 'appointment_request'
                                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                                    : hasAppointmentRequest
                                    ? 'bg-surface-100 text-surface-400 border border-surface-200 cursor-not-allowed'
                                    : 'bg-white text-surface-600 border border-surface-300 hover:bg-surface-50'
                                }`}
                                title={hasAppointmentRequest && qualifier.type !== 'appointment_request' ?
                                  'Only one appointment request allowed per form' : ''}
                              >
                                <Calendar className="w-4 h-4 inline-block mr-1" />
                                Appointment Request
                              </button>
                            </div>
                          </div>

                          {/* Multiple Choice Options with Conditional Logic */}
                          {qualifier.type === 'multiple_choice' && (
                            <ConditionalLogicSection
                              qualifier={qualifier}
                              onUpdateQuestion={handleUpdateQuestion}
                              onAddOption={handleAddOption}
                              onRemoveOption={handleRemoveOption}
                              onUpdateOption={handleUpdateOption}
                            />
                          )}

                          {/* Appointment Request Confirmation Message */}
                          {qualifier.type === 'appointment_request' && (
                            <div className="space-y-sp-3">
                              <div className="flex items-center gap-sp-2">
                                <label className="text-sm font-medium text-surface-700">
                                  Confirmation message
                                </label>
                                <input
                                  type="checkbox"
                                  checked={qualifier.showConfirmationMessage || false}
                                  onChange={(e) => handleUpdateQuestion(qualifier.id, 'showConfirmationMessage', e.target.checked)}
                                  className="meta-checkbox"
                                />
                              </div>

                              {qualifier.showConfirmationMessage && (
                                <div>
                                  <textarea
                                    value={qualifier.confirmationMessage || ''}
                                    onChange={(e) => handleUpdateQuestion(qualifier.id, 'confirmationMessage', e.target.value)}
                                    maxLength={100}
                                    className="meta-textarea w-full min-h-20"
                                    placeholder="Someone will reach out to confirm your requested appointment."
                                  />
                                  <div className="text-12 text-text-muted text-right mt-sp-1">
                                    {(qualifier.confirmationMessage || '').length}/100
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="meta-card-grid">
        {/* Add Question Button */}
        <Button
          onClick={handleAddQuestion}
          disabled={activeForm.qualifiers.length >= 3}
          variant="outline"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add question
        </Button>

        {activeForm.qualifiers.length >= 3 && (
          <p className="text-sm text-surface-500 text-center">
            Maximum of 3 screening questions reached
          </p>
        )}
      </div>

      {/* Conditional Logic Builder Modal */}
      <ConditionalLogicBuilder
        isOpen={isConditionalModalOpen}
        onClose={() => setIsConditionalModalOpen(false)}
        onSave={handleConditionalLogicSave}
      />
    </section>
  );
};