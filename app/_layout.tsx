import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const BRAND_COLOR = '#1e3a5f';

export default function RootLayout() {
    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: BRAND_COLOR },
                    headerTintColor: '#ffffff',
                    headerTitleStyle: { fontWeight: '600' },
                    contentStyle: { backgroundColor: '#f8fafc' },
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="subjects"
                    options={{
                        title: 'Select Subject',
                        presentation: 'modal',
                    }}
                />
                <Stack.Screen
                    name="search"
                    options={{ title: 'Question Bank' }}
                />
                <Stack.Screen
                    name="preview"
                    options={{
                        title: 'Preview Paper',
                        presentation: 'card',
                    }}
                />
            </Stack>
        </>
    );
}
