import React from 'react';
import { useParams } from 'react-router-dom';
import OrganisationLayout from '../../layouts/OrganisationLayout';
import AIPrompt from '../../components/forms/AIPrompt';
import { useTheme } from '../../context/theme';

const AIAssistant = () => {
  const { id } = useParams();
  const t = useTheme();

  const handleSuccess = (result) => {
    console.log('AI action executed:', result);
    // Optionally, trigger a refresh of relevant data in the parent components
    // For example, if a task was created, you might want to refetch tasks for the organization.
  };

  const handleError = (error) => {
    console.error('AI action failed:', error);
  };

  return (
    <OrganisationLayout organisationName="AI Assistant">
      <div style={{ 
        padding: t.spacing(3),
        backgroundColor: t.colors.pageBackground || t.colors.secondary,
        minHeight: '100vh',
      }}>
        <AIPrompt 
          orgId={id} 
          onSuccess={handleSuccess}
          onError={handleError}
          compact={false}
        />
      </div>
    </OrganisationLayout>
  );
};

export default AIAssistant;
