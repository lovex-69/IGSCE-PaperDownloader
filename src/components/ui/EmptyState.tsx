import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../../lib/theme';
import { Button } from './Button';

interface EmptyStateProps {
    variant: 'no-results' | 'no-answers' | 'search-error' | 'empty';
    title?: string;
    message?: string;
    suggestions?: string[];
    onRetry?: () => void;
    onSuggestionPress?: (suggestion: string) => void;
}

const icons = {
    'no-results': '🔍',
    'no-answers': '📝',
    'search-error': '⚠️',
    'empty': '📂',
};

const defaultMessages = {
    'no-results': {
        title: 'No papers found',
        message: 'We couldn\'t find any papers matching your search. Try different keywords or browse by exam.',
    },
    'no-answers': {
        title: 'Answer key not available',
        message: 'The answer sheet for this paper is not available yet. We\'re working on adding it.',
    },
    'search-error': {
        title: 'Search failed',
        message: 'Something went wrong while searching. Please try again.',
    },
    'empty': {
        title: 'Nothing here yet',
        message: 'This section is empty. Check back later for updates.',
    },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
    variant,
    title,
    message,
    suggestions = [],
    onRetry,
    onSuggestionPress,
}) => {
    const defaultContent = defaultMessages[variant];

    return (
        <View style={styles.container}>
            <Text style={styles.icon}>{icons[variant]}</Text>
            <Text style={styles.title}>{title || defaultContent.title}</Text>
            <Text style={styles.message}>{message || defaultContent.message}</Text>

            {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsLabel}>Try searching for:</Text>
                    <View style={styles.suggestions}>
                        {suggestions.map((suggestion, index) => (
                            <Button
                                key={index}
                                title={suggestion}
                                variant="outline"
                                size="sm"
                                onPress={() => onSuggestionPress?.(suggestion)}
                                style={styles.suggestionButton}
                            />
                        ))}
                    </View>
                </View>
            )}

            {onRetry && variant === 'search-error' && (
                <Button
                    title="Try Again"
                    variant="primary"
                    onPress={onRetry}
                    style={styles.retryButton}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    icon: {
        fontSize: 64,
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    message: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 300,
    },
    suggestionsContainer: {
        marginTop: theme.spacing.lg,
        alignItems: 'center',
    },
    suggestionsLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    suggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    suggestionButton: {
        marginBottom: theme.spacing.xs,
    },
    retryButton: {
        marginTop: theme.spacing.lg,
    },
});
