import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

interface CardProps {
    children: React.ReactNode;
    onPress?: () => void;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
    children,
    onPress,
    variant = 'default',
    padding = 'md',
    style,
}) => {
    const getCardStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            overflow: 'hidden',
        };

        // Padding
        switch (padding) {
            case 'none':
                break;
            case 'sm':
                baseStyle.padding = theme.spacing.sm;
                break;
            case 'lg':
                baseStyle.padding = theme.spacing.lg;
                break;
            default:
                baseStyle.padding = theme.spacing.md;
        }

        // Variant
        switch (variant) {
            case 'elevated':
                Object.assign(baseStyle, theme.shadow.md);
                break;
            case 'outlined':
                baseStyle.borderWidth = 1;
                baseStyle.borderColor = theme.colors.border;
                break;
            default:
                Object.assign(baseStyle, theme.shadow.sm);
        }

        return baseStyle;
    };

    if (onPress) {
        return (
            <Pressable
                style={({ pressed }) => [
                    getCardStyle(),
                    pressed && styles.pressed,
                    style,
                ]}
                onPress={onPress}
            >
                {children}
            </Pressable>
        );
    }

    return <View style={[getCardStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
    pressed: {
        opacity: 0.95,
        transform: [{ scale: 0.98 }],
    },
});
