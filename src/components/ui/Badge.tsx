import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../lib/theme';

interface BadgeProps {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
    size?: 'sm' | 'md';
    icon?: React.ReactNode;
    style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'default',
    size = 'sm',
    icon,
    style,
}) => {
    const getBadgeStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: theme.borderRadius.full,
            gap: 4,
        };

        // Size
        switch (size) {
            case 'md':
                baseStyle.paddingHorizontal = theme.spacing.md;
                baseStyle.paddingVertical = theme.spacing.xs;
                break;
            default:
                baseStyle.paddingHorizontal = theme.spacing.sm;
                baseStyle.paddingVertical = 2;
        }

        // Variant colors
        switch (variant) {
            case 'success':
                baseStyle.backgroundColor = '#dcfce7';
                break;
            case 'warning':
                baseStyle.backgroundColor = '#fef3c7';
                break;
            case 'error':
                baseStyle.backgroundColor = '#fee2e2';
                break;
            case 'info':
                baseStyle.backgroundColor = '#dbeafe';
                break;
            case 'outline':
                baseStyle.backgroundColor = 'transparent';
                baseStyle.borderWidth = 1;
                baseStyle.borderColor = theme.colors.border;
                break;
            default:
                baseStyle.backgroundColor = theme.colors.backgroundDark;
        }

        return baseStyle;
    };

    const getTextStyle = (): TextStyle => {
        const baseStyle: TextStyle = {
            fontWeight: theme.fontWeight.medium,
        };

        // Size
        switch (size) {
            case 'md':
                baseStyle.fontSize = theme.fontSize.sm;
                break;
            default:
                baseStyle.fontSize = theme.fontSize.xs;
        }

        // Variant colors
        switch (variant) {
            case 'success':
                baseStyle.color = '#16a34a';
                break;
            case 'warning':
                baseStyle.color = '#d97706';
                break;
            case 'error':
                baseStyle.color = '#dc2626';
                break;
            case 'info':
                baseStyle.color = '#2563eb';
                break;
            default:
                baseStyle.color = theme.colors.textSecondary;
        }

        return baseStyle;
    };

    return (
        <View style={[getBadgeStyle(), style]}>
            {icon}
            <Text style={getTextStyle()}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({});
