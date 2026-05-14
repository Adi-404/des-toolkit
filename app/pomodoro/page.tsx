import type { Metadata } from 'next';
import Pomodoro from '@/components/Pomodoro';

export const metadata: Metadata = {
    title: 'Pomodoro',
    description: 'Focus timer with optional AI-powered posture monitoring via webcam.',
};

export default function PomodoroPage() {
    return <Pomodoro />;
}
