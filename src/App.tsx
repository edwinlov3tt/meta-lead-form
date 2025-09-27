import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AppLayout } from './components/Layout/AppLayout';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { monitoringService } from './services/monitoring';
import './styles/globals.css';

// Initialize monitoring service
monitoringService.trackPageView(window.location.pathname);

function App() {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        monitoringService.logError({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      <DndProvider backend={HTML5Backend}>
        <AppLayout />
      </DndProvider>
    </ErrorBoundary>
  );
}

export default App;