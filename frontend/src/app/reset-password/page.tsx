import { Suspense } from 'react';
import { Loader, Container, Card, Title, Text } from '@mantine/core';
import ResetPasswordForm from './ResetPasswordForm';

// Loading component for Suspense fallback
function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Container size="xs">
        <Card shadow="md" radius="lg" className="text-center">
          <Loader size="xl" className="mb-4" />
          <Title order={3} className="mb-2">
            Loading Reset Password...
          </Title>
          <Text c="dimmed">
            Please wait while we prepare the reset password form.
          </Text>
        </Card>
      </Container>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}