import { redirect } from 'next/navigation';

// Multi-board UI is gone — old per-board URLs land on the single feed.
export default function LegacyBoardPage() {
    redirect('/moodboard');
}
