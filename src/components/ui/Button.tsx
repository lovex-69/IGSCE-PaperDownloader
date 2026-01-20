import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { theme } from '../../lib/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    fullWidth = false,
    style,
}) => {
    const getButtonStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.borderRadius.md,
            gap: theme.spacing.sm,
        };

        // Size
        switch (size) {
            case 'sm':
                baseStyle.paddingHorizontal = theme.spacing.md;
                baseStyle.paddingVertical = theme.spacing.sm;
                break;
            case 'lg':
                baseStyle.paddingHorizontal = theme.spacing.xl;
                baseStyle.paddingVertical = theme.spacing.md;
                break;
            default:
                baseStyle.paddingHorizontal = theme.spacing.lg;
                baseStyle.paddingVertical = theme.spacing.md;
        }

        // Variant
        switch (variant) {
            case 'secondary':
                baseStyle.backgroundColor = theme.colors.secondary;
                break;
            case 'outline':
                baseStyle.backgroundColor = 'transparent';
                baseStyle.borderWidth = 2;
                baseStyle.borderColor = theme.colors.primary;
                break;
            case 'ghost':
                baseStyle.backgroundColor = 'transparent';
                break;
            default:
                baseStyle.backgroundColor = theme.colors.primary;
        }

        if (fullWidth) {
            baseStyle.width = '100%';
        }

        if (disabled || loading) {
            baseStyle.opacity = 0.6;
        }

        return baseStyle;
    };

    const getTextStyle = (): TextStyle => {
        const baseStyle: TextStyle = {
            fontWeight: theme.fontWeight.semibold,
        };

        // Size
        switch (size) {
            case 'sm':
                baseStyle.fontSize = theme.fontSize.sm;
                break;
            case 'lg':
                baseStyle.fontSize = theme.fontSize.lg;
                break;
            default:
                baseStyle.fontSize = theme.fontSize.md;
        }

        // Variant
        switch (variant) {
            case 'outline':
            case 'ghost':
                baseStyle.color = theme.colors.primary;
                break;
            default:
                baseStyle.color = '#ffffff';
        }

        return baseStyle;
    };

    return (
        <TouchableOpacity
            style={[getButtonStyle(), style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#ffffff'}
                />
            ) : (
                <>
                    {icon}
                    <Text style={getTextStyle()}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({});
