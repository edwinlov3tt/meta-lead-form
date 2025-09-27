import React from 'react';
import { MetaCard, SectionHeader, MetaCardSection } from './MetaCard';

// Example usage of Meta design system cards
export const MetaCardExample: React.FC = () => {
  return (
    <div className="space-y-sp-4">
      {/* Example 1: Simple card with shadow (default) */}
      <MetaCard>
        <h3 className="text-16 font-semibold text-primary mb-sp-3">
          Simple Card
        </h3>
        <p className="text-14 text-text-secondary">
          This is a basic card with standard 16px padding and shadow.
        </p>
      </MetaCard>

      {/* Example 2: Card with border variant */}
      <MetaCard variant="border">
        <SectionHeader
          title="Card with Border"
          showDivider={true}
        />
        <div className="mt-sp-3">
          <p className="text-14 text-text-secondary">
            This card uses a border instead of shadow. Useful for form sections.
          </p>
        </div>
      </MetaCard>

      {/* Example 3: Card with section header and action */}
      <MetaCard>
        <SectionHeader
          title="Section with Action"
          action={
            <button className="text-12 text-link hover:underline">
              Edit
            </button>
          }
          showDivider={true}
        />
        <div className="mt-sp-3 space-y-sp-2">
          <div className="flex justify-between items-center">
            <span className="text-14 text-text-primary">Name</span>
            <span className="text-14 text-text-secondary">John Doe</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-14 text-text-primary">Email</span>
            <span className="text-14 text-text-secondary">john@example.com</span>
          </div>
        </div>
      </MetaCard>

      {/* Example 4: Card with multiple sections */}
      <MetaCard variant="border" padding="none">
        <div className="p-sp-4">
          <MetaCardSection
            title="Account Settings"
            action={
              <span className="text-12 px-sp-2 py-1 bg-success text-white rounded-pill">
                Active
              </span>
            }
            showDivider={true}
          >
            <div className="space-y-sp-3">
              <input
                type="text"
                placeholder="Enter your name"
                className="meta-input"
              />
              <input
                type="email"
                placeholder="Enter your email"
                className="meta-input"
              />
            </div>
          </MetaCardSection>
        </div>

        <div className="p-sp-4 border-t border-divider">
          <MetaCardSection
            title="Privacy Settings"
            showDivider={false}
          >
            <div className="space-y-sp-2">
              <label className="flex items-center gap-sp-2">
                <input type="checkbox" className="rounded" />
                <span className="text-14 text-text-primary">
                  Enable notifications
                </span>
              </label>
              <label className="flex items-center gap-sp-2">
                <input type="checkbox" className="rounded" />
                <span className="text-14 text-text-primary">
                  Make profile public
                </span>
              </label>
            </div>
          </MetaCardSection>
        </div>
      </MetaCard>
    </div>
  );
};