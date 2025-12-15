import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language, TranslationKey, translations, getInitialLanguage, saveLanguage } from '../lib/i18n';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
    children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
    const [language, setLanguageState] = useState<Language>(getInitialLanguage);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        saveLanguage(lang);
    }, []);

    const t = useCallback((key: TranslationKey): string => {
        return translations[language][key] || key;
    }, [language]);

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
}
