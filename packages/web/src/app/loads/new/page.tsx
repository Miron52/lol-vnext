import { Suspense } from 'react';
import { NewLoadContent } from './NewLoadContent';

export default function NewLoadPage() {
  return (
    <Suspense fallback={<main style={{ padding: '2rem' }}>Loading...</main>}>
      <NewLoadContent />
    </Suspense>
  );
}
