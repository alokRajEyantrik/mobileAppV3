<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    let applicationId: string | null = null;
    
    onMount(() => {
        applicationId = $page.url.searchParams.get('id');
    });
</script>

<div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div class="text-center">
            <!-- Success Icon -->
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <h2 class="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            
            {#if applicationId}
                <p class="text-gray-600 mb-4">
                    Your application ID is: <span class="font-mono font-medium">{applicationId}</span>
                </p>
            {/if}

            <p class="text-gray-600 mb-8">
                Thank you for submitting your application. Our team will review it and get back to you shortly.
            </p>

            <div class="flex flex-col space-y-4">
                <a
                    href="/"
                    class="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Return to Home
                </a>
                
                {#if applicationId}
                    <button
                        class="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        on:click={() => {
                            navigator.clipboard.writeText(applicationId);
                        }}
                    >
                        Copy Application ID
                    </button>
                {/if}
            </div>
        </div>

        <!-- Additional Information -->
        <div class="mt-8 border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">What happens next?</h3>
            <ul class="space-y-4 text-sm text-gray-600">
                <li class="flex items-start">
                    <span class="flex-shrink-0 h-5 w-5 text-green-500 mr-2">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </span>
                    Our team will review your application within 1-2 business days
                </li>
                <li class="flex items-start">
                    <span class="flex-shrink-0 h-5 w-5 text-green-500 mr-2">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </span>
                    You'll receive an email confirmation shortly
                </li>
                <li class="flex items-start">
                    <span class="flex-shrink-0 h-5 w-5 text-green-500 mr-2">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </span>
                    We may contact you if we need any additional information
                </li>
            </ul>
        </div>

        <!-- Contact Information -->
        <div class="mt-8 border-t border-gray-200 pt-6">
            <p class="text-sm text-gray-600">
                If you have any questions, please contact our support team at
                <a href="mailto:support@example.com" class="text-blue-600 hover:text-blue-500">
                    support@example.com
                </a>
            </p>
        </div>
    </div>
</div>
