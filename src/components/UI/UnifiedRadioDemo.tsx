import React, { useState } from 'react';
import { MetaCard } from './MetaCard';
import { RadioGroup } from './RadioGroup';

export const UnifiedRadioDemo: React.FC = () => {
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [adminAccess, setAdminAccess] = useState('');
  const [campaignObjective, setCampaignObjective] = useState('');

  return (
    <div className="p-sp-6 bg-canvas min-h-screen">
      <div className="max-w-4xl mx-auto space-y-sp-4">

        <MetaCard>
          <h2 className="text-20 font-semibold text-primary mb-sp-4">
            Unified RadioGroup - Consistent Everywhere
          </h2>
          <p className="text-14 text-text-secondary mb-sp-6">
            Same component, same behavior - only container width changes for different layouts.
          </p>

          {/* Normal width - for compact forms */}
          <div className="mb-sp-6">
            <h3 className="text-16 font-semibold text-primary mb-sp-3">Normal Width</h3>
            <RadioGroup
              name="privacy-normal"
              value={privacyPolicy}
              onChange={setPrivacyPolicy}
              label="Privacy Policy Status"
              containerWidth="normal"
              options={[
                { value: 'yes', label: 'Published and accessible' },
                { value: 'not_sure', label: 'Need to verify' },
                { value: 'no', label: 'Not published' }
              ]}
            />
          </div>

          {/* Wide width - for Campaign Brief style */}
          <div className="mb-sp-6">
            <h3 className="text-16 font-semibold text-primary mb-sp-3">Wide Width (Campaign Brief Style)</h3>
            <RadioGroup
              name="admin-wide"
              value={adminAccess}
              onChange={setAdminAccess}
              label="Facebook Page Admin Access Status *"
              containerWidth="wide"
              options={[
                {
                  value: 'yes',
                  label: 'Full access confirmed',
                  description: 'Admin and Leads access granted'
                },
                {
                  value: 'pending',
                  label: 'Pending access',
                  description: 'Waiting for permissions'
                },
                {
                  value: 'no',
                  label: 'Limited access',
                  description: 'Missing required permissions'
                }
              ]}
            />
          </div>

          {/* Full width - takes all available space */}
          <div>
            <h3 className="text-16 font-semibold text-primary mb-sp-3">Full Width</h3>
            <RadioGroup
              name="campaign-full"
              value={campaignObjective}
              onChange={setCampaignObjective}
              label="Campaign Objective"
              containerWidth="full"
              options={[
                {
                  value: 'leads',
                  label: 'Generate Leads',
                  description: 'Collect contact information from potential customers'
                },
                {
                  value: 'appointments',
                  label: 'Book Appointments',
                  description: 'Schedule consultations or service calls'
                },
                {
                  value: 'quotes',
                  label: 'Request Quotes',
                  description: 'Gather information for custom pricing'
                }
              ]}
            />
          </div>
        </MetaCard>

        {/* Key specs demonstration */}
        <MetaCard variant="border">
          <h2 className="text-20 font-semibold text-primary mb-sp-4">
            Design Specifications Met
          </h2>
          <div className="space-y-sp-3 text-14">
            <div className="flex items-center gap-sp-2">
              <span className="w-2 h-2 bg-success rounded-full"></span>
              <span>40-44px tall containers with 12px vertical padding</span>
            </div>
            <div className="flex items-center gap-sp-2">
              <span className="w-2 h-2 bg-success rounded-full"></span>
              <span>8-12px horizontal padding inside cards</span>
            </div>
            <div className="flex items-center gap-sp-2">
              <span className="w-2 h-2 bg-success rounded-full"></span>
              <span>Entire row clickable hit area</span>
            </div>
            <div className="flex items-center gap-sp-2">
              <span className="w-2 h-2 bg-success rounded-full"></span>
              <span>18px outer circle, 8px inner filled when selected</span>
            </div>
            <div className="flex items-center gap-sp-2">
              <span className="w-2 h-2 bg-success rounded-full"></span>
              <span>Label 14/20 --text-primary, description 12/18 --text-secondary</span>
            </div>
            <div className="flex items-center gap-sp-2">
              <span className="w-2 h-2 bg-success rounded-full"></span>
              <span>8px spacing between rows</span>
            </div>
            <div className="flex items-center gap-sp-2">
              <span className="w-2 h-2 bg-success rounded-full"></span>
              <span>Border --border, selected ring --brand</span>
            </div>
            <div className="flex items-center gap-sp-2">
              <span className="w-2 h-2 bg-success rounded-full"></span>
              <span>Container width changes only - NOT padding!</span>
            </div>
          </div>
        </MetaCard>

        {/* Usage examples */}
        <MetaCard>
          <h2 className="text-20 font-semibold text-primary mb-sp-4">
            Usage Examples
          </h2>
          <div className="space-y-sp-4">
            <div className="bg-surface-old-50 p-sp-4 rounded-md">
              <h4 className="text-14 font-semibold mb-sp-2">Campaign Brief (Wide)</h4>
              <pre className="text-12 text-text-secondary overflow-x-auto">
{`<RadioGroup
  name="adminAccess"
  value={adminAccess}
  onChange={setAdminAccess}
  label="Facebook Page Admin Access Status *"
  containerWidth="wide"
  options={accessOptions}
/>`}
              </pre>
            </div>

            <div className="bg-surface-old-50 p-sp-4 rounded-md">
              <h4 className="text-14 font-semibold mb-sp-2">Form Fields (Normal)</h4>
              <pre className="text-12 text-text-secondary overflow-x-auto">
{`<RadioGroup
  name="privacyPolicy"
  value={privacyPolicy}
  onChange={setPrivacyPolicy}
  containerWidth="normal"
  options={privacyOptions}
/>`}
              </pre>
            </div>
          </div>
        </MetaCard>
      </div>
    </div>
  );
};