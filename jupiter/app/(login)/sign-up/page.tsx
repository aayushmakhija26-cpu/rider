import { Suspense } from 'react';
import { RegistrationForm } from '@/components/dealer/RegistrationForm';

function RegistrationFormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Create your dealership account
          </h1>
        </div>
        <p className="text-center text-sm text-gray-600 mb-6">
          Join Jupiter and start managing your dealership
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <Suspense fallback={<RegistrationFormFallback />}>
            <RegistrationForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/sign-in" className="font-medium text-orange-500 hover:text-orange-600">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
