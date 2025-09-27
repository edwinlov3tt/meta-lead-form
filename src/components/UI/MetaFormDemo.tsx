import React, { useState } from 'react';
import { MetaCard } from './MetaCard';
import { MetaButton } from './MetaButton';
import { MetaInput, MetaTextarea, MetaSelect } from './MetaInput';
import { MetaRadio, MetaCheckbox, MetaRadioGroup, MetaCheckboxGroup, MetaRadioCustom } from './MetaRadioCheckbox';

export const MetaFormDemo: React.FC = () => {
  const [radioValue, setRadioValue] = useState('option1');
  const [checkboxes, setCheckboxes] = useState({
    option1: false,
    option2: false,
    option3: false,
  });

  return (
    <div className="p-sp-6 bg-canvas min-h-screen">
      <div className="max-w-4xl mx-auto space-y-sp-4">

        {/* Buttons Demo */}
        <MetaCard>
          <h2 className="text-20 font-semibold text-primary mb-sp-4">Buttons</h2>
          <div className="space-y-sp-3">
            <div className="flex gap-sp-3">
              <MetaButton>Primary Button</MetaButton>
              <MetaButton variant="secondary">Secondary Button</MetaButton>
            </div>
            <div>
              <MetaButton fullWidth>Full Width Button</MetaButton>
            </div>
          </div>
        </MetaCard>

        {/* Input Fields Demo */}
        <MetaCard>
          <h2 className="text-20 font-semibold text-primary mb-sp-4">Input Fields</h2>
          <div className="space-y-sp-4">
            <MetaInput
              label="Email Address"
              placeholder="john@example.com"
              type="email"
            />
            <MetaInput
              label="Password"
              placeholder="Enter your password"
              type="password"
              helperText="Must be at least 8 characters"
            />
            <MetaInput
              label="Error Example"
              placeholder="This field has an error"
              error="This field is required"
            />
            <MetaSelect
              label="Country"
              options={[
                { value: '', label: 'Select a country' },
                { value: 'us', label: 'United States' },
                { value: 'uk', label: 'United Kingdom' },
                { value: 'ca', label: 'Canada' },
              ]}
            />
            <MetaTextarea
              label="Message"
              placeholder="Enter your message here..."
              rows={4}
            />
          </div>
        </MetaCard>

        {/* Radio Buttons Demo */}
        <MetaCard>
          <h2 className="text-20 font-semibold text-primary mb-sp-4">Radio Buttons</h2>
          <MetaRadioGroup label="Select an option">
            <MetaRadio
              name="demo-radio"
              value="option1"
              checked={radioValue === 'option1'}
              onChange={(e) => setRadioValue(e.target.value)}
              label="Option 1"
              description="This is a description for option 1"
            />
            <MetaRadio
              name="demo-radio"
              value="option2"
              checked={radioValue === 'option2'}
              onChange={(e) => setRadioValue(e.target.value)}
              label="Option 2"
              description="This is a description for option 2"
            />
            <MetaRadio
              name="demo-radio"
              value="option3"
              checked={radioValue === 'option3'}
              onChange={(e) => setRadioValue(e.target.value)}
              label="Option 3"
            />
          </MetaRadioGroup>
        </MetaCard>

        {/* Checkboxes Demo */}
        <MetaCard>
          <h2 className="text-20 font-semibold text-primary mb-sp-4">Checkboxes</h2>
          <MetaCheckboxGroup label="Select multiple options">
            <MetaCheckbox
              checked={checkboxes.option1}
              onChange={(e) => setCheckboxes({ ...checkboxes, option1: e.target.checked })}
              label="Option 1"
              description="Description for checkbox option 1"
            />
            <MetaCheckbox
              checked={checkboxes.option2}
              onChange={(e) => setCheckboxes({ ...checkboxes, option2: e.target.checked })}
              label="Option 2"
              description="Description for checkbox option 2"
            />
            <MetaCheckbox
              checked={checkboxes.option3}
              onChange={(e) => setCheckboxes({ ...checkboxes, option3: e.target.checked })}
              label="Option 3"
            />
          </MetaCheckboxGroup>
        </MetaCard>

        {/* Custom Radio Style (for special use cases) */}
        <MetaCard>
          <h2 className="text-20 font-semibold text-primary mb-sp-4">Custom Radio Style</h2>
          <div className="space-y-2">
            <MetaRadioCustom
              name="custom-radio"
              value="custom1"
              checked={radioValue === 'custom1'}
              onChange={(e) => setRadioValue(e.target.value)}
              label="Premium Plan"
              description="$99/month - All features included"
            />
            <MetaRadioCustom
              name="custom-radio"
              value="custom2"
              checked={radioValue === 'custom2'}
              onChange={(e) => setRadioValue(e.target.value)}
              label="Standard Plan"
              description="$49/month - Most popular choice"
            />
            <MetaRadioCustom
              name="custom-radio"
              value="custom3"
              checked={radioValue === 'custom3'}
              onChange={(e) => setRadioValue(e.target.value)}
              label="Basic Plan"
              description="$19/month - Essential features only"
            />
          </div>
        </MetaCard>

        {/* Form Example */}
        <MetaCard variant="border">
          <h2 className="text-20 font-semibold text-primary mb-sp-4">Complete Form Example</h2>
          <form className="space-y-sp-4">
            <div className="grid grid-cols-2 gap-sp-4">
              <MetaInput
                label="First Name"
                placeholder="John"
              />
              <MetaInput
                label="Last Name"
                placeholder="Doe"
              />
            </div>

            <MetaInput
              label="Email"
              type="email"
              placeholder="john@example.com"
            />

            <MetaRadioGroup label="Account Type">
              <MetaRadio
                name="account-type"
                value="personal"
                label="Personal"
                description="For individual use"
              />
              <MetaRadio
                name="account-type"
                value="business"
                label="Business"
                description="For company use"
              />
            </MetaRadioGroup>

            <MetaCheckboxGroup>
              <MetaCheckbox
                label="I agree to the terms and conditions"
              />
              <MetaCheckbox
                label="Subscribe to newsletter"
                description="Get updates about new features"
              />
            </MetaCheckboxGroup>

            <div className="flex gap-sp-3 pt-sp-3">
              <MetaButton type="submit">Submit</MetaButton>
              <MetaButton type="button" variant="secondary">Cancel</MetaButton>
            </div>
          </form>
        </MetaCard>
      </div>
    </div>
  );
};