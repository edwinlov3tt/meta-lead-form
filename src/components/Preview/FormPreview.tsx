import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useFormStore } from '@/stores/formStore';
import { MetaFormCardV2 } from './MetaFormCardV2';
import { Button } from '@/components/UI/Button';

export const FormPreview: React.FC = () => {
  const { activeForm, currentStep, setCurrentStep, frictionScore, preFormBrief } = useFormStore();
  const [showTooltip, setShowTooltip] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop;
      const maxScroll = 200; // Fade out over 200px of scroll
      const opacity = Math.max(0.5, 1 - (scrollTop / maxScroll));
      setScrollOpacity(opacity);
    };

    const scrollContainer = document.querySelector('.preview-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (!activeForm) return null;

  const maxSteps = activeForm.formType === 'higher_intent' ? 5 : 4;
  const stepLabels = [
    'Intro',
    'Questions',
    'Contact Info',
    activeForm.formType === 'higher_intent' ? 'Review' : 'Privacy',
    activeForm.formType === 'higher_intent' ? 'Privacy' : 'Thank You',
    ...(activeForm.formType === 'higher_intent' ? ['Thank You'] : [])
  ];

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < maxSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const getDotColor = (level: string) => {
    switch (level) {
      case 'low': return '#31A24C'; // green
      case 'medium': return '#F7B928'; // yellow
      case 'high': return '#E41E3F'; // red
      default: return '#8A8D91'; // gray
    }
  };

  return (
    <div className="sticky top-0 h-screen bg-canvas flex flex-col">
      {/* Premium Sticky Friction Badge Container */}
      <div className="sticky top-0 z-10 w-full">
        {/* 48px Top Fade Background */}
        <div
          className="absolute inset-x-0 top-0 h-12 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, #F0F2F5 100%)',
            opacity: scrollOpacity
          }}
        />

        {/* Chip Container - positioned under preview header */}
        <div className="relative h-12 flex items-center justify-center">
          <div className="relative">
            {/* Premium Friction Chip - 28px height */}
            <div className="h-7 px-3 rounded-full bg-white border border-border flex items-center gap-2 shadow-sm"
                 style={{ height: '28px' }}>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getDotColor(frictionScore.level) }}
              ></div>
              <span className="text-12 text-surface-900" style={{ fontWeight: 600 }}>
                Friction: {frictionScore.level.charAt(0).toUpperCase() + frictionScore.level.slice(1)} ({frictionScore.total})
              </span>
              <button
                className="p-0.5 hover:bg-surface-100 rounded transition-colors"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                title="Friction Score Information"
              >
                <Info className="w-3 h-3 text-surface-400" />
              </button>
            </div>

          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-4 bg-surface-900 text-white rounded-lg shadow-lg z-20 text-sm w-80">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-white mb-1">Friction Score</h4>
                  <p className="text-surface-200">
                    Measures how difficult your form is to complete. Lower scores typically result in higher conversion rates.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-white">Breakdown:</h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-surface-300">Required Fields (F):</span>
                      <span className="text-white">1.0 point each</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-300">Qualifying Questions (Q):</span>
                      <span className="text-white">1.5 points each</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-300">Custom Consents (C):</span>
                      <span className="text-white">0.5 points each</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h5 className="font-medium text-white">Score Levels:</h5>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-surface-300">Low (0-2.9): High conversion potential</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-surface-300">Medium (3-4.9): Moderate friction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-surface-300">High (5+): May impact completion rates</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="preview-scroll-container flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          {/* Meta Form Top Navigation - Horizontal Layout */}
        <div className="w-80 h-9 flex items-center justify-between mb-4">
          {/* Title on left */}
          <div className="text-[14px] font-bold text-surface-900">
            {stepLabels[currentStep] || 'Preview'}
          </div>
          {/* Navigation controls on right */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-surface-100 transition-colors"
              style={{
                color: currentStep > 0 ? '#1C1E21' : '#8A8D91'
              }}
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="text-[12px] text-surface-600 font-medium px-2">
              {currentStep + 1} of {maxSteps}
            </span>
            <button
              onClick={handleNextStep}
              disabled={currentStep >= maxSteps - 1}
              className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-surface-100 transition-colors"
              style={{
                color: currentStep < maxSteps - 1 ? '#1C1E21' : '#8A8D91'
              }}
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

          {/* Meta Form Preview - Direct */}
          <MetaFormCardV2
            form={activeForm}
            currentStep={currentStep}
            facebookPageData={preFormBrief?.facebookPageData}
          />
        </div>
      </div>
    </div>
  );
};