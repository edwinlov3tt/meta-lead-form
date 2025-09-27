import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useFormStore } from '@/stores/formStore';
import type { ContactField, ContactFieldType } from '@/types/form';
import { Card } from '@/components/UI/Card';
import { MetaChip } from '@/components/UI/MetaChip';
import { RemoveIconButton, DragHandleButton } from '@/components/UI/MetaIconButton';

const CONTACT_FIELD_OPTIONS: Array<{
  name: string;
  type: ContactFieldType;
  required?: boolean;
  placeholder?: string;
}> = [
  { name: 'Full name', type: 'full_name', placeholder: 'John Doe' },
  { name: 'First name', type: 'first_name', placeholder: 'John' },
  { name: 'Last name', type: 'last_name', placeholder: 'Doe' },
  { name: 'Email', type: 'email', required: true, placeholder: 'john@example.com' },
  { name: 'Phone number', type: 'phone', placeholder: '(555) 123-4567' },
  { name: 'Street address', type: 'street_address', placeholder: '123 Main St' },
  { name: 'City', type: 'city', placeholder: 'New York' },
  { name: 'State', type: 'state', placeholder: 'NY' },
  { name: 'Zip code', type: 'zip_code', placeholder: '10001' }
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export const ContactInfoSection: React.FC = () => {
  const { activeForm, updateForm } = useFormStore();

  if (!activeForm) return null;

  const selectedFields = activeForm.contactFields.map(f => f.name);

  // Name field conflict logic and email/phone dependency logic
  const getFieldDisabledState = (fieldName: string) => {
    const hasFirstName = selectedFields.includes('First name');
    const hasLastName = selectedFields.includes('Last name');
    const hasFullName = selectedFields.includes('Full name');
    const hasEmail = selectedFields.includes('Email');
    const hasPhone = selectedFields.includes('Phone number');

    // Name field conflicts
    if (fieldName === 'Full name') {
      return hasFirstName || hasLastName;
    }
    if (fieldName === 'First name' || fieldName === 'Last name') {
      return hasFullName;
    }

    // Email/Phone dependency logic
    if (fieldName === 'Email') {
      // If only email is selected, it cannot be unchecked (must have at least one contact)
      if (hasEmail && !hasPhone) {
        return true;
      }
    }
    if (fieldName === 'Phone number') {
      // If only phone is selected, it cannot be unchecked (must have at least one contact)
      if (hasPhone && !hasEmail) {
        return true;
      }
    }

    return false;
  };

  // Check if a field needs a tooltip for being disabled
  const getDisabledTooltip = (fieldName: string) => {
    const hasEmail = selectedFields.includes('Email');
    const hasPhone = selectedFields.includes('Phone number');

    if ((fieldName === 'Email' && hasEmail && !hasPhone) ||
        (fieldName === 'Phone number' && hasPhone && !hasEmail)) {
      return 'At least one contact method (email or phone) must be present';
    }
    return null;
  };

  // Check if required/optional button should be disabled for email/phone
  const getRequiredButtonDisabled = (fieldName: string) => {
    const hasEmail = selectedFields.includes('Email');
    const hasPhone = selectedFields.includes('Phone number');

    if (!hasEmail || !hasPhone) return false; // If only one contact method, no restrictions

    const emailField = activeForm.contactFields.find(f => f.name === 'Email');
    const phoneField = activeForm.contactFields.find(f => f.name === 'Phone number');

    // If both email and phone are selected, prevent making both optional
    // Disable the button if trying to make this field optional when the other is already optional
    if (fieldName === 'Email' && emailField && emailField.required && phoneField && !phoneField.required) {
      return true; // Can't make email optional if phone is already optional
    }
    if (fieldName === 'Phone number' && phoneField && phoneField.required && emailField && !emailField.required) {
      return true; // Can't make phone optional if email is already optional
    }

    return false;
  };

  const toggleContactField = (fieldOption: typeof CONTACT_FIELD_OPTIONS[0]) => {
    const isCurrentlySelected = selectedFields.includes(fieldOption.name);

    if (isCurrentlySelected) {
      // Remove the field
      const updatedFields = activeForm.contactFields
        .filter(f => f.name !== fieldOption.name)
        .map((f, index) => ({ ...f, order: index }));

      updateForm({ contactFields: updatedFields });
    } else {
      // Add the field
      const newField: ContactField = {
        id: generateId(),
        name: fieldOption.name,
        type: fieldOption.type,
        required: fieldOption.required || false,
        placeholder: fieldOption.placeholder || '',
        autofill: true,
        order: activeForm.contactFields.length
      };

      updateForm({
        contactFields: [...activeForm.contactFields, newField]
      });
    }
  };

  const removeField = (fieldName: string) => {
    const updatedFields = activeForm.contactFields
      .filter(f => f.name !== fieldName)
      .map((f, index) => ({ ...f, order: index }));

    updateForm({ contactFields: updatedFields });
  };

  const toggleRequired = (fieldName: string) => {
    const hasEmail = selectedFields.includes('Email');
    const hasPhone = selectedFields.includes('Phone number');

    let updatedFields = activeForm.contactFields.map(f =>
      f.name === fieldName ? { ...f, required: !f.required } : f
    );

    // If both email and phone are selected and we're making one optional,
    // ensure the other becomes required
    if (hasEmail && hasPhone) {
      const targetField = updatedFields.find(f => f.name === fieldName);
      if (targetField && !targetField.required) {
        // Making the target field optional, so make the other contact method required
        updatedFields = updatedFields.map(f => {
          if ((fieldName === 'Email' && f.name === 'Phone number') ||
              (fieldName === 'Phone number' && f.name === 'Email')) {
            return { ...f, required: true };
          }
          return f;
        });
      }
    }

    updateForm({ contactFields: updatedFields });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(activeForm.contactFields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values to match new positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    updateForm({ contactFields: updatedItems });
  };

  return (
    <Card className="meta-card-padding">
      <h3 className="text-20 font-semibold text-text-primary mb-sp-4">Contact Information</h3>

      {/* Description */}
      <div className="mb-sp-6">
        <label className="meta-label">
          Description <span className="text-text-muted">(optional)</span>
        </label>
        <textarea
          value={activeForm.contactDescription}
          onChange={(e) => updateForm({ contactDescription: e.target.value })}
          className="meta-textarea min-h-20"
          placeholder="Why you're collecting their info and how you'll use it"
        />
        <p className="meta-helper">
          Choose 3–5 fields
        </p>
      </div>

      {/* Selected Fields Zone - Pills */}
      {activeForm.contactFields.length > 0 && (
        <div className="mb-sp-6">
          <h4 className="text-16 font-semibold text-text-primary mb-sp-3">Selected fields</h4>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="selected-fields" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex flex-wrap gap-sp-2"
                >
                  {activeForm.contactFields
                    .sort((a, b) => a.order - b.order)
                    .map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`inline-flex items-center gap-sp-2 h-7 px-sp-3 bg-surface border border-border rounded-pill text-12 font-semibold transition-transform ${
                              snapshot.isDragging ? 'scale-105 shadow-elevated' : ''
                            }`}
                          >
                            <span className="text-text-primary">{field.name}</span>
                            {field.required && (
                              <div className="w-1.5 h-1.5 bg-danger rounded-full" title="Required field" />
                            )}
                            {/* Only show remove button if field is not disabled in available fields */}
                            {!getFieldDisabledState(field.name) && (
                              <button
                                onClick={() => removeField(field.name)}
                                className="w-4 h-4 flex items-center justify-center hover:bg-border rounded-full transition-colors"
                                title="Remove field"
                              >
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M2 2L8 8M8 2L2 8" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Available Fields Checklist */}
      <div>
        <h4 className="text-16 font-semibold text-text-primary mb-sp-3">Available fields</h4>
        <DragDropContext onDragEnd={() => {}}>
          <Droppable droppableId="available-fields">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="meta-row-rhythm"
              >
                {CONTACT_FIELD_OPTIONS.map((fieldOption, index) => {
                  const isSelected = selectedFields.includes(fieldOption.name);
                  const isDisabled = getFieldDisabledState(fieldOption.name);
                  const id = `contact_${fieldOption.name.toLowerCase().replace(/\s+/g, '_')}`;

                  return (
                    <Draggable
                      key={fieldOption.name}
                      draggableId={`available-${fieldOption.name}`}
                      index={index}
                      isDragDisabled={true} // Disable drag for available fields - they're just for visual consistency
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="meta-drag-layout"
                        >
                          <div className="meta-drag-handle" {...provided.dragHandleProps}>
                            <DragHandleButton />
                          </div>
                          <label
                            htmlFor={id}
                            className={`flex-1 flex items-center gap-sp-3 py-sp-2 px-sp-3 cursor-pointer border border-border rounded-md transition-all duration-200 ${
                              isDisabled
                                ? 'opacity-50 cursor-not-allowed bg-canvas'
                                : 'hover:border-primary hover:bg-primary/5'
                            }`}
                            title={getDisabledTooltip(fieldOption.name) || undefined}
                          >
                            <input
                              id={id}
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => !isDisabled && toggleContactField(fieldOption)}
                              className="meta-checkbox"
                              disabled={isDisabled}
                            />
                            <span className={`text-14 flex-1 ${isDisabled ? 'text-text-muted' : 'text-text-primary'}`}>
                              {fieldOption.name}
                              {fieldOption.required && <span className="text-danger ml-1">*</span>}
                            </span>
                            {isSelected && !isDisabled && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (!getRequiredButtonDisabled(fieldOption.name)) {
                                    toggleRequired(fieldOption.name);
                                  }
                                }}
                                disabled={getRequiredButtonDisabled(fieldOption.name)}
                                className={`text-12 px-sp-2 py-0.5 rounded-full transition-colors ${
                                  getRequiredButtonDisabled(fieldOption.name)
                                    ? 'opacity-50 cursor-not-allowed'
                                    : activeForm.contactFields.find(f => f.name === fieldOption.name)?.required
                                    ? 'bg-danger text-white hover:bg-danger/90'
                                    : 'bg-surface border border-border text-text-secondary hover:bg-canvas'
                                }`}
                                title={
                                  getRequiredButtonDisabled(fieldOption.name)
                                    ? 'At least one contact method must be required'
                                    : activeForm.contactFields.find(f => f.name === fieldOption.name)?.required
                                    ? 'Click to make optional'
                                    : 'Click to make required'
                                }
                              >
                                {activeForm.contactFields.find(f => f.name === fieldOption.name)?.required ? 'Required' : 'Optional'}
                              </button>
                            )}
                          </label>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </Card>
  );
};