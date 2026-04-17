import { StrictMode, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { I18nProvider } from './lib/i18n.tsx';

const ERROR_TEXTS: Record<string, { title: string; msg: string; reload: string }> = {
  en: { title: 'SYSTEM MALFUNCTION', msg: 'An unexpected error occurred. Please reload the page to continue.', reload: 'RELOAD' },
  es: { title: 'ERROR DEL SISTEMA', msg: 'Ocurrió un error inesperado. Recarga la página para continuar.', reload: 'RECARGAR' },
  ko: { title: '시스템 오류', msg: '예기치 않은 오류가 발생했습니다. 페이지를 새로고침하세요.', reload: '새로고침' },
  ja: { title: 'システムエラー', msg: '予期しないエラーが発生しました。ページを再読み込みしてください。', reload: '再読み込み' },
  zh: { title: '系统故障', msg: '发生意外错误。请重新加载页面以继续。', reload: '重新加载' },
};

function getErrorTexts() {
  const saved = localStorage.getItem('battleship-locale');
  return ERROR_TEXTS[saved || 'en'] || ERROR_TEXTS.en;
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const txt = getErrorTexts();
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0e1a',
          color: '#5a82b4',
          fontFamily: 'Orbitron, sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}>
          <h1 style={{ color: '#ff3366', fontSize: '1.5rem', marginBottom: '1rem' }}>
            {txt.title}
          </h1>
          <p style={{ marginBottom: '2rem', maxWidth: '400px' }}>
            {txt.msg}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 2rem',
              background: 'transparent',
              border: '1px solid #00d4ff',
              color: '#00d4ff',
              fontFamily: 'Orbitron, sans-serif',
              cursor: 'pointer',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              letterSpacing: '0.1em',
            }}
          >
            {txt.reload}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
);
