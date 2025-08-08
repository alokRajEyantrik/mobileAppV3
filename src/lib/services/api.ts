// Types for the API responses
export interface SubmitApplicationResponse {
    success: boolean;
    applicationId?: string;
    message: string;
}

export interface ApplicationData {
    [key: string]: any;  // This should be replaced with your actual application data structure
}

/**
 * Submits a loan application to the server
 * @param data The application data to submit
 * @returns A promise that resolves to the server response
 */
export async function submitApplication(data: ApplicationData): Promise<SubmitApplicationResponse> {
    const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
    }

    return response.json();
}
